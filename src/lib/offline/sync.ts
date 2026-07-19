import { getSupabase } from "@/lib/supabase/client";
import { loadStore, saveStore } from "@/lib/offline/store";
import type { SyncQueueItem } from "@/lib/offline/store";

export async function procesarSync(): Promise<{ synced: number; errors: number }> {
  const supabase = getSupabase();
  if (!supabase) return { synced: 0, errors: 0 };

  const store = loadStore();
  const pendientes = store.sync_queue.filter((item) => !item.synced);
  if (pendientes.length === 0) return { synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;

  for (const item of pendientes) {
    try {
      await procesarItem(supabase, item);
      item.synced = true;
      synced++;
    } catch {
      errors++;
    }
  }

  saveStore(store);
  return { synced, errors };
}

async function procesarItem(
  supabase: ReturnType<typeof getSupabase>,
  item: SyncQueueItem
): Promise<void> {
  if (!supabase) throw new Error("Supabase no configurado");

  if (item.operation === "rpc") {
    const { rpc_name, params } = item.payload as {
      rpc_name: string;
      params: Record<string, unknown>;
    };
    const { error } = await supabase.rpc(rpc_name, params);
    if (error) throw error;
    return;
  }

  const table = item.table;
  const payload = item.payload;

  if (item.operation === "insert") {
    const id = (payload as Record<string, unknown>).id;
    const clientId = (payload as Record<string, unknown>).client_id;
    const conflictKey = clientId ? "client_id" : "id";
    const conflictValue = clientId ?? id;
    const { error } = await supabase
      .from(table)
      .upsert(payload as Record<string, unknown>, {
        onConflict: conflictKey,
        ignoreDuplicates: false,
      });
    if (error) throw error;
    return;
  }

  if (item.operation === "update") {
    const { id, ...rest } = payload;
    const { error } = await supabase
      .from(table)
      .update(rest)
      .eq("id", id as string);
    if (error) throw error;
  }
}
