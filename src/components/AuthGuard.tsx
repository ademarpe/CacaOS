"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();

  const configured = supabase !== null;

  useEffect(() => {
    // Only redirect if Supabase is configured AND no user is logged in
    if (!loading && configured && !user) {
      router.push("/login");
    }
  }, [user, loading, configured, router]);

  // Show nothing while checking auth (flash of login prevention)
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

  // If configured but no user, show nothing (will redirect)
  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cacao/30 border-t-cacao" />
      </div>
    );
  }

  return <>{children}</>;
}
