"use client";

import { useCallback, useRef, useState } from "react";

import {
  createPreQuoteDraft,
  isValidPreQuoteDraftContractGuid,
} from "@/features/prequotes/prequote-draft-api";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import type {
  CreatePreQuoteDraftError,
  CreatePreQuoteDraftRequest,
  CreatePreQuoteDraftResult,
  PreQuoteDraftDetails,
} from "@/features/prequotes/prequote-draft-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

function isAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftAlreadyExists
  );
}

export function useCreatePreQuoteDraft(preQuoteId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<PreQuoteDraftDetails | null>(null);
  const [error, setError] = useState<CreatePreQuoteDraftError | null>(null);
  const requestIdRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const createDraft = useCallback(
    async (
      request: CreatePreQuoteDraftRequest,
    ): Promise<CreatePreQuoteDraftResult> => {
      if (
        isSubmittingRef.current ||
        !isValidPreQuoteId(preQuoteId) ||
        !isValidPreQuoteDraftContractGuid(request.sourceDocumentId) ||
        !isValidPreQuoteDraftContractGuid(request.sourceStructuredExtractionId)
      ) {
        return { status: "ignored" };
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const createdDraft = await createPreQuoteDraft(preQuoteId, request);

        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }

        setDraft(createdDraft);
        return { status: "created", draft: createdDraft };
      } catch (requestError: unknown) {
        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }

        if (isAlreadyExistsError(requestError)) {
          setError({ cause: requestError });
          return { status: "already-exists" };
        }

        setError({ cause: requestError });
        return { status: "failed" };
      } finally {
        if (requestId === requestIdRef.current) {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      }
    },
    [preQuoteId],
  );

  const reset = useCallback(() => {
    setDraft(null);
    setError(null);
  }, []);

  return {
    createDraft,
    draft,
    error,
    isSubmitting,
    reset,
  };
}
