"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getPreQuoteDraft } from "@/features/prequotes/prequote-draft-api";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import type {
  PreQuoteDraftDetails,
  PreQuoteDraftLoadError,
} from "@/features/prequotes/prequote-draft-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

type DraftState =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: PreQuoteDraftDetails; error: null }
  | { key: string; status: "not-found"; data: null; error: null }
  | { key: string; status: "error"; data: null; error: PreQuoteDraftLoadError };

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isDraftNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 ||
      getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftNotFound)
  );
}

export function usePreQuoteDraft(preQuoteId: string, enabled = true) {
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);
  const key = `${preQuoteId}:${reloadKey}:${enabled ? "enabled" : "disabled"}`;
  const [state, setState] = useState<DraftState>({
    key,
    status: enabled ? "loading" : "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!enabled || !isPreQuoteIdValid) {
      return;
    }

    void getPreQuoteDraft(preQuoteId)
      .then((draft) => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(draft.preQuoteId, preQuoteId)
        ) {
          setState({ key, status: "success", data: draft, error: null });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (isDraftNotFoundError(requestError)) {
          setState({ key, status: "not-found", data: null, error: null });
          return;
        }

        setState({
          key,
          status: "error",
          data: null,
          error: { cause: requestError },
        });
      });
  }, [enabled, isPreQuoteIdValid, key, preQuoteId]);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const renderableState =
    state.key === key
      ? state
      : {
          key,
          status:
            enabled && isPreQuoteIdValid
              ? ("loading" as const)
              : ("idle" as const),
          data: null,
          error: null,
        };

  return {
    draft: renderableState.status === "success" ? renderableState.data : null,
    error: renderableState.status === "error" ? renderableState.error : null,
    isLoading: renderableState.status === "loading",
    isNotFound: renderableState.status === "not-found",
    retry,
  };
}
