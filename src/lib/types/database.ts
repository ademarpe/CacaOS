export type TipoCacao = "BABA" | "SECO" | "SEGUNDA_EN_BABA";

export type CalidadCacao = "EXCELENTE" | "BUENA" | "REGULAR" | "BAJA";

export type EstadoCompra =
  | "BORRADOR"
  | "PENDIENTE_PAGO"
  | "COMPLETADA"
  | "ANULADA";

export type EstadoCaja = "ABIERTA" | "CERRADA";

export type TipoMovimientoCaja = "APERTURA" | "COMPRA" | "AJUSTE" | "CIERRE";

export interface Productor {
  id: string;
  nombre: string;
  comunidad: string;
  caserio: string;
  tipo_cacao: TipoCacao;
  dni?: string | null;
  telefono?: string | null;
  hectareas?: number | null;
  observaciones?: string | null;
  created_at: string;
}

export interface HistorialPrecio {
  id: string;
  precio_id: string;
  semana_inicio: string;
  tipo_cacao: TipoCacao;
  precio_anterior: number | null;
  precio_nuevo: number;
  motivo?: string | null;
  comprador_nombre?: string | null;
  created_at: string;
}

export interface ListaPrecioSemanal {
  id: string;
  semana_inicio: string;
  tipo_cacao: TipoCacao;
  precio_kg: number;
  created_at: string;
  updated_at?: string | null;
}

export interface CajaSesion {
  id: string;
  fecha: string;
  saldo_inicial: number;
  saldo_actual: number;
  estado: EstadoCaja;
  comprador_nombre?: string | null;
  opened_at: string;
  closed_at?: string | null;
}

export interface Compra {
  id: string;
  productor_id: string;
  fecha: string;
  hora: string;
  peso: number;
  calidad: CalidadCacao;
  humedad?: number | null;
  tipo_cacao: TipoCacao;
  precio_sugerido: number;
  precio_aplicado: number;
  total: number;
  observaciones?: string | null;
  estado: EstadoCompra;
  motivo_anulacion?: string | null;
  comprador_nombre?: string | null;
  client_id?: string | null;
  created_at: string;
  updated_at: string;
  productor?: Productor;
}

export interface MovimientoCaja {
  id: string;
  caja_sesion_id: string;
  compra_id?: string | null;
  tipo: TipoMovimientoCaja;
  monto: number;
  descripcion?: string | null;
  fecha: string;
}

export interface DashboardDiario {
  fecha: string;
  kg_comprados: number;
  productores_atendidos: number;
  total_pagado: number;
  precio_promedio_kg: number;
  num_compras: number;
}

export interface NuevaCompraInput {
  productor_id: string;
  peso: number;
  calidad: CalidadCacao;
  humedad?: number;
  tipo_cacao: TipoCacao;
  precio_sugerido: number;
  precio_aplicado: number;
  observaciones?: string;
  comprador_nombre?: string;
}

export interface NuevoProductorInput {
  nombre: string;
  comunidad: string;
  caserio: string;
  tipo_cacao: TipoCacao;
  dni?: string;
  telefono?: string;
  hectareas?: number;
  observaciones?: string;
}

export const TIPOS_CACAO: { value: TipoCacao; label: string }[] = [
  { value: "BABA", label: "Baba" },
  { value: "SECO", label: "Seco" },
  { value: "SEGUNDA_EN_BABA", label: "Segunda en baba" },
];

export const CALIDADES_CACAO: { value: CalidadCacao; label: string }[] = [
  { value: "EXCELENTE", label: "Excelente" },
  { value: "BUENA", label: "Buena" },
  { value: "REGULAR", label: "Regular" },
  { value: "BAJA", label: "Baja" },
];

export const ESTADOS_COMPRA: Record<EstadoCompra, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_PAGO: "Pendiente de pago",
  COMPLETADA: "Completada",
  ANULADA: "Anulada",
};

export function calcularTotal(peso: number, precioAplicado: number): number {
  return Math.round(peso * precioAplicado * 100) / 100;
}

export function getSemanaInicio(fecha = new Date()): string {
  const d = new Date(fecha);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const dow = d.getUTCDay();
  const diff = day - dow + (dow === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(year, month, diff));
  return monday.toISOString().split("T")[0];
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

export function formatKg(kg: number): string {
  return `${kg.toFixed(2)} kg`;
}
