"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { getProjectById } from "@/features/projects/projects-api";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import {
  assertPreQuoteBelongsToProject,
  getPreQuoteById,
} from "@/features/prequotes/prequotes-api";
import type {
  PreQuoteDetails,
  PreQuoteLoadError,
} from "@/features/prequotes/prequotes-types";

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function usePreQuoteDetails(projectId: string, preQuoteId: string) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [projectError, setProjectError] = useState<PreQuoteLoadError | null>(
    null,
  );
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectReloadKey, setProjectReloadKey] = useState(0);

  const [preQuote, setPreQuote] = useState<PreQuoteDetails | null>(null);
  const [preQuoteError, setPreQuoteError] =
    useState<PreQuoteLoadError | null>(null);
  const [isPreQuoteLoading, setIsPreQuoteLoading] = useState(false);
  const [preQuoteReloadKey, setPreQuoteReloadKey] = useState(0);

  const projectRequestIdRef = useRef(0);
  const preQuoteRequestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);

  useEffect(() => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;

    queueMicrotask(() => {
      if (requestId !== projectRequestIdRef.current) {
        return;
      }

      setProject(null);
      setProjectError(null);

      if (!isProjectIdValid) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);
    });

    if (!isProjectIdValid) {
      return;
    }

    void getProjectById(projectId)
      .then((response) => {
        if (
          requestId === projectRequestIdRef.current &&
          idsMatch(response.id, projectId)
        ) {
          setProject(response);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === projectRequestIdRef.current) {
          setProject(null);
          setProjectError({ cause: requestError });
        }
      })
      .finally(() => {
        if (requestId === projectRequestIdRef.current) {
          setIsProjectLoading(false);
        }
      });
  }, [isProjectIdValid, projectId, projectReloadKey]);

  useEffect(() => {
    const requestId = preQuoteRequestIdRef.current + 1;
    preQuoteRequestIdRef.current = requestId;

    queueMicrotask(() => {
      if (requestId !== preQuoteRequestIdRef.current) {
        return;
      }

      setPreQuote(null);
      setPreQuoteError(null);

      if (!isProjectIdValid || !isPreQuoteIdValid) {
        setIsPreQuoteLoading(false);
        return;
      }

      setIsPreQuoteLoading(true);
    });

    if (!isProjectIdValid || !isPreQuoteIdValid) {
      return;
    }

    void getPreQuoteById(preQuoteId)
      .then((response) => {
        assertPreQuoteBelongsToProject(response, projectId);

        if (
          requestId === preQuoteRequestIdRef.current &&
          idsMatch(response.id, preQuoteId) &&
          idsMatch(response.projectId, projectId)
        ) {
          setPreQuote(response);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === preQuoteRequestIdRef.current) {
          setPreQuote(null);
          setPreQuoteError({ cause: requestError });
        }
      })
      .finally(() => {
        if (requestId === preQuoteRequestIdRef.current) {
          setIsPreQuoteLoading(false);
        }
      });
  }, [
    isPreQuoteIdValid,
    isProjectIdValid,
    preQuoteId,
    preQuoteReloadKey,
    projectId,
  ]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryPreQuote = useCallback(() => {
    setPreQuoteReloadKey((current) => current + 1);
  }, []);

  return {
    project,
    preQuote,
    projectError,
    preQuoteError,
    isProjectLoading,
    isPreQuoteLoading,
    retryProject,
    retryPreQuote,
    isProjectIdValid,
    isPreQuoteIdValid,
  };
}
