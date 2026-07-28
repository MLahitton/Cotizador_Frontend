"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getClients } from "@/features/clients/clients-api";
import type {
  ClientsPage,
  ClientStatusFilter,
} from "@/features/clients/clients-types";

const PAGE_SIZE = 20;

export function useClients() {
  const [data, setData] = useState<ClientsPage | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatusFilter>("active");
  const [page, setPageState] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getClients({
      search: search || null,
      status,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setData(response);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === requestIdRef.current) {
          setError(requestError);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
  }, [page, reloadKey, search, status]);

  const prepareRequest = useCallback(() => {
    setError(null);
    if (data === null) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
  }, [data]);

  const applySearch = useCallback(
    (nextSearch: string) => {
      const normalizedSearch = nextSearch.trim();
      if (normalizedSearch === search) {
        return;
      }

      prepareRequest();
      setSearch(normalizedSearch);
      setPageState(1);
    },
    [prepareRequest, search],
  );

  const changeStatus = useCallback(
    (nextStatus: ClientStatusFilter) => {
      if (nextStatus === status) {
        return;
      }

      prepareRequest();
      setStatus(nextStatus);
      setPageState(1);
    },
    [prepareRequest, status],
  );

  const changePage = useCallback(
    (nextPage: number) => {
      const normalizedPage = Math.max(1, nextPage);
      if (normalizedPage === page) {
        return;
      }

      prepareRequest();
      setPageState(normalizedPage);
    },
    [page, prepareRequest],
  );

  const reload = useCallback(() => {
    prepareRequest();
    setReloadKey((current) => current + 1);
  }, [prepareRequest]);

  const clearFilters = useCallback(() => {
    if (search === "" && status === "active") {
      return;
    }

    prepareRequest();
    setSearch("");
    setStatus("active");
    setPageState(1);
  }, [prepareRequest, search, status]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
    applySearch,
    changeStatus,
    changePage,
    clearFilters,
    reload,
  };
}
