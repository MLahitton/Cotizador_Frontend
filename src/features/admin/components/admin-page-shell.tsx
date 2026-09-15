"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";

function AdminShellContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((name) => name?.charAt(0).toUpperCase())
    .join("");

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <AppShell
      displayName={fullName}
      email={user.email}
      initials={initials}
      onSignOut={handleSignOut}
    >
      {children}
    </AppShell>
  );
}

export function AdminPageShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminShellContent>{children}</AdminShellContent>
    </ProtectedRoute>
  );
}