"use client";

import { useCallback, useRef, useState } from "react";

import { updateClient } from "@/features/clients/clients-api";
import type {
  ClientDetails,
  UpdateClientPayload,
} from "@/features/clients/clients-types";

export interface UpdateClientError {
  cause: unknown;
}

export interface UseUpdateClientResult {
  update: (
    clientId: string,
    payload: UpdateClientPayload,
  ) => Promise<ClientDetails | null>;
  isSubmitting: boolean;
  error: UpdateClientError | null;
  resetError: () => void;
}

export function useUpdateClient(): UseUpdateClientResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<UpdateClientError | null>(null);
  const isSubmittingRef = useRef(false);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const update = useCallback(
    async (clientId: string, payload: UpdateClientPayload) => {
      if (isSubmittingRef.current) {
        return null;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        return await updateClient(clientId, payload);
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
    update,
    isSubmitting,
    error,
    resetError,
  };
}
