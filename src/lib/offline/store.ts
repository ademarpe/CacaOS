import type {
  CajaSesion,
  Compra,
  HistorialPrecio,
  ListaPrecioSemanal,
  MovimientoCaja,
  Productor,
} from "@/lib/types/database";

const STORAGE_KEY = "cacaos_data";
const STORE_VERSION = 3;

interface StoreEnvelope {
  __version: number;
  data: LocalStore;
}

export interface LocalStore {
  productores: Productor[];
  compras: Compra[];
  caja_sesiones: CajaSesion[];
  movimientos_caja: MovimientoCaja[];
  lista_precios_semanal: ListaPrecioSemanal[];
  historial_precios: HistorialPrecio[];
  sync_queue: SyncQueueItem[];
}

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: "insert" | "update" | "rpc";
  payload: Record<string, unknown>;
  created_at: string;
  synced: boolean;
}

export function emptyStore(): LocalStore {
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

export function loadStore(): LocalStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const envelope = JSON.parse(raw) as StoreEnvelope;
    if (typeof envelope.__version !== "number" || envelope.__version < STORE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return emptyStore();
    }
    return envelope.data;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return emptyStore();
  }
}

export function saveStore(store: LocalStore): void {
  if (typeof window === "undefined") return;
  const envelope: StoreEnvelope = { __version: STORE_VERSION, data: store };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export function enqueueSync(
  store: LocalStore,
  table: string,
  operation: SyncQueueItem["operation"],
  payload: Record<string, unknown> | object
): void {
  store.sync_queue.push({
    id: crypto.randomUUID(),
    table,
    operation,
    payload: payload as Record<string, unknown>,
    created_at: new Date().toISOString(),
    synced: false,
  });
}

export function getPendingSyncCount(store: LocalStore): number {
  return store.sync_queue.filter((item) => !item.synced).length;
}
