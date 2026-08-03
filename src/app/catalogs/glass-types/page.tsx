"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { GlassCatalogPageContent } from "@/features/glass-catalog/components/glass-catalog-page-content";

function GlassTypesCatalogContent() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  if (!user) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
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
      <GlassCatalogPageContent />
    </AppShell>
  );
}

export default function GlassTypesCatalogPage() {
  return (
    <ProtectedRoute>
      <GlassTypesCatalogContent />
    </ProtectedRoute>
  );
}
