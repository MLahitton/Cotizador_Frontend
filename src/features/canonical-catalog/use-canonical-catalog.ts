"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getCanonicalCatalog } from "./canonical-catalog-api";
import type { GetCanonicalCatalogResponse } from "./canonical-catalog-types";

const EMPTY_CATALOG: GetCanonicalCatalogResponse = {
  systems: [],
  frames: [],
  finishes: [],
  aliases: [],
};

export function useCanonicalCatalog() {
  const [data, setData] = useState<GetCanonicalCatalogResponse>(EMPTY_CATALOG);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);

  const runRequest = useCallback(() => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getCanonicalCatalog()
      .then((response) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setData(response);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError(requestError);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;
        }

        if (mountedRef.current && requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    runRequest();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      inFlightRef.current = false;
    };
  }, [runRequest]);

  const refresh = useCallback(() => {
    if (inFlightRef.current) {
      return;
    }

    setError(null);
    setIsRefreshing(true);
    runRequest();
  }, [runRequest]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}
