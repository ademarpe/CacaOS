import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { AuthProvider } from "@/components/AuthProvider";

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
