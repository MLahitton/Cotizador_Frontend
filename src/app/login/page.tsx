"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Accede al cotizador de Steel and Glass con tu cuenta de Google.
        </p>

        <div className="mt-6">
          <GoogleSignIn />
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        {visibleNotice ? (
          <p className="mt-4 text-sm text-amber-800" role="status" aria-live="polite">
            {visibleNotice}
          </p>
        ) : null}
      </section>
    </main>
  );
}
