"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <div className="animate-fade-in w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/cacao-logo.png"
            alt="CacaoOS"
            className="h-28 w-28 object-contain drop-shadow-sm"
          />
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-cacao" />
            <p className="text-gray-500">Iniciando sesión...</p>
          </div>
        )}

        {!loading && user && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
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
            <p className="text-lg font-medium text-gray-900">Sesión iniciada</p>
            <p className="text-sm text-gray-400">Redirigiendo al dashboard...</p>
          </div>
        )}

        {showError && (
          <div className="space-y-4">
            <p className="text-danger">Error al iniciar sesión</p>
            <Link
              href="/login"
              className="inline-block rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Volver a intentar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
