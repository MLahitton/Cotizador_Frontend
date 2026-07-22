"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { FullPageStatus } from "@/components/full-page-status";
import { useAuth } from "@/features/auth/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return <FullPageStatus message="Restaurando sesión..." />;
  }

  if (!isAuthenticated) {
    return <FullPageStatus message="Redirigiendo al inicio de sesión..." />;
  }

  return children;
}
