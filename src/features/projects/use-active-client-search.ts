"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getClients } from "@/features/clients/clients-api";
import type { ClientListItem } from "@/features/clients/clients-types";

const ACTIVE_CLIENTS_PAGE_SIZE = 20;
const CLIENT_SEARCH_DEBOUNCE_MS = 350;
const CLIENT_SEARCH_MAX_LENGTH = 200;

export function useActiveClientSearch() {
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  const prepareRequest = useCallback(() => {
    setError(null);
    if (items.length === 0) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
  }, [items.length]);

  const prepareFreshRequest = useCallback(() => {
    setError(null);
    setItems([]);
    setTotalCount(0);
    setIsLoading(true);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getClients({
      search: appliedSearch || null,
      status: "active",
      page: 1,
      pageSize: ACTIVE_CLIENTS_PAGE_SIZE,
    })
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setItems(response.items.filter((client) => client.isActive));
          setTotalCount(response.totalCount);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === requestIdRef.current) {
          setItems([]);
          setTotalCount(0);
          setError(requestError);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
  }, [appliedSearch, reloadKey]);

  useEffect(() => () => clearSearchTimer(), [clearSearchTimer]);

  const applySearchValue = useCallback(
    (nextSearch: string) => {
      const normalizedSearch = nextSearch.trim();
      if (
        normalizedSearch.length > CLIENT_SEARCH_MAX_LENGTH ||
        normalizedSearch === appliedSearch
      ) {
        return;
      }

      prepareRequest();
      setAppliedSearch(normalizedSearch);
    },
    [appliedSearch, prepareRequest],
  );

  const changeSearchInput = useCallback(
    (nextSearchInput: string) => {
      setSearchInput(nextSearchInput);
      clearSearchTimer();

      const normalizedSearch = nextSearchInput.trim();
      if (
        normalizedSearch.length > CLIENT_SEARCH_MAX_LENGTH ||
        normalizedSearch === appliedSearch
      ) {
        return;
      }

      searchTimerRef.current = setTimeout(() => {
        applySearchValue(normalizedSearch);
        searchTimerRef.current = null;
      }, CLIENT_SEARCH_DEBOUNCE_MS);
    },
    [appliedSearch, applySearchValue, clearSearchTimer],
  );

  const retry = useCallback(() => {
    clearSearchTimer();
    prepareFreshRequest();
    setAppliedSearch(searchInput.trim());
    setReloadKey((current) => current + 1);
  }, [clearSearchTimer, prepareFreshRequest, searchInput]);

  const refresh = useCallback(() => {
    clearSearchTimer();
    prepareFreshRequest();
    setAppliedSearch(searchInput.trim());
    setReloadKey((current) => current + 1);
  }, [clearSearchTimer, prepareFreshRequest, searchInput]);

  const resetSearch = useCallback(() => {
    clearSearchTimer();
    setSearchInput("");
    prepareFreshRequest();
    setAppliedSearch("");
    setReloadKey((current) => current + 1);
  }, [clearSearchTimer, prepareFreshRequest]);

  return {
    items,
    totalCount,
    searchInput,
    appliedSearch,
    error,
    isLoading,
    isRefreshing,
    pageSize: ACTIVE_CLIENTS_PAGE_SIZE,
    changeSearchInput,
    refresh,
    retry,
    resetSearch,
  };
}
