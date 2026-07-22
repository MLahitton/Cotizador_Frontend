"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/features/auth/auth-context";

export function GoogleSignIn() {
  const router = useRouter();
  const { clearError, isSigningIn, signInWithGoogle } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (isSigningIn) {
      return;
    }

    const credential = credentialResponse.credential;
    if (!credential) {
      clearError();
      setGoogleError(
        "No fue posible obtener la credencial de Google. Intenta nuevamente.",
      );
      return;
    }

    setGoogleError(null);
    const signedIn = await signInWithGoogle(credential);
    if (signedIn) {
      router.replace("/dashboard");
    }
  };

  return (
    <div>
      <div className="relative flex min-h-11 justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            clearError();
            setGoogleError(
              "No fue posible iniciar sesión con Google. Intenta nuevamente.",
            );
          }}
          text="signin_with"
        />
        {isSigningIn ? (
          <div
            className="absolute inset-0 flex items-center justify-center rounded bg-white/90 text-sm text-slate-700"
            role="status"
            aria-live="polite"
          >
            Iniciando sesión...
          </div>
        ) : null}
      </div>
      {googleError ? (
        <p className="mt-4 text-sm text-red-700" role="alert" aria-live="assertive">
          {googleError}
        </p>
      ) : null}
    </div>
  );
}
