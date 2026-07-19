-- CacaoOS MOD-004: Motivo de anulación opcional
-- Ejecutar en Supabase SQL Editor

-- 1. Trigger: eliminar validación de motivo obligatorio al anular
CREATE OR REPLACE FUNCTION validar_estado_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    IF OLD.estado = 'COMPLETADA' AND NEW.estado = 'ANULADA' THEN
      NULL; -- motivo_anulacion es opcional ahora
    ELSIF OLD.estado = 'BORRADOR' AND NEW.estado IN ('PENDIENTE_PAGO', 'COMPLETADA') THEN
      NULL;
    ELSIF OLD.estado = 'PENDIENTE_PAGO' AND NEW.estado = 'COMPLETADA' THEN
      NULL;
    ELSIF OLD.estado = 'COMPLETADA' AND NEW.estado = 'ANULADA' THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Transición de estado no permitida: % -> %', OLD.estado, NEW.estado;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. RPC: aceptar p_motivo como opcional (nullable)
CREATE OR REPLACE FUNCTION anular_compra(p_compra_id UUID, p_motivo TEXT DEFAULT NULL)
RETURNS compras AS $$
DECLARE
  v_compra compras;
  v_mov movimientos_caja;
BEGIN
  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF v_compra.estado != 'COMPLETADA' THEN
    RAISE EXCEPTION 'Solo se pueden anular compras completadas';
  END IF;

  SELECT * INTO v_mov FROM movimientos_caja WHERE compra_id = p_compra_id;

  UPDATE compras
  SET estado = 'ANULADA',
      motivo_anulacion = p_motivo,
      updated_at = now()
  WHERE id = p_compra_id
  RETURNING * INTO v_compra;

  IF v_mov IS NOT NULL THEN
    UPDATE caja_sesiones
    SET saldo_actual = saldo_actual + v_mov.monto
    WHERE id = v_mov.caja_sesion_id;
  END IF;

  RETURN v_compra;
END;
$$ LANGUAGE plpgsql;
