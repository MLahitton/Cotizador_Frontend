"use client";

import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { ClientDetailsPageContent } from "@/features/clients/components/client-details-page-content";

function ClientDetailsContent() {
  const params = useParams<{ clientId?: string | string[] }>();
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
  const clientId =
    typeof params.clientId === "string" ? params.clientId : "";

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
      <ClientDetailsPageContent clientId={clientId} />
    </AppShell>
  );
}

export default function ClientDetailsPage() {
  return (
    <ProtectedRoute>
      <ClientDetailsContent />
    </ProtectedRoute>
  );
}
