"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => router.push("/"), 200);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  const showError = !loading && !user;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#120600] to-cacao px-6 text-white">
      <div className="animate-fade-in text-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <Sprout size={32} className="text-accent" />
          <span className="text-2xl font-bold">CacaoOS</span>
        </Link>

        {loading && (
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-white/80">Iniciando sesión...</p>
          </div>
        )}

        {!loading && user && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/30">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-lg font-medium">Sesión iniciada</p>
            <p className="text-sm text-white/60">Redirigiendo al dashboard...</p>
          </div>
        )}

        {showError && (
          <div className="space-y-4">
            <p className="text-danger">Error al iniciar sesión</p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-white/10 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Volver a intentar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
