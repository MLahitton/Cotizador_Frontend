"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { getPreQuoteDocuments } from "@/features/prequotes/prequote-documents-api";
import type { PreQuoteDocumentsPage } from "@/features/prequotes/prequote-documents-types";
import type { PreQuoteLoadError } from "@/features/prequotes/prequotes-types";

const PAGE_SIZE = 20;

type DocumentsState =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: PreQuoteDocumentsPage; error: null }
  | { key: string; status: "error"; data: null; error: PreQuoteLoadError };

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function idleState(key: string): DocumentsState {
  return { key, status: "idle", data: null, error: null };
}

export function usePreQuoteDocuments(
  preQuoteId: string,
  page: number,
  enabled: boolean,
) {
  const [reloadKey, setReloadKey] = useState(0);
  const documentsKey = `${preQuoteId}:${page}:${reloadKey}`;
  const [documentsState, setDocumentsState] = useState<DocumentsState>(() =>
    idleState(documentsKey),
  );
  const requestIdRef = useRef(0);
  const currentPreQuoteIdRef = useRef(preQuoteId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);

  useEffect(() => {
    currentPreQuoteIdRef.current = preQuoteId;
  }, [preQuoteId]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestedPreQuoteId = preQuoteId;

    if (!enabled || !isPreQuoteIdValid) {
      return;
    }

    void getPreQuoteDocuments({
      preQuoteId: requestedPreQuoteId,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((response) => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(currentPreQuoteIdRef.current, requestedPreQuoteId)
        ) {
          setDocumentsState({
            key: documentsKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(currentPreQuoteIdRef.current, requestedPreQuoteId)
        ) {
          setDocumentsState({
            key: documentsKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      })
  }, [documentsKey, enabled, isPreQuoteIdValid, page, preQuoteId]);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const renderableDocumentsPage =
    documentsState.key === documentsKey && documentsState.status === "success"
      ? documentsState.data
      : null;
  const renderableError =
    documentsState.key === documentsKey && documentsState.status === "error"
      ? documentsState.error
      : null;

  return {
    documentsPage: renderableDocumentsPage,
    error: renderableError,
    isLoading:
      enabled &&
      isPreQuoteIdValid &&
      (documentsState.key !== documentsKey ||
        documentsState.status === "loading"),
    isRefreshing: false,
    page,
    pageSize: PAGE_SIZE,
    refresh,
  };
}
