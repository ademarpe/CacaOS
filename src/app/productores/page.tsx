"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, Users, Phone, TriangleAlert } from "lucide-react";
import { Icon } from "@/components/Icon";
import { EditIcon, TrashIcon, CheckIcon, CloseCircleIcon, BackIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import {
  actualizarProductor,
  eliminarProductor,
  listarProductores,
} from "@/lib/services/compras";
import type { Productor, TipoCacao } from "@/lib/types/database";
import { TIPOS_CACAO } from "@/lib/types/database";
import { Skeleton, SkeletonList } from "@/components/Skeleton";

export default function ProductoresPage() {
  const [productores, setProductores] = useState<Productor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    comunidad: "",
    caserio: "",
    tipo_cacao: "CCN51" as TipoCacao,
    telefono: "",
  });
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const toasts = useToast();

  async function load() {
    setLoading(true);
    try {
      setProductores(await listarProductores());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function iniciarEdicion(p: Productor) {
    setEditando(p.id);
    setEditForm({
      nombre: p.nombre,
      comunidad: p.comunidad,
      caserio: p.caserio,
      tipo_cacao: p.tipo_cacao,
      telefono: p.telefono ?? "",
    });
  }

  async function guardarEdicion(id: string) {
    setGuardando(true);
    try {
      await actualizarProductor(id, editForm);
      setEditando(null);
      await load();
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al editar");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(id: string) {
    try {
      await eliminarProductor(id);
      setEliminando(null);
      await load();
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex text-muted transition-colors hover:text-cacao hover:opacity-80">
            <BackIcon />
          </Link>
          <Icon icon={Sprout} size={22} className="text-cacao" />
          <h1 className="text-xl font-bold text-cacao-dark">Productores</h1>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted">
          <Users size={14} />
          {productores.length} registrados
        </p>
      </div>

      {productores.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cacao/5">
            <Sprout size={32} className="text-cacao-light" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sin productores</p>
            <p className="mt-1 text-sm">No hay productores registrados</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {productores.map((p, idx) => (
          <div
            key={p.id}
            className={`animate-slide-up rounded-xl border border-border bg-surface p-4 stagger-${Math.min(idx + 1, 8)}`}
          >
            {editando === p.id ? (
              <div className="space-y-3">
                <input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Nombre"
                />
                <input
                  value={editForm.comunidad}
                  onChange={(e) => setEditForm({ ...editForm, comunidad: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Comunidad"
                />
                <input
                  value={editForm.caserio}
                  onChange={(e) => setEditForm({ ...editForm, caserio: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Caserío"
                />
                <select
                  value={editForm.tipo_cacao}
                  onChange={(e) => setEditForm({ ...editForm, tipo_cacao: e.target.value as TipoCacao })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {TIPOS_CACAO.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Teléfono"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="flex-1 rounded-lg border border-border py-2 text-sm flex items-center justify-center gap-1"
                  >
                    <CloseCircleIcon size={14} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => guardarEdicion(p.id)}
                    disabled={guardando}
                    className="flex-1 rounded-lg bg-accent py-2 text-sm text-white disabled:opacity-50"
                  >
                    <CheckIcon size={14} />
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="text-xs text-muted">
                      {p.comunidad} · {p.caserio} · {p.tipo_cacao}
                    </p>
                    {p.telefono && (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Phone size={12} />
                        {p.telefono}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(p)}
                      className="flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent-light"
                    >
                      <EditIcon size={12} />
                      Editar
                    </button>
                    {eliminando !== p.id && (
                      <button
                        type="button"
                        onClick={() => setEliminando(p.id)}
                        className="flex items-center gap-1 text-xs text-danger transition-colors hover:text-red-700"
                      >
                      <TrashIcon size={12} />
                      Eliminar
                      </button>
                    )}
                  </div>
                </div>
                {eliminando === p.id && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm">
                    <TriangleAlert size={14} className="text-danger" />
                    <span className="text-danger">¿Eliminar a {p.nombre}?</span>
                    <button
                      type="button"
                      onClick={() => confirmarEliminar(p.id)}
                      className="ml-auto flex items-center gap-1 rounded bg-danger px-3 py-1 text-xs text-white transition-colors hover:bg-red-800"
                    >
                      <CheckIcon size={12} />
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setEliminando(null)}
                      className="flex items-center gap-1 rounded border border-border px-3 py-1 text-xs transition-colors hover:bg-background"
                    >
                      <CloseCircleIcon size={12} />
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
