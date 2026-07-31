"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { getPreQuoteDocuments } from "@/features/prequotes/prequote-documents-api";
import type { PreQuoteDocumentsPage } from "@/features/prequotes/prequote-documents-types";
import type { PreQuoteLoadError } from "@/features/prequotes/prequotes-types";

const PAGE_SIZE = 20;

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function usePreQuoteDocuments(
  preQuoteId: string,
  page: number,
  enabled: boolean,
) {
  const [documentsPage, setDocumentsPage] =
    useState<PreQuoteDocumentsPage | null>(null);
  const [error, setError] = useState<PreQuoteLoadError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const currentPreQuoteIdRef = useRef(preQuoteId);
  const hasDocumentsPageRef = useRef(false);
  const lastPageRef = useRef(page);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);

  useEffect(() => {
    if (!idsMatch(currentPreQuoteIdRef.current, preQuoteId)) {
      hasDocumentsPageRef.current = false;
    }

    currentPreQuoteIdRef.current = preQuoteId;
  }, [preQuoteId]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestedPreQuoteId = preQuoteId;
    const pageChanged = lastPageRef.current !== page;
    lastPageRef.current = page;

    queueMicrotask(() => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(null);

      if (!enabled || !isPreQuoteIdValid) {
        setDocumentsPage(null);
        hasDocumentsPageRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (pageChanged) {
        setDocumentsPage(null);
        hasDocumentsPageRef.current = false;
      }

      if (!hasDocumentsPageRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
    });

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
          hasDocumentsPageRef.current = true;
          setDocumentsPage(response);
        }
      })
      .catch((requestError: unknown) => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(currentPreQuoteIdRef.current, requestedPreQuoteId)
        ) {
          setError({ cause: requestError });
        }
      })
      .finally(() => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(currentPreQuoteIdRef.current, requestedPreQuoteId)
        ) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });
  }, [enabled, isPreQuoteIdValid, page, preQuoteId, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  return {
    documentsPage,
    error,
    isLoading,
    isRefreshing,
    page,
    pageSize: PAGE_SIZE,
    refresh,
  };
}
