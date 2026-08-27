"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { startPreQuoteDocumentProcessing } from "@/features/prequotes/prequote-documents-api";
import type { StartedDocumentProcessingAttempt } from "@/features/prequotes/prequote-documents-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";

type StartProcessingStatus = "idle" | "submitting";

type StartProcessingState =
  | {
      key: string;
      documentId: string | null;
      status: "idle";
      error: null;
    }
  | {
      key: string;
      documentId: string;
      status: "submitting";
      error: null;
    }
  | {
      key: string;
      documentId: string;
      status: "idle";
      error: { cause: unknown };
    };

export type StartDocumentProcessingResult =
  | { status: "started"; attempt: StartedDocumentProcessingAttempt }
  | { status: "failed" }
  | { status: "stale" }
  | { status: "ignored" };

function createIdleState(preQuoteId: string): StartProcessingState {
  return {
    key: preQuoteId,
    documentId: null,
    status: "idle",
    error: null,
  };
}

export function useStartDocumentProcessing(preQuoteId: string) {
  const [state, setState] = useState<StartProcessingState>(() =>
    createIdleState(preQuoteId),
  );
  const requestIdRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const currentPreQuoteIdRef = useRef(preQuoteId);
  const currentDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentPreQuoteIdRef.current = preQuoteId;
    currentDocumentIdRef.current = null;
    requestIdRef.current += 1;
    isSubmittingRef.current = false;
  }, [preQuoteId]);

  const currentState = useMemo(
    () => (state.key === preQuoteId ? state : createIdleState(preQuoteId)),
    [preQuoteId, state],
  );

  const reset = useCallback(
    (documentId?: string) => {
      if (isSubmittingRef.current) {
        return;
      }

      currentDocumentIdRef.current = documentId ?? null;
      requestIdRef.current += 1;
      setState({
        key: preQuoteId,
        documentId: documentId ?? null,
        status: "idle",
        error: null,
      });
    },
    [preQuoteId],
  );

  const start = useCallback(
    async (documentId: string): Promise<StartDocumentProcessingResult> => {
      if (
        isSubmittingRef.current ||
        !isValidPreQuoteId(preQuoteId) ||
        !isValidPreQuoteId(documentId)
      ) {
        return { status: "ignored" };
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      isSubmittingRef.current = true;
      currentDocumentIdRef.current = documentId;
      setState({
        key: preQuoteId,
        documentId,
        status: "submitting",
        error: null,
      });

      try {
        const attempt = await startPreQuoteDocumentProcessing(documentId);

        if (
          requestIdRef.current !== requestId ||
          currentPreQuoteIdRef.current !== preQuoteId ||
          currentDocumentIdRef.current !== documentId
        ) {
          return { status: "stale" };
        }

        setState({
          key: preQuoteId,
          documentId: null,
          status: "idle",
          error: null,
        });

        return { status: "started", attempt };
      } catch (error) {
        if (
          requestIdRef.current !== requestId ||
          currentPreQuoteIdRef.current !== preQuoteId ||
          currentDocumentIdRef.current !== documentId
        ) {
          return { status: "stale" };
        }

        setState({
          key: preQuoteId,
          documentId,
          status: "idle",
          error: { cause: error },
        });

        return { status: "failed" };
      } finally {
        if (
          requestIdRef.current === requestId &&
          currentPreQuoteIdRef.current === preQuoteId &&
          currentDocumentIdRef.current === documentId
        ) {
          isSubmittingRef.current = false;
        }
      }
    },
    [preQuoteId],
  );

  const status: StartProcessingStatus =
    currentState.status === "submitting" ? "submitting" : "idle";

  return {
    targetDocumentId: currentState.documentId,
    isSubmitting: status === "submitting",
    error: currentState.error,
    start,
    reset,
  };
}
