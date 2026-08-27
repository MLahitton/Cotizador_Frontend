"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { getProjectById } from "@/features/projects/projects-api";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { getProjectPreQuotes } from "@/features/prequotes/prequotes-api";
import type {
  PreQuoteLoadError,
  ProjectPreQuotesPage,
} from "@/features/prequotes/prequotes-types";

const PAGE_SIZE = 20;

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

export function useProjectPreQuotes(projectId: string, page: number) {
  const [projectState, setProjectState] = useState<ResourceState<ProjectDetails>>(
    () => idleState(projectId),
  );
  const [projectReloadKey, setProjectReloadKey] = useState(0);

  const [preQuotesReloadKey, setPreQuotesReloadKey] = useState(0);
  const projectKey = `${projectId}:${projectReloadKey}`;
  const preQuotesKey = `${projectId}:${page}:${preQuotesReloadKey}`;
  const [preQuotesState, setPreQuotesState] = useState<
    ResourceState<ProjectPreQuotesPage>
  >(() => idleState(preQuotesKey));

  const projectRequestIdRef = useRef(0);
  const preQuotesRequestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);

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
    const requestId = preQuotesRequestIdRef.current + 1;
    preQuotesRequestIdRef.current = requestId;

    if (!isProjectIdValid) {
      return;
    }

    void getProjectPreQuotes({
      projectId,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((response) => {
        if (requestId === preQuotesRequestIdRef.current) {
          setPreQuotesState({
            key: preQuotesKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === preQuotesRequestIdRef.current) {
          setPreQuotesState({
            key: preQuotesKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [isProjectIdValid, page, preQuotesKey, projectId]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryPreQuotes = useCallback(() => {
    setPreQuotesReloadKey((current) => current + 1);
  }, []);

  const renderableProject =
    projectState.key === projectKey && projectState.status === "success"
      ? projectState.data
      : null;
  const renderableProjectError =
    projectState.key === projectKey && projectState.status === "error"
      ? projectState.error
      : null;
  const renderablePreQuotesPage =
    preQuotesState.key === preQuotesKey && preQuotesState.status === "success"
      ? preQuotesState.data
      : null;
  const renderablePreQuotesError =
    preQuotesState.key === preQuotesKey && preQuotesState.status === "error"
      ? preQuotesState.error
      : null;

  return {
    project: renderableProject,
    projectError: renderableProjectError,
    isProjectLoading:
      isProjectIdValid &&
      (projectState.key !== projectKey || projectState.status === "loading"),
    retryProject,
    preQuotesPage: renderablePreQuotesPage,
    preQuotesError: renderablePreQuotesError,
    isPreQuotesLoading:
      isProjectIdValid &&
      (preQuotesState.key !== preQuotesKey ||
        preQuotesState.status === "loading"),
    isPreQuotesRefreshing: false,
    retryPreQuotes,
    page,
    pageSize: PAGE_SIZE,
    isProjectIdValid,
  };
}
