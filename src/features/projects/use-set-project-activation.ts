"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { setProjectActivation } from "@/features/projects/projects-api";
import type { ProjectDetails } from "@/features/projects/projects-types";

export interface ProjectActivationError {
  cause: unknown;
}

export type ProjectActivationResult =
  | { status: "updated"; project: ProjectDetails }
  | { status: "unchanged" }
  | { status: "failed" }
  | { status: "stale" };

export interface UseSetProjectActivationResult {
  setActivation: (
    project: ProjectDetails,
    isActive: boolean,
  ) => Promise<ProjectActivationResult>;
  isSubmitting: boolean;
  error: ProjectActivationError | null;
  successMessage: string | null;
  reset: () => void;
}

export function useSetProjectActivation(
  projectId: string,
): UseSetProjectActivationResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProjectActivationError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const requestIdRef = useRef(0);
  const currentProjectIdRef = useRef(projectId);

  const reset = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    currentProjectIdRef.current = projectId;
    requestIdRef.current += 1;
    isSubmittingRef.current = false;

    queueMicrotask(() => {
      if (currentProjectIdRef.current !== projectId) {
        return;
      }

      setIsSubmitting(false);
      setError(null);
      setSuccessMessage(null);
    });
  }, [projectId]);

  const setActivation = useCallback(
    async (project: ProjectDetails, isActive: boolean) => {
      if (
        isSubmittingRef.current ||
        !isValidProjectId(projectId) ||
        project.id !== projectId ||
        project.isActive === isActive
      ) {
        return { status: "unchanged" } satisfies ProjectActivationResult;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const requestedProjectId = projectId;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const updatedProject = await setProjectActivation(requestedProjectId, {
          isActive,
        });

        if (
          requestId !== requestIdRef.current ||
          currentProjectIdRef.current !== requestedProjectId
        ) {
          return { status: "stale" } satisfies ProjectActivationResult;
        }

        setSuccessMessage(
          isActive
            ? "Proyecto activado correctamente."
            : "Proyecto desactivado correctamente.",
        );

        return {
          status: "updated",
          project: updatedProject,
        } satisfies ProjectActivationResult;
      } catch (requestError: unknown) {
        if (
          requestId !== requestIdRef.current ||
          currentProjectIdRef.current !== requestedProjectId
        ) {
          return { status: "stale" } satisfies ProjectActivationResult;
        }

        setError({ cause: requestError });
        return { status: "failed" } satisfies ProjectActivationResult;
      } finally {
        if (
          requestId === requestIdRef.current &&
          currentProjectIdRef.current === requestedProjectId
        ) {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      }
    },
    [projectId],
  );

  return {
    setActivation,
    isSubmitting,
    error,
    successMessage,
    reset,
  };
}
