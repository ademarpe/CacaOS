"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const configured = supabase !== null;

  useEffect(() => {
    // Only redirect if Supabase is configured, not loading, no user,
    // and NOT already on the login page (prevents redirect loops)
    if (!loading && configured && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, configured, router, pathname]);

  // Show spinner only while auth is being checked
  if (loading && configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cacao/30 border-t-cacao" />
      </div>
    );
  }

  // If Supabase is not configured, allow access without auth (local mode)
  if (!configured) {
    return <>{children}</>;
  }

  // If configured and auth check done:
  // - user exists → render normally
  // - no user → render children anyway; the login page handles unauthenticated UI
  return <>{children}</>;
}
