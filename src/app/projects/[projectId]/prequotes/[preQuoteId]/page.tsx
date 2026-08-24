"use client";

import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { PreQuoteDetailPageContent } from "@/features/prequotes/components/prequote-detail-page-content";

function ProjectPreQuoteDetailContent() {
  const params = useParams<{
    projectId?: string | string[];
    preQuoteId?: string | string[];
  }>();
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
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";
  const preQuoteId =
    typeof params.preQuoteId === "string" ? params.preQuoteId : "";

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
      <PreQuoteDetailPageContent
        projectId={projectId}
        preQuoteId={preQuoteId}
      />
    </AppShell>
  );
}

export default function ProjectPreQuoteDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectPreQuoteDetailContent />
    </ProtectedRoute>
  );
}
