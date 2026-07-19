"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  CircleDollarSign,
  Lock,
  Unlock,
} from "lucide-react";
import { CheckIcon, CloseCircleIcon, BackIcon } from "@/components/icons";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import {
  abrirCaja,
  cerrarCaja,
  ingresarEfectivoCaja,
  obtenerCajaHoy,
  obtenerResumenCierre,
} from "@/lib/services/compras";
import type { CajaSesion } from "@/lib/types/database";
import { formatMoney } from "@/lib/types/database";
import { Skeleton } from "@/components/Skeleton";

export default function CajaPage() {
  const [caja, setCaja] = useState<CajaSesion | null>(null);
  const [saldoInicial, setSaldoInicial] = useState("5000");
  const [comprador, setComprador] = useState("Comprador Demo");
  const [loading, setLoading] = useState(true);
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [resumen, setResumen] = useState<{
    total_compras: number;
    num_compras: number;
    saldo_inicial: number;
    saldo_final: number;
  } | null>(null);
  const [showConfirmCierre, setShowConfirmCierre] = useState(false);
  const [showIngresar, setShowIngresar] = useState(false);
  const [montoIngreso, setMontoIngreso] = useState("");
  const [motivoIngreso, setMotivoIngreso] = useState("");
  const [ingresando, setIngresando] = useState(false);
  const toasts = useToast();

  useEffect(() => {
    obtenerCajaHoy().then((c) => {
      setCaja(c);
      setLoading(false);
    });
  }, []);

  async function handleAbrir(e: FormEvent) {
    e.preventDefault();
    setAbriendo(true);
    try {
      const sesion = await abrirCaja(parseFloat(saldoInicial), comprador);
      setCaja(sesion);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al abrir caja");
    } finally {
      setAbriendo(false);
    }
  }

  async function handleCerrar() {
    setCerrando(true);
    try {
      const resumen = await obtenerResumenCierre();
      setResumen(resumen);
      setShowConfirmCierre(true);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al obtener resumen");
    } finally {
      setCerrando(false);
    }
  }

  async function confirmarCierre() {
    setCerrando(true);
    try {
      await cerrarCaja();
      setCaja(null);
      setShowConfirmCierre(false);
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al cerrar caja");
    } finally {
      setCerrando(false);
    }
  }

  async function handleIngresar() {
    if (!montoIngreso || parseFloat(montoIngreso) <= 0) return;
    if (!motivoIngreso.trim()) return;
    setIngresando(true);
    try {
      const cajaActualizada = await ingresarEfectivoCaja(parseFloat(montoIngreso), motivoIngreso);
      setCaja(cajaActualizada);
      setShowIngresar(false);
      setMontoIngreso("");
      setMotivoIngreso("");
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : "Error al ingresar efectivo");
    } finally {
      setIngresando(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex text-muted transition-colors hover:text-cacao hover:opacity-80">
          <BackIcon />
        </Link>
        <Icon icon={Landmark} size={22} className="text-cacao" />
        <h1 className="text-xl font-bold text-cacao-dark">Caja operativa</h1>
      </div>

      {caja && caja.estado === "ABIERTA" ? (
        <div className="space-y-4">
          <div className="animate-scale-in rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
            <p className="text-sm text-muted">Saldo disponible</p>
            <p className="text-4xl font-bold text-accent">
              {formatMoney(caja.saldo_actual)}
            </p>
            <p className="mt-2 text-xs text-muted">
              Inicial: {formatMoney(caja.saldo_inicial)} · {caja.comprador_nombre}
            </p>
          </div>
          <p className="text-center text-sm text-muted">
            Caja abierta desde{" "}
            {new Date(caja.opened_at).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {!showIngresar ? (
            <button
              type="button"
              onClick={() => setShowIngresar(true)}
              className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-accent/50 bg-accent/10 py-3 text-sm font-medium text-accent transition-all hover:bg-accent/20 active:scale-[0.98]"
            >
              <CircleDollarSign size={18} />
              Ingresar efectivo
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-cacao">Ingresar efectivo</p>
              <div>
                <label className="mb-1 block text-xs text-muted">Monto (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoIngreso}
                  onChange={(e) => setMontoIngreso(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Motivo</label>
                <input
                  type="text"
                  value={motivoIngreso}
                  onChange={(e) => setMotivoIngreso(e.target.value)}
                  placeholder="Ej: Recarga de caja"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowIngresar(false); setMontoIngreso(""); setMotivoIngreso(""); }}
                  className="flex-1 rounded-lg border border-border py-2 text-sm flex items-center justify-center gap-1"
                >
                  <CloseCircleIcon size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleIngresar}
                  disabled={ingresando}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm text-white disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <CheckIcon size={14} />
                  {ingresando ? "Ingresando..." : "Confirmar ingreso"}
                </button>
              </div>
            </div>
          )}

          {!showConfirmCierre ? (
            <button
              type="button"
              onClick={handleCerrar}
              disabled={cerrando}
              className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-danger/50 bg-danger/10 py-3 text-sm font-medium text-danger transition-all hover:bg-danger/20 active:scale-[0.98] disabled:opacity-50"
            >
              <Lock size={16} />
              {cerrando ? "Procesando..." : "Cerrar caja"}
            </button>
          ) : (
            <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
              <h2 className="font-bold text-cacao-dark">Resumen del día</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Compras realizadas</span>
                  <span className="font-medium">{resumen?.num_compras ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total pagado</span>
                  <span className="font-medium">{formatMoney(resumen?.total_compras ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Saldo inicial</span>
                  <span className="font-medium">{formatMoney(resumen?.saldo_inicial ?? 0)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-muted">Saldo final</span>
                  <span className="font-bold text-accent">{formatMoney(resumen?.saldo_final ?? 0)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmCierre(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm flex items-center justify-center gap-1"
                >
                  <CloseCircleIcon size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarCierre}
                  disabled={cerrando}
                  className="flex-1 rounded-xl bg-danger py-3 text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <CheckIcon size={14} />
                  {cerrando ? "Cerrando..." : "Confirmar cierre"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleAbrir} className="animate-slide-up space-y-4">
          <p className="text-sm text-muted">
            Abre la caja para comenzar a registrar compras del día.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Saldo inicial (S/)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comprador</label>
            <input
              type="text"
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3"
              required
            />
          </div>
          <button
            type="submit"
            disabled={abriendo}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent py-3 font-medium text-white transition-all hover:bg-accent-light active:scale-[0.98] disabled:opacity-50"
          >
            <Unlock size={18} />
            {abriendo ? "Abriendo..." : "Abrir caja"}
          </button>
        </form>
      )}
    </div>
  );
}
