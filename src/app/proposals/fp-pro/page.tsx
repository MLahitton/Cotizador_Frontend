"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { FpProProposalPageContent } from "@/features/fp-pro-proposals/components/fp-pro-proposal-page-content";

function FpProProposalContent() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = [user.firstName, user.lastName].filter(Boolean).map((name) => name?.charAt(0).toUpperCase()).join("");
  return <AppShell displayName={fullName} email={user.email} initials={initials} onSignOut={() => { signOut(); router.replace("/login"); }}><FpProProposalPageContent /></AppShell>;
}

export default function FpProProposalPage() {
  return <ProtectedRoute><FpProProposalContent /></ProtectedRoute>;
}
