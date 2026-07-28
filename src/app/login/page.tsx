"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginAccessPanel } from "@/components/auth/login-access-panel";
import { LoginBrandPanel } from "@/components/auth/login-brand-panel";
import { FullPageStatus } from "@/components/full-page-status";
import { useAuth } from "@/features/auth/auth-context";
import { GoogleSignIn } from "@/features/auth/google-sign-in";

export default function LoginPage() {
  const router = useRouter();
  const { error, isAuthenticated, isInitializing, notice } = useAuth();

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return <FullPageStatus message="Restaurando sesión..." />;
  }

  if (isAuthenticated) {
    return <FullPageStatus message="Redirigiendo al dashboard..." />;
  }

  const visibleNotice = notice === error ? null : notice;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background lg:grid lg:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)]">
      <LoginBrandPanel />
      <LoginAccessPanel error={error} notice={visibleNotice}>
        <div className="flex justify-center">
          <GoogleSignIn />
        </div>
      </LoginAccessPanel>
    </main>
  );
}
