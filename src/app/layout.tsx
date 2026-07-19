import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { AppHeader } from "@/components/AppHeader";
import { ServiceWorker } from "@/components/ServiceWorker";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "CacaoOS – Compras",
  description: "Módulo de compras de cacao – MVP",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CacaoOS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c5430",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased h-dvh overflow-y-auto">
        <AuthProvider>
          <AuthGuard>
            <AppHeader />
            <main className="mx-auto max-w-lg px-4 pb-6 pt-4">{children}</main>
            <ServiceWorker />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
