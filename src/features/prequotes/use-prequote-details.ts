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

type ResourceState<T> =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: T; error: null }
  | { key: string; status: "error"; data: null; error: PreQuoteLoadError };

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function idleState<T>(key: string): ResourceState<T> {
  return { key, status: "idle", data: null, error: null };
}

export function usePreQuoteDetails(projectId: string, preQuoteId: string) {
  const [projectState, setProjectState] = useState<ResourceState<ProjectDetails>>(
    () => idleState(projectId),
  );
  const [projectReloadKey, setProjectReloadKey] = useState(0);

  const [preQuoteReloadKey, setPreQuoteReloadKey] = useState(0);
  const projectKey = `${projectId}:${projectReloadKey}`;
  const preQuoteKey = `${projectId}:${preQuoteId}:${preQuoteReloadKey}`;
  const [preQuoteState, setPreQuoteState] = useState<
    ResourceState<PreQuoteDetails>
  >(() => idleState(preQuoteKey));

  const projectRequestIdRef = useRef(0);
  const preQuoteRequestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);

  useEffect(() => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;

    if (!isProjectIdValid) {
      return;
    }

    void getProjectById(projectId)
      .then((response) => {
        if (
          requestId === projectRequestIdRef.current &&
          idsMatch(response.id, projectId)
        ) {
          setProjectState({
            key: projectKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === projectRequestIdRef.current) {
          setProjectState({
            key: projectKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [isProjectIdValid, projectId, projectKey]);

  useEffect(() => {
    const requestId = preQuoteRequestIdRef.current + 1;
    preQuoteRequestIdRef.current = requestId;

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
          setPreQuoteState({
            key: preQuoteKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === preQuoteRequestIdRef.current) {
          setPreQuoteState({
            key: preQuoteKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [
    isPreQuoteIdValid,
    isProjectIdValid,
    preQuoteId,
    preQuoteKey,
    projectId,
  ]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryPreQuote = useCallback(() => {
    setPreQuoteReloadKey((current) => current + 1);
  }, []);

  const renderableProject =
    projectState.key === projectKey && projectState.status === "success"
      ? projectState.data
      : null;
  const renderableProjectError =
    projectState.key === projectKey && projectState.status === "error"
      ? projectState.error
      : null;
  const renderablePreQuote =
    preQuoteState.key === preQuoteKey && preQuoteState.status === "success"
      ? preQuoteState.data
      : null;
  const renderablePreQuoteError =
    preQuoteState.key === preQuoteKey && preQuoteState.status === "error"
      ? preQuoteState.error
      : null;

  return {
    project: renderableProject,
    preQuote: renderablePreQuote,
    projectError: renderableProjectError,
    preQuoteError: renderablePreQuoteError,
    isProjectLoading:
      isProjectIdValid &&
      (projectState.key !== projectKey || projectState.status === "loading"),
    isPreQuoteLoading:
      isProjectIdValid &&
      isPreQuoteIdValid &&
      (preQuoteState.key !== preQuoteKey || preQuoteState.status === "loading"),
    retryProject,
    retryPreQuote,
    isProjectIdValid,
    isPreQuoteIdValid,
  };
}
