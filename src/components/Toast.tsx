"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Info, X } from "lucide-react";
import {
  CheckoutCompleteIcon,
  CloseCircleIcon,
  BellIcon,
} from "./icons";

// ─── Types ────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  removing: boolean;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

type ToastOptions =
  | { type: ToastType; message: string; duration?: number }
  | string;

// ─── Config ───────────────────────────────────────────────

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

const ICONS: Record<ToastType, React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckoutCompleteIcon,
  error: CloseCircleIcon,
  warning: BellIcon,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: "border-l-accent bg-accent/5",
  error: "border-l-danger bg-danger/5",
  warning: "border-l-warning bg-warning/5",
  info: "border-l-cacao-light bg-cacao/5",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-accent",
  error: "text-danger",
  warning: "text-warning",
  info: "text-cacao-light",
};

// ─── Context ──────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback seguro si se usa fuera del provider (en servers components no pasa)
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = DEFAULT_DURATION) => {
      const id = String(++counterRef.current);
      const newToast: ToastItem = { id, type, message, duration, removing: false };

      setToasts((prev) => {
        const next = [...prev, newToast];
        // Mantener máximo de toasts visibles
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });

      // Auto-remover después de la duración
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
        );
        // Esperar animación de salida antes de remover del DOM
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      if (typeof opts === "string") {
        addToast("info", opts);
      } else {
        addToast(opts.type, opts.message, opts.duration);
      }
    },
    [addToast]
  );

  const value: ToastContextValue = {
    toast,
    success: useCallback((m: string) => addToast("success", m), [addToast]),
    error: useCallback((m: string) => addToast("error", m), [addToast]),
    warning: useCallback((m: string) => addToast("warning", m), [addToast]),
    info: useCallback((m: string) => addToast("info", m), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor de toasts — fijo en la parte superior */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto mt-16 flex w-full max-w-lg flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const border = COLORS[t.type];
          const iconColor = ICON_COLORS[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border border-l-4 bg-surface p-4 shadow-lg transition-all duration-300 ${
                border
              } ${
                t.removing
                  ? "animate-slide-up opacity-0"
                  : "animate-slide-down"
              }`}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm font-medium text-foreground">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-lg p-0.5 text-muted transition-colors hover:bg-border hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
