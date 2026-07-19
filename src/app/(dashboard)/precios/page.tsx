"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Icon } from "@/components/Icon";
import { EditIcon, CheckIcon, CloseCircleIcon, BackIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { crearPrecio, listarPrecios } from "@/lib/services/compras";
import type { ListaPrecioSemanal, TipoCacao } from "@/lib/types/database";
import { TIPOS_CACAO, formatMoney, getSemanaInicio } from "@/lib/types/database";
import { Skeleton } from "@/components/Skeleton";

export default function PreciosPage() {
  const [precios, setPrecios] = useState<ListaPrecioSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<TipoCacao | null>(null);
  const [precioInput, setPrecioInput] = useState("");
  const [guardando, setGuardando] = useState(false);
  const toasts = useToast();

  const semana = getSemanaInicio();

  async function load() {
    setLoading(true);
    try {
      setPrecios(await listarPrecios());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function precioDe(tipo: TipoCacao): ListaPrecioSemanal | undefined {
    return precios.find((p) => p.semana_inicio === semana && p.tipo_cacao === tipo);
  }

  async function handleGuardar(e: FormEvent) {
    e.preventDefault();
    if (!editando || !precioInput || parseFloat(precioInput) <= 0) return;
    setGuardando(true);
    try {
      const p = await crearPrecio({
        semana_inicio: semana,
        tipo_cacao: editando,
        precio_kg: parseFloat(precioInput),
      });
      setPrecios((prev) => {
        const idx = prev.findIndex(
          (x) => x.semana_inicio === semana && x.tipo_cacao === editando
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = p;
          return next;
        }
        return [...prev, p];
      });
      setEditando(null);
      setPrecioInput("");
      toasts.success(`Precio de ${TIPOS_CACAO.find((t) => t.value === editando)?.label} actualizado`);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al guardar precio");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex text-muted transition-colors hover:text-cacao"
        >
          <BackIcon />
        </Link>
        <div className="flex items-center gap-2">
          <Icon icon={Tag} size={22} className="text-cacao" />
          <h1 className="text-xl font-bold text-cacao-dark">Precios semanales</h1>
        </div>
      </div>

      <p className="text-sm text-muted">
        Semana del {new Date(semana + "T00:00:00").toLocaleDateString("es-PE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {TIPOS_CACAO.map((tipo) => {
            const precio = precioDe(tipo.value);
            const editandoEste = editando === tipo.value;

            return (
              <div
                key={tipo.value}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-cacao-dark">{tipo.label}</p>
                    {precio ? (
                      <p className="mt-1 text-2xl font-bold text-accent">
                        {formatMoney(precio.precio_kg)}
                        <span className="ml-1 text-sm font-normal text-muted">/ kg</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">Sin precio definido</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(editando === tipo.value ? null : tipo.value);
                      setPrecioInput(precio ? String(precio.precio_kg) : "");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-all hover:border-accent hover:text-accent active:scale-95"
                  >
                    <EditIcon size={15} />
                    {precio ? "Editar" : "Definir"}
                  </button>
                </div>

                {editando === tipo.value && (
                  <form
                    onSubmit={handleGuardar}
                    className="mt-4 flex items-end gap-3 border-t border-border pt-4"
                  >
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Precio por kg (S/)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={precioInput}
                        onChange={(e) => setPrecioInput(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                        autoFocus
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={guardando}
                      className="flex items-center gap-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-light active:scale-95 disabled:opacity-50"
                    >
                      <CheckIcon size={16} />
                      {guardando ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(null);
                        setPrecioInput("");
                      }}
                      className="flex items-center gap-1 rounded-xl border border-border px-4 py-2.5 text-sm transition-all hover:bg-border/50"
                    >
                      <CloseCircleIcon size={16} />
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}