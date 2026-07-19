-- CacaoOS MOD-003: Editar compra completada + eliminar borrador

-- Función: editar compra completada (ajusta caja y movimiento)
CREATE OR REPLACE FUNCTION editar_compra_completada(
  p_compra_id UUID,
  p_peso DECIMAL(10,2) DEFAULT NULL,
  p_precio DECIMAL(10,2) DEFAULT NULL
) RETURNS compras AS $$
DECLARE
  v_compra compras;
  v_old_total DECIMAL(12,2);
  v_new_total DECIMAL(12,2);
  v_diff DECIMAL(12,2);
  v_caja caja_sesiones;
BEGIN
  -- Lock compra
  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Compra no encontrada';
  END IF;
  IF v_compra.estado != 'COMPLETADA' THEN
    RAISE EXCEPTION 'Solo se pueden editar compras completadas';
  END IF;

  v_old_total := v_compra.total;

  -- Actualizar peso/precio (trigger recalcula total automáticamente)
  UPDATE compras
  SET
    peso = COALESCE(p_peso, peso),
    precio_aplicado = COALESCE(p_precio, precio_aplicado)
  WHERE id = p_compra_id
  RETURNING * INTO v_compra;

  v_new_total := v_compra.total;
  v_diff := v_new_total - v_old_total;

  -- Si cambió el total, ajustar caja y movimiento
  IF v_diff != 0 THEN
    SELECT * INTO v_caja FROM caja_sesiones
    WHERE fecha = CURRENT_DATE AND estado = 'ABIERTA'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay caja abierta para hoy';
    END IF;

    IF v_caja.saldo_actual < v_diff THEN
      RAISE EXCEPTION 'Saldo insuficiente en caja para el ajuste';
    END IF;

    UPDATE caja_sesiones
    SET saldo_actual = saldo_actual - v_diff
    WHERE id = v_caja.id;

    UPDATE movimientos_caja
    SET monto = v_new_total
    WHERE compra_id = p_compra_id;
  END IF;

  RETURN v_compra;
END;
$$ LANGUAGE plpgsql;
