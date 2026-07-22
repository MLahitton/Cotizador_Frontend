"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

import { FullPageStatus } from "@/components/full-page-status";
import { AuthProvider } from "@/features/auth/auth-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!googleClientId) {
    return (
      <FullPageStatus message="Falta la configuración de autenticación con Google." />
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}
