"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { createProjectPreQuote } from "@/features/prequotes/prequotes-api";
import type {
  CreatePreQuoteError,
  CreatePreQuoteResult,
} from "@/features/prequotes/prequotes-types";

export interface UseCreatePreQuoteResult {
  create: () => Promise<CreatePreQuoteResult>;
  isSubmitting: boolean;
  error: CreatePreQuoteError | null;
  reset: () => void;
}

type CreatePreQuoteMutationState =
  | { key: string; status: "idle"; error: null }
  | { key: string; status: "submitting"; error: null }
  | { key: string; status: "error"; error: CreatePreQuoteError };

export function useCreatePreQuote(
  projectId: string,
): UseCreatePreQuoteResult {
  const [mutationState, setMutationState] =
    useState<CreatePreQuoteMutationState>({
      key: projectId,
      status: "idle",
      error: null,
    });
  const isSubmittingRef = useRef(false);
  const requestIdRef = useRef(0);
  const currentProjectIdRef = useRef(projectId);

  const reset = useCallback(() => {
    setMutationState({
      key: currentProjectIdRef.current,
      status: "idle",
      error: null,
    });
  }, []);

  useEffect(() => {
    currentProjectIdRef.current = projectId;
    requestIdRef.current += 1;
    isSubmittingRef.current = false;
  }, [projectId]);

  const create = useCallback(async () => {
    if (isSubmittingRef.current || !isValidProjectId(projectId)) {
      return { status: "ignored" } satisfies CreatePreQuoteResult;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestedProjectId = projectId;

    isSubmittingRef.current = true;
    setMutationState({
      key: requestedProjectId,
      status: "submitting",
      error: null,
    });

    try {
      const preQuote = await createProjectPreQuote(requestedProjectId);

      if (
        requestId !== requestIdRef.current ||
        currentProjectIdRef.current !== requestedProjectId
      ) {
        return { status: "stale" } satisfies CreatePreQuoteResult;
      }

      return {
        status: "created",
        preQuote,
      } satisfies CreatePreQuoteResult;
    } catch (requestError: unknown) {
      if (
        requestId !== requestIdRef.current ||
        currentProjectIdRef.current !== requestedProjectId
      ) {
        return { status: "stale" } satisfies CreatePreQuoteResult;
      }

      setMutationState({
        key: requestedProjectId,
        status: "error",
        error: { cause: requestError },
      });
      return { status: "failed" } satisfies CreatePreQuoteResult;
    } finally {
      if (
        requestId === requestIdRef.current &&
        currentProjectIdRef.current === requestedProjectId
      ) {
        isSubmittingRef.current = false;
        setMutationState((current) =>
          current.key === requestedProjectId &&
          current.status === "submitting"
            ? {
                key: requestedProjectId,
                status: "idle",
                error: null,
              }
            : current,
        );
      }
    }
  }, [projectId]);

  const isCurrentMutation = mutationState.key === projectId;

  return {
    create,
    isSubmitting:
      isCurrentMutation && mutationState.status === "submitting",
    error:
      isCurrentMutation && mutationState.status === "error"
        ? mutationState.error
        : null,
    reset,
  };
}
