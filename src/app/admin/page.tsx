"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboardPageContent } from "@/features/admin/components/admin-dashboard-page-content";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";

function AdminContent() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
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
      <AdminDashboardPageContent />
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}