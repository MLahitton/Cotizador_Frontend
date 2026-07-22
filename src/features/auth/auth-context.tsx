"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser, signInWithGoogleRequest } from "@/features/auth/auth-api";
import {
  getAccessToken,
  removeAccessToken,
  saveAccessToken,
  UNAUTHORIZED_EVENT_NAME,
} from "@/features/auth/auth-storage";
import type { AuthenticatedUser } from "@/features/auth/auth-types";
import { ApiError } from "@/lib/http/api-error";

const EXPIRED_SESSION_NOTICE =
  "Tu sesión venció. Inicia sesión nuevamente.";
const ACCESS_DENIED_MESSAGE =
  "Tu usuario no tiene acceso a la aplicación.";

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSigningIn: boolean;
  error: string | null;
  notice: string | null;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signOut: () => void;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSignInErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible completar el inicio de sesión. Intenta nuevamente.";
  }

  switch (error.status) {
    case 0:
      return error.detail;
    case 400:
      return error.problemDetails?.detail ?? "La solicitud de inicio de sesión no es válida.";
    case 401:
      return "No fue posible validar la cuenta de Google.";
    case 403:
      return ACCESS_DENIED_MESSAGE;
    case 409:
      return error.problemDetails?.detail ?? "No fue posible completar el inicio de sesión. Intenta nuevamente.";
    case 500:
      return "Se produjo un error al iniciar sesión.";
    case 503:
      return "El servicio de autenticación no está disponible temporalmente.";
    default:
      return "No fue posible completar el inicio de sesión. Intenta nuevamente.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const restorePromiseRef = useRef<Promise<void> | null>(null);
  const signingInRef = useRef(false);

  const restoreSession = useCallback((): Promise<void> => {
    if (restorePromiseRef.current) {
      return restorePromiseRef.current;
    }

    const restoration = (async () => {
      setIsInitializing(true);
      const accessToken = getAccessToken();

      if (!accessToken) {
        setUser(null);
        setIsInitializing(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setError(null);
      } catch (requestError: unknown) {
        setUser(null);
        if (requestError instanceof ApiError && requestError.status === 403) {
          setError(ACCESS_DENIED_MESSAGE);
        } else if (!(requestError instanceof ApiError && requestError.status === 401)) {
          setError(
            requestError instanceof ApiError
              ? requestError.detail
              : "No fue posible restaurar la sesión.",
          );
        }
      } finally {
        setIsInitializing(false);
      }
    })();

    restorePromiseRef.current = restoration;
    void restoration.finally(() => {
      if (restorePromiseRef.current === restoration) {
        restorePromiseRef.current = null;
      }
    });
    return restoration;
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setError(null);
      setNotice(EXPIRED_SESSION_NOTICE);
    };

    window.addEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT_NAME, handleUnauthorized);
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string): Promise<boolean> => {
    if (signingInRef.current) {
      return false;
    }

    signingInRef.current = true;
    setIsSigningIn(true);
    setError(null);

    try {
      const response = await signInWithGoogleRequest(idToken);
      saveAccessToken(response.accessToken);
      setUser(response.user);
      setNotice(null);
      return true;
    } catch (requestError: unknown) {
      setError(getSignInErrorMessage(requestError));
      return false;
    } finally {
      signingInRef.current = false;
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    removeAccessToken();
    setUser(null);
    setError(null);
    setNotice(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      isSigningIn,
      error,
      notice,
      signInWithGoogle,
      signOut,
      restoreSession,
      clearError,
    }),
    [
      user,
      isInitializing,
      isSigningIn,
      error,
      notice,
      signInWithGoogle,
      signOut,
      restoreSession,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
