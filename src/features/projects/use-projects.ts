"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { getProjects } from "@/features/projects/projects-api";
import type {
  ProjectAttentionFilter,
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

function parseAttention(
  value: string | null,
): ProjectAttentionFilter {
  return value === "pending" ? "pending" : null;
}

export function useProjects() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] =
    useState<ProjectsPage | null>(null);
  const [error, setError] =
    useState<unknown>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [searchInput, setSearchInput] =
    useState("");
  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [status, setStatus] =
    useState<ProjectStatusFilter>("all");

  const [clientType, setClientType] =
    useState<ProjectClientTypeFilter>(null);

  const [documentType, setDocumentType] =
    useState<ProjectDocumentTypeFilter>(null);

  const [attention, setAttention] =
    useState<ProjectAttentionFilter>(() =>
      parseAttention(
        searchParams.get("attention"),
      ),
    );

  const [page, setPageState] =
    useState(1);

  const [reloadKey, setReloadKey] =
    useState(0);

  const requestIdRef =
    useRef(0);

  const searchTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

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

  const updateAttentionInUrl = useCallback(
    (nextAttention: ProjectAttentionFilter) => {
      const nextParams =
        new URLSearchParams(
          searchParams.toString(),
        );

      if (nextAttention) {
        nextParams.set(
          "attention",
          nextAttention,
        );
      } else {
        nextParams.delete("attention");
      }

      const nextQuery =
        nextParams.toString();

      router.replace(
        nextQuery
          ? `${pathname}?${nextQuery}`
          : pathname,
      );
    },
    [
      pathname,
      router,
      searchParams,
    ],
  );

  useEffect(() => {
    const nextAttention =
      parseAttention(
        searchParams.get("attention"),
      );

    setAttention((current) =>
      current === nextAttention
        ? current
        : nextAttention,
    );

    setPageState(1);
  }, [searchParams]);

  useEffect(() => {
    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current =
      requestId;

    void getProjects({
      search:
        appliedSearch || null,
      status,
      clientId: null,
      clientType,
      documentType,
      attention,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((response) => {
        if (
          requestId ===
          requestIdRef.current
        ) {
          setData(response);
        }
      })
      .catch(
        (requestError: unknown) => {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setError(requestError);
          }
        },
      )
      .finally(() => {
        if (
          requestId ===
          requestIdRef.current
        ) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
  }, [
    appliedSearch,
    attention,
    clientType,
    documentType,
    page,
    reloadKey,
    status,
  ]);

  useEffect(
    () => () =>
      clearSearchTimer(),
    [clearSearchTimer],
  );

  const prepareRequest =
    useCallback(() => {
      setError(null);

      if (data === null) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
    }, [data]);

  const applySearchValue =
    useCallback(
      (nextSearch: string) => {
        const normalizedSearch =
          nextSearch.trim();

        if (
          normalizedSearch.length >
            SEARCH_MAX_LENGTH ||
          normalizedSearch ===
            appliedSearch
        ) {
          return;
        }

        prepareRequest();
        setAppliedSearch(
          normalizedSearch,
        );
        setPageState(1);
      },
      [
        appliedSearch,
        prepareRequest,
      ],
    );

  const changeSearchInput =
    useCallback(
      (
        nextSearchInput: string,
      ) => {
        setSearchInput(
          nextSearchInput,
        );

        clearSearchTimer();

        const normalizedSearch =
          nextSearchInput.trim();

        if (
          normalizedSearch.length >
            SEARCH_MAX_LENGTH ||
          normalizedSearch ===
            appliedSearch
        ) {
          return;
        }

        searchTimerRef.current =
          setTimeout(() => {
            applySearchValue(
              normalizedSearch,
            );

            searchTimerRef.current =
              null;
          }, SEARCH_DEBOUNCE_MS);
      },
      [
        appliedSearch,
        applySearchValue,
        clearSearchTimer,
      ],
    );

  const submitSearch =
    useCallback(() => {
      clearSearchTimer();
      applySearchValue(
        searchInput,
      );
    }, [
      applySearchValue,
      clearSearchTimer,
      searchInput,
    ]);

  const clearSearch =
    useCallback(() => {
      clearSearchTimer();
      setSearchInput("");
      applySearchValue("");
    }, [
      applySearchValue,
      clearSearchTimer,
    ]);

  const changeStatus =
    useCallback(
      (
        nextStatus:
          ProjectStatusFilter,
      ) => {
        if (
          nextStatus === status
        ) {
          return;
        }

        prepareRequest();
        setStatus(nextStatus);
        setPageState(1);
      },
      [
        prepareRequest,
        status,
      ],
    );

  const changeClientType =
    useCallback(
      (
        nextClientType:
          ProjectClientTypeFilter,
      ) => {
        if (
          nextClientType ===
          clientType
        ) {
          return;
        }

        prepareRequest();
        setClientType(
          nextClientType,
        );
        setPageState(1);
      },
      [
        clientType,
        prepareRequest,
      ],
    );

  const changeDocumentType =
    useCallback(
      (
        nextDocumentType:
          ProjectDocumentTypeFilter,
      ) => {
        if (
          nextDocumentType ===
          documentType
        ) {
          return;
        }

        prepareRequest();
        setDocumentType(
          nextDocumentType,
        );
        setPageState(1);
      },
      [
        documentType,
        prepareRequest,
      ],
    );

  const changePage =
    useCallback(
      (nextPage: number) => {
        const normalizedPage =
          Math.max(
            1,
            nextPage,
          );

        if (
          normalizedPage === page
        ) {
          return;
        }

        prepareRequest();
        setPageState(
          normalizedPage,
        );
      },
      [
        page,
        prepareRequest,
      ],
    );

  const reload =
    useCallback(() => {
      prepareRequest();

      setReloadKey(
        (current) =>
          current + 1,
      );
    }, [prepareRequest]);

  const clearFilters =
    useCallback(() => {
      if (
        appliedSearch === "" &&
        status === "all" &&
        clientType === null &&
        documentType === null &&
        attention === null
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
      setAttention(null);
      setPageState(1);

      if (attention !== null) {
        updateAttentionInUrl(
          null,
        );
      }
    }, [
      appliedSearch,
      attention,
      clearSearchTimer,
      clientType,
      documentType,
      prepareRequest,
      status,
      updateAttentionInUrl,
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
    attention,
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