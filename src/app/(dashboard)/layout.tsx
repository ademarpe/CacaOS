"use client";

import { AppHeader } from "@/components/AppHeader";
import { ServiceWorker } from "@/components/ServiceWorker";
import { ToastProvider } from "@/components/Toast";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ToastProvider>
        <AppHeader />
        <main className="mx-auto max-w-lg px-4 pb-6 pt-4">{children}</main>
        <ServiceWorker />
      </ToastProvider>
    </AuthGuard>
  );
}
