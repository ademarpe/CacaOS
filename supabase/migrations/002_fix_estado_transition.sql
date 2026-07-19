-- CacaoOS MOD-002: Permitir transición BORRADOR → COMPLETADA
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION validar_estado_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    IF OLD.estado = 'COMPLETADA' AND NEW.estado = 'ANULADA' THEN
      IF NEW.motivo_anulacion IS NULL OR trim(NEW.motivo_anulacion) = '' THEN
        RAISE EXCEPTION 'Se requiere motivo de anulación';
      END IF;
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
