"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi, AlertCircle, LogOut, ChevronDown } from "lucide-react";
import { CheckIcon, RefreshIcon } from "./icons";
import { useAuth } from "./AuthProvider";
import logoImg from "@/assets/icons/cacao-logo.png";
import {
  getComprasPendientesSync,
  getModoAlmacenamiento,
} from "@/lib/services/compras";
import { procesarSync } from "@/lib/offline/sync";

type SyncFeedback =
  | { type: "success"; count: number }
  | { type: "error"; count: number }
  | null;

export function AppHeader() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [modo, setModo] = useState<"supabase" | "local">("local");
  const [pendientes, setPendientes] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const [feedback, setFeedback] = useState<SyncFeedback>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFeedback(fb: SyncFeedback) {
    setFeedback(fb);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  async function ejecutarSync() {
    setSyncing(true);
    try {
      const { synced, errors } = await procesarSync();
      setPendientes(getComprasPendientesSync());
      if (synced > 0) showFeedback({ type: "success", count: synced });
      if (errors > 0) showFeedback({ type: "error", count: errors });
    } finally {
      setSyncing(false);
    }
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setModo(getModoAlmacenamiento());
    setPendientes(getComprasPendientesSync());
    setOnline(navigator.onLine);

    const onOnline = () => {
      setOnline(true);
      ejecutarSync();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (modo !== "supabase" || !online) return;
    const interval = setInterval(ejecutarSync, 30000);
    return () => clearInterval(interval);
  }, [modo, online]);

  return (
    <header className="sticky top-0 z-50">
      {/* SVG clipPath definition — responsive, no rendering artifacts */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <clipPath id="headerShape" clipPathUnits="objectBoundingBox">
            {/*
              Left side (~0-55%): content height (y=0.53)
              Center (~55-72%): smooth bezier descent
              Right side (~72-100%): full extended height (y=1.0)
            */}
            <path d="M0,0 L1,0 L1,1 C0.72,1 0.58,0.53 0,0.53 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative bg-gradient-to-b from-[#120600] to-cacao text-white shadow-lg pb-16"
        style={{ clipPath: "url(#headerShape)" }}
      >
        {/* Main content row */}
        <div className="relative mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <Image
              src={logoImg}
              alt="CacaoOS"
              width={44}
              height={44}
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <div className="flex items-center gap-3">
            {feedback ? (
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${
                  feedback.type === "success"
                    ? "bg-accent/90"
                    : "bg-danger/90"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckIcon size={11} />
                ) : (
                  <AlertCircle size={11} />
                )}
                {feedback.type === "success"
                  ? `${feedback.count} sinc.`
                  : `${feedback.count} err.`}
              </span>
            ) : !online ? (
              <span className="flex items-center gap-1 rounded-full bg-danger/80 px-2.5 py-1 text-[11px] font-medium text-white">
                <WifiOff size={11} />
                Sin conexión
              </span>
            ) : online && modo === "supabase" && pendientes > 0 ? (
              <button
                type="button"
                onClick={ejecutarSync}
                disabled={syncing}
                className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] transition-all hover:bg-white/30 disabled:opacity-50"
              >
                <RefreshIcon
                  size={11}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing ? "..." : `${pendientes}`}
              </button>
            ) : null}

            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
              <Wifi size={11} className="text-white/60" />
              {modo === "supabase" ? "Online" : "Local"}
            </span>

            {/* Avatar / Perfil */}
            <div ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name ?? "Usuario"}
                    className="h-8 w-8 rounded-full border-2 border-white/30 object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/80 text-xs font-bold text-white shadow-md ring-2 ring-white/20">
                    {user
                      ? (user.user_metadata?.full_name ?? "U").charAt(0).toUpperCase()
                      : "CD"}
                  </div>
                )}
                {(user || modo === "supabase") && (
                  <ChevronDown
                    size={12}
                    className={`text-white/60 transition-transform duration-200 ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown menu — FUERA del clipPath para que se superponga sobre todo */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-4 top-14 z-[100] w-48 animate-slide-down rounded-xl border border-border/50 bg-surface py-1 shadow-xl"
        >
          {user && (
            <div className="border-b border-border/50 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {user.user_metadata?.full_name ?? "Usuario"}
              </p>
              <p className="truncate text-xs text-muted">{user.email ?? ""}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              signOut();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/5"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
