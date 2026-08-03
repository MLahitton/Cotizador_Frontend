"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getGlassTypesCatalog } from "./glass-catalog-api";
import type { GlassCatalogItem } from "./glass-catalog-types";

export function useGlassCatalog() {
  const [items, setItems] = useState<GlassCatalogItem[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const runRequest = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getGlassTypesCatalog()
      .then((response) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setItems(response.items);
        }
      })
      .catch((requestError: unknown) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setError(requestError);
        }
      })
      .finally(() => {
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
    };
  }, [runRequest]);

  const refresh = useCallback(() => {
    setError(null);
    setIsRefreshing(true);
    runRequest();
  }, [runRequest]);

  return {
    items,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}
