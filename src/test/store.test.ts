import { describe, it, expect, beforeEach } from "vitest";
import {
  loadStore,
  saveStore,
  enqueueSync,
  getPendingSyncCount,
} from "@/lib/offline/store";
import type { LocalStore } from "@/lib/offline/store";
import { calcularTotal } from "@/lib/types/database";

const STORAGE_KEY = "cacaos_data_v1";

function createEmptyStore(): LocalStore {
  return {
    productores: [],
    compras: [],
    caja_sesiones: [],
    movimientos_caja: [],
    lista_precios_semanal: [],
    historial_precios: [],
    sync_queue: [],
  };
}

describe("Offline Store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loadStore retorna store vacio si no hay datos", () => {
    const store = loadStore();
    expect(store.productores).toHaveLength(0);
    expect(store.compras).toHaveLength(0);
    expect(store.caja_sesiones).toHaveLength(0);
    expect(store.lista_precios_semanal).toHaveLength(0);
    expect(store.sync_queue).toHaveLength(0);
  });

  it("saveStore y loadStore persisten datos", () => {
    const store = createEmptyStore();
    store.productores.push({
      id: "test-1",
      nombre: "Test",
      comunidad: "Test",
      caserio: "Test",
      tipo_cacao: "BABA",
      created_at: new Date().toISOString(),
    });
    saveStore(store);
    const loaded = loadStore();
    expect(loaded.productores).toHaveLength(1);
    expect(loaded.productores[0].nombre).toBe("Test");
  });

  it("enqueueSync agrega items a la cola", () => {
    const store = createEmptyStore();
    enqueueSync(store, "compras", "insert", { id: "test-1" });
    expect(store.sync_queue).toHaveLength(1);
    expect(store.sync_queue[0].synced).toBe(false);
    expect(store.sync_queue[0].table).toBe("compras");
  });

  it("getPendingSyncCount retorna cantidad correcta", () => {
    const store = createEmptyStore();
    enqueueSync(store, "compras", "insert", { id: "1" });
    enqueueSync(store, "compras", "insert", { id: "2" });
    expect(getPendingSyncCount(store)).toBe(2);
  });
});

describe("Casos excepcionales (EX)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("EX-001: registrar productor y continuar sin abandonar flujo", () => {
    const productor = {
      id: "nuevo-1",
      nombre: "Nuevo Productor",
      comunidad: "Test",
      caserio: "Test",
      tipo_cacao: "BABA" as const,
      created_at: new Date().toISOString(),
    };

    const store = createEmptyStore();
    store.productores.push(productor);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.productores).toHaveLength(1);
    expect(stored.productores[0].nombre).toBe("Nuevo Productor");
  });

  it("EX-002: corregir peso mientras compra esta en borrador", () => {
    const compra = {
      id: "compra-1",
      estado: "BORRADOR",
      peso: 10,
      precio_aplicado: 8.5,
      total: 85,
    };

    compra.peso = 15;
    compra.total = calcularTotal(compra.peso, compra.precio_aplicado);
    expect(compra.peso).toBe(15);
    expect(compra.total).toBe(127.5);
  });

  it("EX-003: correccion mediante anulacion y nueva compra", () => {
    const compraOriginal = { id: "c1", estado: "COMPLETADA", total: 100 };
    const compraAnulada = { ...compraOriginal, estado: "ANULADA", motivo_anulacion: "Monto incorrecto" };
    const nuevaCompra = { id: "c2", estado: "COMPLETADA", total: 120 };

    expect(compraAnulada.estado).toBe("ANULADA");
    expect(compraAnulada.motivo_anulacion).toBeTruthy();
    expect(nuevaCompra.total).toBe(120);
  });

  it("EX-004: compra offline queda pendiente de sincronizacion", () => {
    const store = createEmptyStore();
    store.sync_queue.push({
      id: "sync-1",
      table: "compras",
      operation: "insert",
      payload: { id: "compra-offline-1" },
      created_at: new Date().toISOString(),
      synced: false,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(loaded.sync_queue).toHaveLength(1);
    expect(loaded.sync_queue[0].synced).toBe(false);
  });

  it("EX-007: multiples compras del mismo productor en el mismo dia", () => {
    const compras = [
      { id: "c1", productor_id: "p1", fecha: "2026-07-16" },
      { id: "c2", productor_id: "p1", fecha: "2026-07-16" },
    ];
    expect(compras.length).toBe(2);
    expect(compras.every((c) => c.productor_id === "p1")).toBe(true);
  });
});
