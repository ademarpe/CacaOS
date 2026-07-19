"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Info } from "lucide-react";
import { Icon } from "@/components/Icon";
import { EditIcon, CloseCircleIcon, PlusCircleIcon, CheckIcon, BackIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { actualizarCompra, anularCompra, editarCompraCompletada, eliminarCompra, listarCompras } from "@/lib/services/compras";
import type { Compra } from "@/lib/types/database";
import {
  ESTADOS_COMPRA,
  formatKg,
  formatMoney,
} from "@/lib/types/database";
import { SkeletonList } from "@/components/Skeleton";

export default function HistorialComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [editando, setEditando] = useState<string | null>(null);
  const [editPeso, setEditPeso] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const toasts = useToast();

  async function load(f?: string) {
    setLoading(true);
    try {
      setCompras(await listarCompras(f));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(fecha);
  }, [fecha]);

  async function handleAnular(id: string) {
    if (!motivo.trim()) return;
    try {
      await anularCompra(id, motivo);
      setAnulando(null);
      setMotivo("");
      await load(fecha);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al anular");
    }
  }

  async function handleEditar(compra: Compra) {
    if (!editPeso || parseFloat(editPeso) <= 0) return;
    if (!editPrecio || parseFloat(editPrecio) <= 0) return;
    try {
      if (compra.estado === "COMPLETADA") {
        await editarCompraCompletada(compra.id, {
          peso: parseFloat(editPeso),
          precio_aplicado: parseFloat(editPrecio),
        });
      } else {
        await actualizarCompra(compra.id, {
          peso: parseFloat(editPeso),
          precio_aplicado: parseFloat(editPrecio),
        });
      }
      setEditando(null);
      setEditPeso("");
      setEditPrecio("");
      await load(fecha);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al editar compra");
    }
  }

  async function handleEliminar(id: string) {
    // Optimistic update: remover de la lista local inmediatamente
    setCompras((prev) => prev.filter((c) => c.id !== id));
    setEliminando(null);
    toasts.success("Compra eliminada");

    try {
      await eliminarCompra(id);
      // Refresh desde DB para asegurar consistencia
      await load(fecha);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al eliminar compra");
      // Si falló la eliminación remota, recargar para restaurar la lista real
      await load(fecha);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex text-muted transition-colors hover:text-cacao hover:opacity-80">
          <BackIcon />
        </Link>
        <Icon icon={ClipboardList} size={22} className="text-cacao" />
        <h1 className="text-xl font-bold text-cacao-dark">Historial</h1>
        <Link
          href="/compras/nueva"
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-light active:scale-95"
        >
          <PlusCircleIcon size={16} />
          Nueva
        </Link>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
        />
      </div>

      {loading && <SkeletonList count={5} />}

      {!loading && compras.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cacao/5">
            <ClipboardList size={32} className="text-cacao-light" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sin compras</p>
            <p className="mt-1 text-sm">No hay compras registradas en esta fecha</p>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {compras.map((c, idx) => (
          <li
            key={c.id}
            className={`animate-slide-up rounded-xl border border-border bg-surface p-4 stagger-${Math.min(idx + 1, 8)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">
                  {c.productor?.nombre ?? "Productor"}
                </p>
                <p className="text-xs text-muted">
                  {c.hora.slice(0, 5)} · {c.tipo_cacao} · {c.calidad}
                </p>
              </div>
              <EstadoBadge estado={c.estado} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>{formatKg(c.peso)}</span>
              <span className="font-bold text-cacao">{formatMoney(c.total)}</span>
            </div>
            {c.precio_sugerido !== c.precio_aplicado && (
              <p className="mt-1 text-xs text-warning">
                Precio negociado: {formatMoney(c.precio_aplicado)}/kg
                (sugerido: {formatMoney(c.precio_sugerido)})
              </p>
            )}

            {(c.estado === "BORRADOR" || c.estado === "COMPLETADA") && editando !== c.id && (
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditando(c.id);
                    setEditPeso(String(c.peso));
                    setEditPrecio(String(c.precio_aplicado));
                  }}
                  className="flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent-light"
                >
                  <EditIcon size={12} />
                  Editar
                </button>
                {c.estado === "BORRADOR" && (
                  <>
                    <span className="text-xs text-border">|</span>
                    <button
                      type="button"
                      onClick={() => setEliminando(c.id)}
                      className="flex items-center gap-1 text-xs text-danger transition-colors hover:text-red-700"
                    >
                      <CloseCircleIcon size={12} />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            )}

            {eliminando === c.id && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
                <p className="flex-1 text-xs text-danger">
                  ¿Eliminar esta compra?
                </p>
                <button
                  type="button"
                  onClick={() => setEliminando(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminar(c.id)}
                  className="rounded-lg bg-danger px-3 py-1.5 text-xs text-white"
                >
                  Eliminar
                </button>
              </div>
            )}

            {editando === c.id && (
              <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3">
                <div>
                  <label className="text-xs text-muted">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editPeso}
                    onChange={(e) => setEditPeso(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Precio (S/ kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                      type="button"
                      onClick={() => setEditando(null)}
                      className="flex-1 rounded-lg border py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <CloseCircleIcon size={12} />
                      Cancelar
                    </button>
                  <button
                    type="button"
                    onClick={() => handleEditar(c)}
                    className="flex-1 rounded-lg bg-accent py-2 text-xs text-white flex items-center justify-center gap-1"
                  >
                    <CheckIcon size={12} />
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {c.estado === "COMPLETADA" && anulando !== c.id && editando !== c.id && (
              <button
                type="button"
                onClick={() => setAnulando(c.id)}
                className="mt-2 flex items-center gap-1 text-xs text-danger transition-colors hover:text-red-700"
              >
                <CloseCircleIcon size={12} />
                Anular compra
              </button>
            )}
            {anulando === c.id && (
              <div className="mt-3 space-y-2">
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo de anulación..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnulando(null);
                      setMotivo("");
                    }}
                    className="flex-1 rounded-lg border py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <CloseCircleIcon size={12} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnular(c.id)}
                    className="flex-1 rounded-lg bg-danger py-2 text-xs text-white flex items-center justify-center gap-1"
                  >
                    <CheckIcon size={12} />
                    Confirmar
                  </button>
                </div>
              </div>
            )}
            {c.estado === "ANULADA" && c.motivo_anulacion && (
              <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                <Info size={12} />
                Anulada: {c.motivo_anulacion}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: Compra["estado"] }) {
  const colors: Record<Compra["estado"], string> = {
    BORRADOR: "bg-border text-muted",
    PENDIENTE_PAGO: "bg-warning/20 text-warning",
    COMPLETADA: "bg-accent/20 text-accent",
    ANULADA: "bg-danger/20 text-danger",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[estado]}`}
    >
      {ESTADOS_COMPRA[estado]}
    </span>
  );
}
