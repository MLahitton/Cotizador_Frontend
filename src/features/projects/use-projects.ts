"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getProjects } from "@/features/projects/projects-api";
import type {
  ProjectClientTypeFilter,
  ProjectDocumentTypeFilter,
  ProjectsPage,
  ProjectStatusFilter,
} from "@/features/projects/projects-types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_MAX_LENGTH = 200;
const SEARCH_VALIDATION_MESSAGE =
  "La búsqueda no puede superar los 200 caracteres.";

export function useProjects() {
  const [data, setData] = useState<ProjectsPage | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatusFilter>("all");
  const [clientType, setClientType] =
    useState<ProjectClientTypeFilter>(null);
  const [documentType, setDocumentType] =
    useState<ProjectDocumentTypeFilter>(null);
  const [page, setPageState] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchValidationMessage =
    searchInput.trim().length > SEARCH_MAX_LENGTH
      ? SEARCH_VALIDATION_MESSAGE
      : "";

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void getProjects({
      search: appliedSearch || null,
      status,
      clientId: null,
      clientType,
      documentType,
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
  }, [appliedSearch, clientType, documentType, page, reloadKey, status]);

  useEffect(() => () => clearSearchTimer(), [clearSearchTimer]);

  const prepareRequest = useCallback(() => {
    setError(null);
    if (data === null) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
  }, [data]);

  const applySearchValue = useCallback(
    (nextSearch: string) => {
      const normalizedSearch = nextSearch.trim();
      if (
        normalizedSearch.length > SEARCH_MAX_LENGTH ||
        normalizedSearch === appliedSearch
      ) {
        return;
      }

      prepareRequest();
      setAppliedSearch(normalizedSearch);
      setPageState(1);
    },
    [appliedSearch, prepareRequest],
  );

  const changeSearchInput = useCallback(
    (nextSearchInput: string) => {
      setSearchInput(nextSearchInput);
      clearSearchTimer();

      const normalizedSearch = nextSearchInput.trim();
      if (
        normalizedSearch.length > SEARCH_MAX_LENGTH ||
        normalizedSearch === appliedSearch
      ) {
        return;
      }

      searchTimerRef.current = setTimeout(() => {
        applySearchValue(normalizedSearch);
        searchTimerRef.current = null;
      }, SEARCH_DEBOUNCE_MS);
    },
    [appliedSearch, applySearchValue, clearSearchTimer],
  );

  const submitSearch = useCallback(() => {
    clearSearchTimer();
    applySearchValue(searchInput);
  }, [applySearchValue, clearSearchTimer, searchInput]);

  const clearSearch = useCallback(() => {
    clearSearchTimer();
    setSearchInput("");
    applySearchValue("");
  }, [applySearchValue, clearSearchTimer]);

  const changeStatus = useCallback(
    (nextStatus: ProjectStatusFilter) => {
      if (nextStatus === status) {
        return;
      }

      prepareRequest();
      setStatus(nextStatus);
      setPageState(1);
    },
    [prepareRequest, status],
  );

  const changeClientType = useCallback(
    (nextClientType: ProjectClientTypeFilter) => {
      if (nextClientType === clientType) {
        return;
      }

      prepareRequest();
      setClientType(nextClientType);
      setPageState(1);
    },
    [clientType, prepareRequest],
  );

  const changeDocumentType = useCallback(
    (nextDocumentType: ProjectDocumentTypeFilter) => {
      if (nextDocumentType === documentType) {
        return;
      }

      prepareRequest();
      setDocumentType(nextDocumentType);
      setPageState(1);
    },
    [documentType, prepareRequest],
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
    if (
      appliedSearch === "" &&
      status === "all" &&
      clientType === null &&
      documentType === null
    ) {
      return;
    }

    clearSearchTimer();
    prepareRequest();
    setSearchInput("");
    setAppliedSearch("");
    setStatus("all");
    setClientType(null);
    setDocumentType(null);
    setPageState(1);
  }, [
    appliedSearch,
    clearSearchTimer,
    clientType,
    documentType,
    prepareRequest,
    status,
  ]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    searchInput,
    appliedSearch,
    searchValidationMessage,
    status,
    clientType,
    documentType,
    page,
    pageSize: PAGE_SIZE,
    changeSearchInput,
    submitSearch,
    clearSearch,
    changeStatus,
    changeClientType,
    changeDocumentType,
    changePage,
    clearFilters,
    reload,
  };
}
