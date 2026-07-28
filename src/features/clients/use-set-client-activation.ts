"use client";

import { useCallback, useRef, useState } from "react";

import { setClientActivation } from "@/features/clients/clients-api";
import type { ClientDetails } from "@/features/clients/clients-types";

export interface ClientActivationError {
  cause: unknown;
}

export interface UseSetClientActivationResult {
  setActivation: (
    clientId: string,
    isActive: boolean,
  ) => Promise<ClientDetails | null>;
  isSubmitting: boolean;
  error: ClientActivationError | null;
  resetError: () => void;
}

export function useSetClientActivation(): UseSetClientActivationResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ClientActivationError | null>(null);
  const isSubmittingRef = useRef(false);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const setActivation = useCallback(
    async (clientId: string, isActive: boolean) => {
      if (isSubmittingRef.current) {
        return null;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        return await setClientActivation(clientId, { isActive });
      } catch (requestError: unknown) {
        setError({ cause: requestError });
        return null;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    setActivation,
    isSubmitting,
    error,
    resetError,
  };
}
