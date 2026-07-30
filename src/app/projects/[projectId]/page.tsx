"use client";

import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { ProjectDetailPageContent } from "@/features/projects/components/project-detail-page-content";

function ProjectDetailContent() {
  const params = useParams<{ projectId?: string | string[] }>();
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
      <ProjectDetailPageContent projectId={projectId} />
    </AppShell>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}
