"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale,
  HandCoins,
  Users,
  ShoppingCart,
  CircleDollarSign,
  ClipboardList,
  Sprout,
  Wallet,
  Tag,
} from "lucide-react";
import { BellIcon } from "@/components/icons";
import cajaImg from "@/assets/images/caja-action.svg";
import newBuyImg from "@/assets/images/new-buy.svg";
import pricesImg from "@/assets/images/prices.svg";
import historialImg from "@/assets/images/agreement-transparent.svg";
import productoresImg from "@/assets/images/rice-field-transparent.svg";
import { BalanceCard } from "@/components/BalanceCard";
import { MetricStrip } from "@/components/MetricStrip";
import { QuickActionCard } from "@/components/QuickActionCard";
import { Skeleton } from "@/components/Skeleton";
import {
  obtenerCajaHoy,
  obtenerDashboard,
} from "@/lib/services/compras";
import type { CajaSesion, DashboardDiario } from "@/lib/types/database";
import { formatKg, formatMoney } from "@/lib/types/database";

function getFecha(): string {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardDiario | null>(null);
  const [caja, setCaja] = useState<CajaSesion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, cajaHoy] = await Promise.all([
          obtenerDashboard(),
          obtenerCajaHoy(),
        ]);
        setDashboard(dash);
        setCaja(cajaHoy);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 mt-1">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cajaCerrada = !caja || caja.estado !== "ABIERTA";

  return (
      <div className="space-y-5 -mt-14">
      <div className="animate-fade-in">
        <p className="text-sm font-medium text-cacao-dark/70">
          Hola de nuevo,
        </p>
        <h1 className="-mt-0.5 text-xl font-bold text-cacao-dark">
          <span className="text-accent">Comprador Demo</span>
        </h1>
        <p className="mt-1 text-sm capitalize text-muted">
          {getFecha()}
        </p>
      </div>

      {cajaCerrada && (
        <div className="animate-slide-up flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-cacao-dark">
          <BellIcon size={20} className="mt-0.5 shrink-0 text-warning" />
          <span>
            No hay caja abierta hoy.{" "}
            <Link href="/caja" className="font-semibold underline">
              Abrir caja
            </Link>{" "}
            para registrar compras.
          </span>
        </div>
      )}

      {caja && caja.estado === "ABIERTA" && (
        <div className="animate-scale-in">
          <BalanceCard saldo={caja.saldo_actual} />
        </div>
      )}

      <div className="animate-slide-up">
        <MetricStrip
          items={[
            { label: "Kg", value: formatKg(dashboard?.kg_comprados ?? 0), icon: Scale, color: "green" as const, comparison: "+8% vs ayer" },
            { label: "Pagado", value: formatMoney(dashboard?.total_pagado ?? 0), icon: HandCoins, color: "brown" as const, comparison: "+12% vs ayer" },
            { label: "Productores", value: String(dashboard?.productores_atendidos ?? 0), icon: Users, color: "green" as const, comparison: "Sin cambios" },
            { label: "Compras", value: String(dashboard?.num_compras ?? 0), icon: ShoppingCart, color: "brown" as const, comparison: "+1 vs ayer" },
          ]}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-cacao" />
          <h2 className="text-sm font-semibold text-cacao-dark">
            Acciones rápidas
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="animate-slide-up stagger-1">
            <QuickActionCard
              href="/compras/nueva"
              label="Nueva compra"
              desc="Registrar compra"
              color="accent"
              icon={CircleDollarSign}
              image={newBuyImg}
            />
          </div>
          <div className="animate-slide-up stagger-2">
            <QuickActionCard
              href="/compras"
              label="Historial"
              desc="Compras del día"
              color="warning"
              icon={ClipboardList}
              image={historialImg}
            />
          </div>
          <div className="animate-slide-up stagger-3">
            <QuickActionCard
              href="/productores"
              label="Productores"
              desc="Gestionar productores"
              color="cacao"
              icon={Sprout}
              image={productoresImg}
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <QuickActionCard
              href="/caja"
              label="Caja"
              desc={cajaCerrada ? "Abrir caja" : "Ver caja"}
              color="surface"
              icon={Wallet}
              image={cajaImg}
            />
          </div>
          <div className="animate-slide-up stagger-5 col-span-2">
            <QuickActionCard
              href="/precios"
              label="Precios"
              desc="Precios semanales"
              color="surface"
              icon={Tag}
              image={pricesImg}
              imageClassName="-bottom-2 right-12 opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}