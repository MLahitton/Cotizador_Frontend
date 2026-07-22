"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FullPageStatus } from "@/components/full-page-status";
import { useAuth } from "@/features/auth/auth-context";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isAuthenticated, isInitializing, router]);

  return (
    <FullPageStatus
      message={isInitializing ? "Restaurando sesión..." : "Redirigiendo..."}
    />
  );
}
