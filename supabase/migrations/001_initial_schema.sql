-- CacaoOS MOD-001: Esquema inicial (Compras + dependencias)

-- Enums
CREATE TYPE tipo_cacao AS ENUM ('BABA', 'SECO', 'SEGUNDA_EN_BABA');
CREATE TYPE calidad_cacao AS ENUM ('EXCELENTE', 'BUENA', 'REGULAR', 'BAJA');
CREATE TYPE estado_compra AS ENUM ('BORRADOR', 'PENDIENTE_PAGO', 'COMPLETADA', 'ANULADA');
CREATE TYPE estado_caja AS ENUM ('ABIERTA', 'CERRADA');
CREATE TYPE tipo_movimiento_caja AS ENUM ('APERTURA', 'COMPRA', 'AJUSTE', 'CIERRE');

-- Productores
CREATE TABLE productores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  comunidad TEXT NOT NULL,
  caserio TEXT NOT NULL,
  tipo_cacao tipo_cacao NOT NULL,
  dni TEXT,
  telefono TEXT,
  hectareas DECIMAL(10, 2),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_productores_nombre ON productores USING gin (to_tsvector('spanish', nombre));
CREATE INDEX idx_productores_comunidad ON productores (comunidad);

-- Lista de precios semanal
CREATE TABLE lista_precios_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio DATE NOT NULL,
  tipo_cacao tipo_cacao NOT NULL,
  precio_kg DECIMAL(10, 2) NOT NULL CHECK (precio_kg > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (semana_inicio, tipo_cacao)
);

CREATE INDEX idx_precios_semana ON lista_precios_semanal (semana_inicio DESC);

-- Historial de cambios de precios
CREATE TABLE historial_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precio_id UUID NOT NULL REFERENCES lista_precios_semanal(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  tipo_cacao tipo_cacao NOT NULL,
  precio_anterior DECIMAL(10, 2),
  precio_nuevo DECIMAL(10, 2) NOT NULL CHECK (precio_nuevo > 0),
  motivo TEXT,
  comprador_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historial_precios_semana ON historial_precios (semana_inicio DESC);
CREATE INDEX idx_historial_precios_tipo ON historial_precios (tipo_cacao);

-- Caja operativa (sesión diaria)
CREATE TABLE caja_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  saldo_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0,
  saldo_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado estado_caja NOT NULL DEFAULT 'ABIERTA',
  comprador_nombre TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Compras
CREATE TABLE compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productor_id UUID NOT NULL REFERENCES productores (id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  peso DECIMAL(10, 2) NOT NULL CHECK (peso > 0),
  calidad calidad_cacao NOT NULL DEFAULT 'BUENA',
  humedad DECIMAL(5, 2),
  tipo_cacao tipo_cacao NOT NULL,
  precio_sugerido DECIMAL(10, 2) NOT NULL CHECK (precio_sugerido > 0),
  precio_aplicado DECIMAL(10, 2) NOT NULL CHECK (precio_aplicado > 0),
  total DECIMAL(12, 2) NOT NULL,
  observaciones TEXT,
  estado estado_compra NOT NULL DEFAULT 'BORRADOR',
  motivo_anulacion TEXT,
  comprador_nombre TEXT,
  client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT compras_total_check CHECK (total = peso * precio_aplicado)
);

CREATE UNIQUE INDEX idx_compras_client_id ON compras (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_compras_fecha ON compras (fecha DESC);
CREATE INDEX idx_compras_productor ON compras (productor_id);
CREATE INDEX idx_compras_estado ON compras (estado);

-- Movimientos de caja
CREATE TABLE movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_sesion_id UUID NOT NULL REFERENCES caja_sesiones (id),
  compra_id UUID REFERENCES compras (id),
  tipo tipo_movimiento_caja NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_movimientos_compra ON movimientos_caja (compra_id) WHERE compra_id IS NOT NULL;

-- Trigger: calcular total automáticamente
CREATE OR REPLACE FUNCTION calcular_total_compra()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total := NEW.peso * NEW.precio_aplicado;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_total_compra
  BEFORE INSERT OR UPDATE OF peso, precio_aplicado ON compras
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_compra();

-- Trigger: validar transiciones de estado
CREATE OR REPLACE FUNCTION validar_estado_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    IF OLD.estado = 'COMPLETADA' AND NEW.estado = 'ANULADA' THEN
      IF NEW.motivo_anulacion IS NULL OR trim(NEW.motivo_anulacion) = '' THEN
        RAISE EXCEPTION 'Se requiere motivo de anulación';
      END IF;
    ELSIF OLD.estado = 'BORRADOR' AND NEW.estado = 'PENDIENTE_PAGO' THEN
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

CREATE TRIGGER trg_validar_estado_compra
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION validar_estado_compra();

-- Función: completar compra y registrar movimiento de caja
CREATE OR REPLACE FUNCTION completar_compra(p_compra_id UUID, p_comprador TEXT DEFAULT NULL)
RETURNS compras AS $$
DECLARE
  v_compra compras;
  v_caja caja_sesiones;
BEGIN
  SELECT * INTO v_compra FROM compras WHERE id = p_compra_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Compra no encontrada';
  END IF;

  IF v_compra.estado NOT IN ('BORRADOR', 'PENDIENTE_PAGO') THEN
    RAISE EXCEPTION 'La compra no puede completarse en estado %', v_compra.estado;
  END IF;

  SELECT * INTO v_caja FROM caja_sesiones
  WHERE fecha = CURRENT_DATE AND estado = 'ABIERTA'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay caja abierta para hoy';
  END IF;

  IF v_caja.saldo_actual < v_compra.total THEN
    RAISE EXCEPTION 'Saldo insuficiente en caja';
  END IF;

  UPDATE compras
  SET estado = 'COMPLETADA',
      comprador_nombre = COALESCE(p_comprador, comprador_nombre),
      updated_at = now()
  WHERE id = p_compra_id
  RETURNING * INTO v_compra;

  INSERT INTO movimientos_caja (caja_sesion_id, compra_id, tipo, monto, descripcion)
  VALUES (v_caja.id, v_compra.id, 'COMPRA', v_compra.total, 'Pago compra cacao');

  UPDATE caja_sesiones
  SET saldo_actual = saldo_actual - v_compra.total
  WHERE id = v_caja.id;

  RETURN v_compra;
END;
$$ LANGUAGE plpgsql;

-- Función: anular compra completada
CREATE OR REPLACE FUNCTION anular_compra(p_compra_id UUID, p_motivo TEXT)
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

-- Vista: KPIs del día
CREATE OR REPLACE VIEW dashboard_diario AS
SELECT
  CURRENT_DATE AS fecha,
  COALESCE(SUM(c.peso) FILTER (WHERE c.estado = 'COMPLETADA'), 0) AS kg_comprados,
  COUNT(DISTINCT c.productor_id) FILTER (WHERE c.estado = 'COMPLETADA') AS productores_atendidos,
  COALESCE(SUM(c.total) FILTER (WHERE c.estado = 'COMPLETADA'), 0) AS total_pagado,
  CASE
    WHEN COALESCE(SUM(c.peso) FILTER (WHERE c.estado = 'COMPLETADA'), 0) > 0
    THEN COALESCE(SUM(c.total) FILTER (WHERE c.estado = 'COMPLETADA'), 0)
         / SUM(c.peso) FILTER (WHERE c.estado = 'COMPLETADA')
    ELSE 0
  END AS precio_promedio_kg,
  COUNT(*) FILTER (WHERE c.estado = 'COMPLETADA') AS num_compras
FROM compras c
WHERE c.fecha = CURRENT_DATE;

-- RLS básico (habilitar cuando haya auth)
ALTER TABLE productores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE productores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_precios_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_precios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso autenticado productores" ON productores FOR ALL USING (true);
CREATE POLICY "Acceso autenticado compras" ON compras FOR ALL USING (true);
CREATE POLICY "Acceso autenticado movimientos" ON movimientos_caja FOR ALL USING (true);
CREATE POLICY "Acceso autenticado caja" ON caja_sesiones FOR ALL USING (true);
CREATE POLICY "Acceso autenticado precios" ON lista_precios_semanal FOR ALL USING (true);
CREATE POLICY "Acceso autenticado historial_precios" ON historial_precios FOR ALL USING (true);

-- Datos semilla para desarrollo
INSERT INTO lista_precios_semanal (semana_inicio, tipo_cacao, precio_kg) VALUES
  (date_trunc('week', CURRENT_DATE)::date, 'BABA', 10.00),
  (date_trunc('week', CURRENT_DATE)::date, 'SECO', 15.00),
  (date_trunc('week', CURRENT_DATE)::date, 'SEGUNDA_EN_BABA', 8.00);

-- ❌ Se eliminó el seed de caja_sesiones para evitar datos demo
-- Cada usuario debe abrir su propia caja
