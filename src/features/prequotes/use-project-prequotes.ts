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

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useProjectPreQuotes(projectId: string, page: number) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [projectError, setProjectError] = useState<PreQuoteLoadError | null>(
    null,
  );
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectReloadKey, setProjectReloadKey] = useState(0);

  const [preQuotesPage, setPreQuotesPage] =
    useState<ProjectPreQuotesPage | null>(null);
  const [preQuotesError, setPreQuotesError] =
    useState<PreQuoteLoadError | null>(null);
  const [isPreQuotesLoading, setIsPreQuotesLoading] = useState(false);
  const [isPreQuotesRefreshing, setIsPreQuotesRefreshing] = useState(false);
  const [preQuotesReloadKey, setPreQuotesReloadKey] = useState(0);

  const projectRequestIdRef = useRef(0);
  const preQuotesRequestIdRef = useRef(0);
  const hasPreQuotesPageRef = useRef(false);
  const isProjectIdValid = isValidProjectId(projectId);

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
    const requestId = preQuotesRequestIdRef.current + 1;
    preQuotesRequestIdRef.current = requestId;

    queueMicrotask(() => {
      if (requestId !== preQuotesRequestIdRef.current) {
        return;
      }

        setPreQuotesError(null);

        if (!isProjectIdValid) {
          setPreQuotesPage(null);
          hasPreQuotesPageRef.current = false;
          setIsPreQuotesLoading(false);
          setIsPreQuotesRefreshing(false);
          return;
        }

      if (!hasPreQuotesPageRef.current) {
        setIsPreQuotesLoading(true);
      } else {
        setIsPreQuotesRefreshing(true);
      }
    });

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
          hasPreQuotesPageRef.current = true;
          setPreQuotesPage(response);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === preQuotesRequestIdRef.current) {
          setPreQuotesError({ cause: requestError });
        }
      })
      .finally(() => {
        if (requestId === preQuotesRequestIdRef.current) {
          setIsPreQuotesLoading(false);
          setIsPreQuotesRefreshing(false);
        }
      });
  }, [isProjectIdValid, page, preQuotesReloadKey, projectId]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryPreQuotes = useCallback(() => {
    setPreQuotesReloadKey((current) => current + 1);
  }, []);

  return {
    project,
    projectError,
    isProjectLoading,
    retryProject,
    preQuotesPage,
    preQuotesError,
    isPreQuotesLoading,
    isPreQuotesRefreshing,
    retryPreQuotes,
    page,
    pageSize: PAGE_SIZE,
    isProjectIdValid,
  };
}
