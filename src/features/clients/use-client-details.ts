"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getClientById } from "@/features/clients/clients-api";
import type { ClientDetails } from "@/features/clients/clients-types";

export interface ClientDetailsError {
  cause: unknown;
}

export interface UseClientDetailsResult {
  client: ClientDetails | null;
  error: ClientDetailsError | null;
  isLoading: boolean;
  reload: () => void;
  replaceClient: (client: ClientDetails) => void;
}

export function useClientDetails(clientId: string): UseClientDetailsResult {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [error, setError] = useState<ClientDetailsError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getClientById(clientId)
      .then((response) => {
        if (isMounted && requestId === requestIdRef.current) {
          setClient(response);
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted && requestId === requestIdRef.current) {
          setError({ cause: requestError });
          setClient(null);
        }
      })
      .finally(() => {
        if (isMounted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, reloadKey]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  const replaceClient = useCallback((nextClient: ClientDetails) => {
    setClient(nextClient);
    setError(null);
  }, []);

  return {
    client,
    error,
    isLoading,
    reload,
    replaceClient,
  };
}
