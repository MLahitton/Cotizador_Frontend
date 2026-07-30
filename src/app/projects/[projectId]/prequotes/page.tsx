"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { ProjectPreQuotesPageContent } from "@/features/prequotes/components/project-prequotes-page-content";

function parsePage(value: string | null): number {
  if (!value) {
    return 1;
  }

  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function ProjectPreQuotesContent() {
  const params = useParams<{ projectId?: string | string[] }>();
  const searchParams = useSearchParams();
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
  const page = parsePage(searchParams.get("page"));

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
      <ProjectPreQuotesPageContent projectId={projectId} page={page} />
    </AppShell>
  );
}

export default function ProjectPreQuotesPage() {
  return (
    <ProtectedRoute>
      <ProjectPreQuotesContent />
    </ProtectedRoute>
  );
}
