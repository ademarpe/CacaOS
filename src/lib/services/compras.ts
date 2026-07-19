import { v4 as uuidv4 } from "uuid";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  enqueueSync,
  getPendingSyncCount,
  loadStore,
  saveStore,
} from "@/lib/offline/store";
import type {
  CajaSesion,
  Compra,
  DashboardDiario,
  HistorialPrecio,
  ListaPrecioSemanal,
  NuevaCompraInput,
  NuevoProductorInput,
  Productor,
  TipoCacao,
} from "@/lib/types/database";
import { calcularTotal, getSemanaInicio } from "@/lib/types/database";

function nowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Productores ───────────────────────────────────────────────

export async function buscarProductores(query: string): Promise<Productor[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("productores")
      .select("*")
      .or(`nombre.ilike.%${query}%,comunidad.ilike.%${query}%,caserio.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return data as Productor[];
  }

  const store = loadStore();
  const q = query.toLowerCase();
  return store.productores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.comunidad.toLowerCase().includes(q) ||
      p.caserio.toLowerCase().includes(q)
  );
}

export async function listarProductores(): Promise<Productor[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("productores")
      .select("*")
      .order("nombre");
    if (error) throw error;
    return data as Productor[];
  }
  return loadStore().productores;
}

export async function crearProductor(input: NuevoProductorInput): Promise<Productor> {
  const productor: Productor = {
    id: uuidv4(),
    ...input,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("productores")
      .insert(productor)
      .select()
      .single();
    if (error) throw error;
    return data as Productor;
  }

  const store = loadStore();
  store.productores.push(productor);
  enqueueSync(store, "productores", "insert", productor);
  saveStore(store);
  return productor;
}

export async function actualizarProductor(
  id: string,
  cambios: Partial<Pick<Productor, "nombre" | "comunidad" | "caserio" | "tipo_cacao" | "dni" | "telefono" | "hectareas" | "observaciones">>
): Promise<Productor> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("productores")
      .update(cambios)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Productor;
  }

  const store = loadStore();
  const idx = store.productores.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Productor no encontrado");
  Object.assign(store.productores[idx], cambios);
  enqueueSync(store, "productores", "update", { id, ...cambios });
  saveStore(store);
  return store.productores[idx];
}

export async function eliminarProductor(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("productores").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const store = loadStore();
  const tieneCompras = store.compras.some((c) => c.productor_id === id);
  if (tieneCompras) throw new Error("No se puede eliminar un productor con compras registradas");
  store.productores = store.productores.filter((p) => p.id !== id);
  enqueueSync(store, "productores", "update", { id, _deleted: true });
  saveStore(store);
}

// ─── Precios ───────────────────────────────────────────────────

export async function obtenerPrecioVigente(tipoCacao: TipoCacao): Promise<number> {
  const semana = getSemanaInicio();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("lista_precios_semanal")
      .select("precio_kg")
      .eq("semana_inicio", semana)
      .eq("tipo_cacao", tipoCacao)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`No hay precio para ${tipoCacao} esta semana`);
    return data.precio_kg;
  }

  const store = loadStore();
  const precio = store.lista_precios_semanal.find(
    (p) => p.semana_inicio === semana && p.tipo_cacao === tipoCacao
  );
  if (!precio) throw new Error(`No hay precio para ${tipoCacao} esta semana`);
  return precio.precio_kg;
}

export async function listarPrecios(): Promise<ListaPrecioSemanal[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("lista_precios_semanal")
      .select("*")
      .order("semana_inicio", { ascending: false });
    if (error) throw error;
    return data as ListaPrecioSemanal[];
  }

  return loadStore().lista_precios_semanal;
}

export async function crearPrecio(input: {
  semana_inicio: string;
  tipo_cacao: TipoCacao;
  precio_kg: number;
  motivo?: string;
  comprador_nombre?: string;
}): Promise<ListaPrecioSemanal> {
  const now = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { data: existing } = await supabase
      .from("lista_precios_semanal")
      .select("id, precio_kg")
      .eq("semana_inicio", input.semana_inicio)
      .eq("tipo_cacao", input.tipo_cacao)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("lista_precios_semanal")
        .update({ precio_kg: input.precio_kg, updated_at: now })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      await registrarCambioPrecio({
        precio_id: existing.id,
        semana_inicio: input.semana_inicio,
        tipo_cacao: input.tipo_cacao,
        precio_anterior: existing.precio_kg,
        precio_nuevo: input.precio_kg,
        motivo: input.motivo,
        comprador_nombre: input.comprador_nombre,
      });
      return data as ListaPrecioSemanal;
    }

    const precio: ListaPrecioSemanal = {
      id: uuidv4(),
      ...input,
      created_at: now,
    };
    const { data, error } = await supabase
      .from("lista_precios_semanal")
      .insert(precio)
      .select()
      .single();
    if (error) throw error;
    return data as ListaPrecioSemanal;
  }

  const store = loadStore();
  const existing = store.lista_precios_semanal.find(
    (p) => p.semana_inicio === input.semana_inicio && p.tipo_cacao === input.tipo_cacao
  );

  if (existing) {
    const anterior = existing.precio_kg;
    existing.precio_kg = input.precio_kg;
    existing.updated_at = now;
    store.historial_precios.push({
      id: uuidv4(),
      precio_id: existing.id,
      semana_inicio: input.semana_inicio,
      tipo_cacao: input.tipo_cacao,
      precio_anterior: anterior,
      precio_nuevo: input.precio_kg,
      motivo: input.motivo ?? null,
      comprador_nombre: input.comprador_nombre ?? null,
      created_at: now,
    });
    enqueueSync(store, "lista_precios_semanal", "update", existing);
    saveStore(store);
    return existing;
  }

  const precio: ListaPrecioSemanal = {
    id: uuidv4(),
    ...input,
    created_at: now,
  };
  store.lista_precios_semanal.push(precio);
  enqueueSync(store, "lista_precios_semanal", "insert", precio);
  saveStore(store);
  return precio;
}

export async function registrarCambioPrecio(input: {
  precio_id: string;
  semana_inicio: string;
  tipo_cacao: TipoCacao;
  precio_anterior: number | null;
  precio_nuevo: number;
  motivo?: string;
  comprador_nombre?: string;
}): Promise<HistorialPrecio> {
  const registro: HistorialPrecio = {
    id: uuidv4(),
    ...input,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("historial_precios")
      .insert(registro)
      .select()
      .single();
    if (error) throw error;
    return data as HistorialPrecio;
  }

  const store = loadStore();
  store.historial_precios.push(registro);
  enqueueSync(store, "historial_precios", "insert", registro);
  saveStore(store);
  return registro;
}

export async function listarHistorialPrecios(): Promise<HistorialPrecio[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("historial_precios")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as HistorialPrecio[];
  }

  const store = loadStore();
  return [...store.historial_precios].sort(
    (a, b) => b.created_at.localeCompare(a.created_at)
  );
}

export async function cerrarCaja(): Promise<CajaSesion> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("caja_sesiones")
      .update({ estado: "CERRADA", closed_at: new Date().toISOString() })
      .eq("fecha", today())
      .eq("estado", "ABIERTA")
      .select()
      .single();
    if (error) throw error;
    return data as CajaSesion;
  }

  const store = loadStore();
  const idx = store.caja_sesiones.findIndex(
    (c) => c.fecha === today() && c.estado === "ABIERTA"
  );
  if (idx === -1) throw new Error("No hay caja abierta para cerrar");

  store.caja_sesiones[idx].estado = "CERRADA";
  store.caja_sesiones[idx].closed_at = new Date().toISOString();

  store.movimientos_caja.push({
    id: uuidv4(),
    caja_sesion_id: store.caja_sesiones[idx].id,
    compra_id: null,
    tipo: "CIERRE",
    monto: 0,
    descripcion: "Cierre de caja",
    fecha: new Date().toISOString(),
  });

  enqueueSync(store, "caja_sesiones", "update", {
    id: store.caja_sesiones[idx].id,
    estado: "CERRADA",
    closed_at: store.caja_sesiones[idx].closed_at,
  });
  saveStore(store);
  return store.caja_sesiones[idx];
}

export async function obtenerResumenCierre(): Promise<{
  total_compras: number;
  num_compras: number;
  saldo_inicial: number;
  saldo_final: number;
}> {
  const compras = await listarCompras();
  const completadas = compras.filter((c) => c.estado === "COMPLETADA");
  const total = completadas.reduce((s, c) => s + c.total, 0);

  const store = loadStore();
  const caja = store.caja_sesiones.find(
    (c) => c.fecha === today() && c.estado === "ABIERTA"
  );

  return {
    total_compras: total,
    num_compras: completadas.length,
    saldo_inicial: caja?.saldo_inicial ?? 0,
    saldo_final: caja?.saldo_actual ?? 0,
  };
}

// ─── Caja ──────────────────────────────────────────────────────

export async function obtenerCajaHoy(): Promise<CajaSesion | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("caja_sesiones")
      .select("*")
      .eq("fecha", today())
      .eq("estado", "ABIERTA")
      .maybeSingle();
    if (error) throw error;
    return data as CajaSesion | null;
  }

  const store = loadStore();
  return (
    store.caja_sesiones.find((c) => c.fecha === today() && c.estado === "ABIERTA") ??
    null
  );
}

export async function abrirCaja(saldoInicial: number, comprador: string): Promise<CajaSesion> {
  const cajaExistente = await obtenerCajaHoy();
  if (cajaExistente) {
    throw new Error("Ya existe una caja abierta para hoy. Ciérrala antes de abrir una nueva.");
  }

  const sesion: CajaSesion = {
    id: uuidv4(),
    fecha: today(),
    saldo_inicial: saldoInicial,
    saldo_actual: saldoInicial,
    estado: "ABIERTA",
    comprador_nombre: comprador,
    opened_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("caja_sesiones")
      .insert(sesion)
      .select()
      .single();
    if (error) throw error;
    return data as CajaSesion;
  }

  const store = loadStore();
  store.caja_sesiones.push(sesion);
  enqueueSync(store, "caja_sesiones", "insert", sesion);
  saveStore(store);
  return sesion;
}

export async function ingresarEfectivoCaja(monto: number, motivo: string): Promise<CajaSesion> {
  if (monto <= 0) throw new Error("El monto debe ser mayor que cero");

  const supabase = getSupabase();
  if (supabase) {
    const caja = await obtenerCajaHoy();
    if (!caja) throw new Error("No hay caja abierta hoy");

    const { data, error } = await supabase
      .from("caja_sesiones")
      .update({ saldo_actual: caja.saldo_actual + monto })
      .eq("id", caja.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from("movimientos_caja").insert({
      id: uuidv4(),
      caja_sesion_id: caja.id,
      compra_id: null,
      tipo: "AJUSTE",
      monto,
      descripcion: motivo,
      fecha: new Date().toISOString(),
    });

    return data as CajaSesion;
  }

  const store = loadStore();
  const caja = store.caja_sesiones.find(
    (c) => c.fecha === today() && c.estado === "ABIERTA"
  );
  if (!caja) throw new Error("No hay caja abierta hoy");

  caja.saldo_actual += monto;

  store.movimientos_caja.push({
    id: uuidv4(),
    caja_sesion_id: caja.id,
    compra_id: null,
    tipo: "AJUSTE",
    monto,
    descripcion: motivo,
    fecha: new Date().toISOString(),
  });

  enqueueSync(store, "caja_sesiones", "update", {
    id: caja.id,
    saldo_actual: caja.saldo_actual,
  });
  saveStore(store);
  return caja;
}

// ─── Compras ───────────────────────────────────────────────────

export async function actualizarCompra(
  compraId: string,
  cambios: Partial<Pick<Compra, "peso" | "calidad" | "humedad" | "tipo_cacao" | "precio_aplicado" | "observaciones">>
): Promise<Compra> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("compras")
      .update({ ...cambios, updated_at: new Date().toISOString() })
      .eq("id", compraId)
      .eq("estado", "BORRADOR")
      .select()
      .single();
    if (error) throw error;
    return data as Compra;
  }

  const store = loadStore();
  const idx = store.compras.findIndex((c) => c.id === compraId);
  if (idx === -1) throw new Error("Compra no encontrada");

  const compra = store.compras[idx];
  if (compra.estado !== "BORRADOR") {
    throw new Error("Solo se pueden editar compras en estado borrador");
  }

  Object.assign(compra, cambios);
  compra.total = calcularTotal(compra.peso, compra.precio_aplicado);
  compra.updated_at = new Date().toISOString();
  store.compras[idx] = compra;

  enqueueSync(store, "compras", "update", { id: compra.id, ...cambios });
  saveStore(store);
  return compra;
}

export async function crearCompra(input: NuevaCompraInput): Promise<Compra> {
  const clientId = uuidv4();
  const total = calcularTotal(input.peso, input.precio_aplicado);

  const compra: Compra = {
    id: uuidv4(),
    productor_id: input.productor_id,
    fecha: today(),
    hora: nowTime(),
    peso: input.peso,
    calidad: input.calidad,
    humedad: input.humedad,
    tipo_cacao: input.tipo_cacao,
    precio_sugerido: input.precio_sugerido,
    precio_aplicado: input.precio_aplicado,
    total,
    observaciones: input.observaciones,
    estado: "BORRADOR",
    comprador_nombre: input.comprador_nombre,
    client_id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("compras")
      .insert(compra)
      .select()
      .single();
    if (error) throw error;
    return data as Compra;
  }

  const store = loadStore();
  store.compras.push(compra);
  enqueueSync(store, "compras", "insert", compra);
  saveStore(store);
  return compra;
}

export async function completarCompra(compraId: string, comprador?: string): Promise<Compra> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("completar_compra", {
      p_compra_id: compraId,
      p_comprador: comprador ?? null,
    });
    if (error) throw error;
    return data as Compra;
  }

  const store = loadStore();
  const compras = store.compras;
  const idx = compras.findIndex((c) => c.id === compraId);
  if (idx === -1) throw new Error("Compra no encontrada");

  const compra = compras[idx];
  if (!["BORRADOR", "PENDIENTE_PAGO"].includes(compra.estado)) {
    throw new Error(`No se puede completar en estado ${compra.estado}`);
  }

  const caja = store.caja_sesiones.find(
    (c) => c.fecha === today() && c.estado === "ABIERTA"
  );
  if (!caja) throw new Error("No hay caja abierta para hoy");
  if (caja.saldo_actual < compra.total) throw new Error("Saldo insuficiente en caja");

  compra.estado = "COMPLETADA";
  compra.comprador_nombre = comprador ?? compra.comprador_nombre;
  compra.updated_at = new Date().toISOString();
  compras[idx] = compra;

  store.movimientos_caja.push({
    id: uuidv4(),
    caja_sesion_id: caja.id,
    compra_id: compra.id,
    tipo: "COMPRA",
    monto: compra.total,
    descripcion: "Pago compra cacao",
    fecha: new Date().toISOString(),
  });

  caja.saldo_actual -= compra.total;

  enqueueSync(store, "compras", "rpc", {
    rpc_name: "completar_compra",
    params: { p_compra_id: compra.id, p_comprador: compra.comprador_nombre ?? null },
  });
  saveStore(store);
  return compra;
}

export async function registrarCompraCompleta(
  input: NuevaCompraInput
): Promise<Compra> {
  const borrador = await crearCompra(input);
  return completarCompra(borrador.id, input.comprador_nombre);
}

export async function anularCompra(compraId: string, motivo: string): Promise<Compra> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("anular_compra", {
      p_compra_id: compraId,
      p_motivo: motivo,
    });
    if (error) throw error;
    return data as Compra;
  }

  const store = loadStore();
  const compras = store.compras;
  const idx = compras.findIndex((c) => c.id === compraId);
  if (idx === -1) throw new Error("Compra no encontrada");

  const compra = compras[idx];
  if (compra.estado !== "COMPLETADA") {
    throw new Error("Solo se pueden anular compras completadas");
  }

  compra.estado = "ANULADA";
  compra.motivo_anulacion = motivo;
  compra.updated_at = new Date().toISOString();
  compras[idx] = compra;

  const mov = store.movimientos_caja.find((m) => m.compra_id === compraId);

  if (mov) {
    const caja = store.caja_sesiones.find(
      (c) => c.id === mov.caja_sesion_id
    );
    if (caja) caja.saldo_actual += mov.monto;
  }

  enqueueSync(store, "compras", "rpc", {
    rpc_name: "anular_compra",
    params: { p_compra_id: compra.id, p_motivo: motivo },
  });
  saveStore(store);
  return compra;
}

export async function listarCompras(fecha?: string): Promise<Compra[]> {
  const targetDate = fecha ?? today();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("compras")
      .select("*, productor:productores(*)")
      .eq("fecha", targetDate)
      .order("hora", { ascending: false });
    if (error) throw error;
    return data as Compra[];
  }

  const store = loadStore();
  const productores = store.productores;
  return store.compras
    .filter((c) => c.fecha === targetDate)
    .map((c) => ({
      ...c,
      productor: productores.find((p) => p.id === c.productor_id),
    }))
    .sort((a, b) => b.hora.localeCompare(a.hora));
}

export async function obtenerDashboard(): Promise<DashboardDiario> {
  const compras = await listarCompras();
  const completadas = compras.filter((c) => c.estado === "COMPLETADA");
  const kg = completadas.reduce((s, c) => s + c.peso, 0);
  const total = completadas.reduce((s, c) => s + c.total, 0);
  const productores = new Set(completadas.map((c) => c.productor_id));

  return {
    fecha: today(),
    kg_comprados: kg,
    productores_atendidos: productores.size,
    total_pagado: total,
    precio_promedio_kg: kg > 0 ? total / kg : 0,
    num_compras: completadas.length,
  };
}

export function getModoAlmacenamiento(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export function getComprasPendientesSync(): number {
  if (typeof window === "undefined") return 0;
  return getPendingSyncCount(loadStore());
}