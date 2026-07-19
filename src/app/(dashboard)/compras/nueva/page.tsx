"use client";

import { FormEvent, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Landmark,
} from "lucide-react";
import { Icon } from "@/components/Icon";
import { PlusCircleIcon, CheckoutCompleteIcon, SearchIcon, BackIcon } from "@/components/icons";
import {
  buscarProductores,
  crearProductor,
  obtenerCajaHoy,
  obtenerPrecioVigente,
  registrarCompraCompleta,
} from "@/lib/services/compras";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import type {
  CalidadCacao,
  NuevoProductorInput,
  Productor,
  TipoCacao,
} from "@/lib/types/database";
import {
  CALIDADES_CACAO,
  TIPOS_CACAO,
  calcularTotal,
  formatMoney,
} from "@/lib/types/database";

type Step = "productor" | "datos" | "confirmar";

export default function NuevaCompraPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("productor");
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Productor[]>([]);
  const [productor, setProductor] = useState<Productor | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [peso, setPeso] = useState("");
  const [calidad, setCalidad] = useState<CalidadCacao>("BUENA");
  const [humedad, setHumedad] = useState("");
  const [tipoCacao, setTipoCacao] = useState<TipoCacao>("BABA");
  const [precioSugerido, setPrecioSugerido] = useState(0);
  const [precioAplicado, setPrecioAplicado] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const toasts = useToast();

  const [nuevoProductor, setNuevoProductor] = useState<NuevoProductorInput>({
    nombre: "",
    comunidad: "",
    caserio: "",
    tipo_cacao: "BABA",
  });

  useEffect(() => {
    obtenerCajaHoy().then((c) => setCajaAbierta(!!c && c.estado === "ABIERTA"));
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(() => {
      buscarProductores(query).then(setResultados);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (step !== "datos") return;
    obtenerPrecioVigente(tipoCacao)
      .then((p) => {
        setPrecioSugerido(p);
        setPrecioAplicado(String(p));
      })
      .catch(() => setError("No hay precio semanal para este tipo"));
  }, [tipoCacao, step]);

  const total = calcularTotal(
    parseFloat(peso) || 0,
    parseFloat(precioAplicado) || 0
  );

  async function handleCrearProductor(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const p = await crearProductor(nuevoProductor);
      setProductor(p);
      setTipoCacao(p.tipo_cacao);
      setShowNuevo(false);
      setStep("datos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar productor");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmar() {
    if (!productor) return;
    setLoading(true);
    setError("");
    try {
      await registrarCompraCompleta({
        productor_id: productor.id,
        peso: parseFloat(peso),
        calidad,
        humedad: humedad ? parseFloat(humedad) : undefined,
        tipo_cacao: tipoCacao,
        precio_sugerido: precioSugerido,
        precio_aplicado: parseFloat(precioAplicado),
        observaciones: observaciones || undefined,
        comprador_nombre: user?.user_metadata?.full_name ?? "Usuario",
      });
      setSuccess(true);
    } catch (err) {
      console.error("❌ Error al registrar compra:", err);
      let message: string;
      try {
        message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : JSON.stringify(err, Object.getOwnPropertyNames(err));
      } catch {
        message = String(err);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep("productor");
    setProductor(null);
    setQuery("");
    setPeso("");
    setCalidad("BUENA");
    setHumedad("");
    setPrecioAplicado("");
    setObservaciones("");
    setSuccess(false);
    setError("");
  }

  if (!cajaAbierta) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-warning/10">
          <Landmark size={40} className="text-warning" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Caja cerrada</h1>
          <p className="mt-1 text-sm text-muted">
            Debes abrir la caja antes de registrar compras.
          </p>
        </div>
        <Link
          href="/caja"
          className="inline-block rounded-xl bg-accent px-6 py-3 font-medium text-white transition-all hover:bg-accent-light active:scale-95"
        >
          Abrir caja
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Link href="/" className="inline-flex text-muted transition-colors hover:text-cacao hover:opacity-80">
          <BackIcon />
        </Link>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <CheckoutCompleteIcon size={44} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-accent">Compra registrada</h1>
            <p className="mt-1 text-muted">
              {productor?.nombre} · {peso} kg · {formatMoney(total)}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition-all hover:bg-accent-light active:scale-95"
          >
            <PlusCircleIcon size={18} />
            Nueva compra
          </button>
        </div>
      </div>
    );
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
        <div className="ml-2 flex items-center gap-2">
          <CircleDollarSign size={22} className="text-cacao" />
          <h1 className="text-xl font-bold text-cacao-dark">Nueva compra</h1>
        </div>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {step === "productor" && !showNuevo && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Buscar productor
            </label>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, comunidad o caserío..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-10 outline-none focus:border-accent"
              autoFocus
            />
            </div>
          </div>

          {resultados.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {resultados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProductor(p);
                      setTipoCacao(p.tipo_cacao);
                      setStep("datos");
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-background"
                  >
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted">
                      {p.comunidad} · {p.caserio} · {p.tipo_cacao}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowNuevo(true)}
            className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted hover:border-accent hover:text-accent"
          >
            + Registrar productor nuevo
          </button>
        </div>
      )}

      {step === "productor" && showNuevo && (
        <form onSubmit={handleCrearProductor} className="space-y-3">
          <p className="text-sm font-medium text-cacao">Nuevo productor</p>
          <Input
            label="Nombre *"
            value={nuevoProductor.nombre}
            onChange={(v) => setNuevoProductor({ ...nuevoProductor, nombre: v })}
            required
          />
          <Input
            label="Comunidad *"
            value={nuevoProductor.comunidad}
            onChange={(v) =>
              setNuevoProductor({ ...nuevoProductor, comunidad: v })
            }
            required
          />
          <Input
            label="Caserío *"
            value={nuevoProductor.caserio}
            onChange={(v) => setNuevoProductor({ ...nuevoProductor, caserio: v })}
            required
          />
          <Select
            label="Tipo de cacao *"
            value={nuevoProductor.tipo_cacao}
            onChange={(v) =>
              setNuevoProductor({
                ...nuevoProductor,
                tipo_cacao: v as TipoCacao,
              })
            }
            options={TIPOS_CACAO.map((t) => ({ value: t.value, label: t.label }))}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNuevo(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar y continuar"}
            </button>
          </div>
        </form>
      )}

      {step === "datos" && productor && (
        <div className="space-y-4">
          <div className="rounded-xl bg-cacao/5 px-4 py-3">
            <p className="text-xs text-muted">Productor</p>
            <p className="font-semibold">{productor.nombre}</p>
            <p className="text-xs text-muted">
              {productor.comunidad} · {productor.caserio}
            </p>
          </div>

          <Input
            label={<><span className="text-danger">*</span> Peso (kg)</>}
            type="number"
            step="0.01"
            min="0.01"
            value={peso}
            onChange={setPeso}
            required
          />

          <Select
            label="Calidad (opcional)"
            value={calidad}
            onChange={(v) => setCalidad(v as CalidadCacao)}
            options={CALIDADES_CACAO.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
          />

          <Select
            label={<>Humedad <span className="text-xs text-muted">(opcional)</span></>}
            value={humedad}
            onChange={setHumedad}
            placeholder="Seleccionar"
            options={[
              { value: "3", label: "1-5%" },
              { value: "7.5", label: "5-10%" },
              { value: "12.5", label: "10-15%" },
              { value: "17.5", label: "15% a +" },
            ]}
          />

          <Select
            label="Tipo de cacao (opcional)"
            value={tipoCacao}
            onChange={(v) => setTipoCacao(v as TipoCacao)}
            options={TIPOS_CACAO.map((t) => ({ value: t.value, label: t.label }))}
          />

          <div>
            <label className="mb-1 block text-sm font-medium">
              <span className="text-danger">*</span> Precio aplicado (S/ kg)
            </label>
            <p className="mb-1 text-xs text-muted">
              Sugerido: {formatMoney(precioSugerido)}/kg
            </p>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={precioAplicado}
              onChange={(e) => setPrecioAplicado(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
              required
            />
          </div>

          <div className="rounded-xl bg-accent/5 px-4 py-3">
            <p className="text-xs text-muted">Total calculado</p>
            <p className="text-2xl font-bold text-accent">{formatMoney(total)}</p>
          </div>

          <Input
            label="Observaciones"
            value={observaciones}
            onChange={setObservaciones}
          />

          <p className="text-xs text-muted">
            <span className="text-danger">*</span> Campos obligatorios
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("productor")}
              className="flex-1 rounded-xl border border-border py-3 text-sm"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => {
                if (!peso || parseFloat(peso) <= 0) {
                  toasts.warning("Completa el peso para continuar");
                  return;
                }
                if (!precioAplicado || parseFloat(precioAplicado) <= 0) {
                  toasts.warning("Completa el precio para continuar");
                  return;
                }
                setError("");
                setStep("confirmar");
              }}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-medium text-white"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === "confirmar" && productor && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <Row label="Productor" value={productor.nombre} />
            <Row label="Peso" value={`${peso} kg`} />
            <Row label="Calidad" value={calidad} />
            {humedad && <Row label="Humedad" value={`${humedad}%`} />}
            <Row label="Tipo" value={tipoCacao} />
            <Row label="Precio sugerido" value={formatMoney(precioSugerido)} />
            <Row label="Precio aplicado" value={formatMoney(parseFloat(precioAplicado))} />
            <div className="border-t border-border pt-2">
              <Row label="Total a pagar" value={formatMoney(total)} bold />
            </div>
          </div>

          <p className="text-center text-sm text-muted">
            Pago inmediato en efectivo
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("datos")}
              className="flex-1 rounded-xl border border-border py-3 text-sm"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Confirmar pago"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "productor", label: "Productor" },
    { key: "datos", label: "Datos" },
    { key: "confirmar", label: "Pago" },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              i === idx
                ? "bg-accent text-white shadow-md shadow-accent/30 scale-110"
                : i < idx
                ? "bg-accent text-white"
                : "bg-border text-muted"
            }`}
          >
            {i < idx ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`text-xs transition-all duration-300 ${
              i <= idx ? "font-medium text-foreground" : "text-muted"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 transition-all duration-500 ${
                i < idx ? "bg-accent" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  step,
  min,
  max,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={step}
        min={min}
        max={max}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={bold ? "font-bold text-lg text-accent" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
