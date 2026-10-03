"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { getProjectWorkspace } from "@/features/projects/project-workspace-api";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import type { ProjectDetails } from "@/features/projects/projects-types";

export interface ProjectWorkspaceLoadError {
  cause: unknown;
}

type ResourceState<T> =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: T; error: null }
  | { key: string; status: "error"; data: null; error: ProjectWorkspaceLoadError };

function idleState<T>(key: string): ResourceState<T> {
  return { key, status: "idle", data: null, error: null };
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useProjectWorkspace(projectId: string) {
  const [reloadKey, setReloadKey] = useState(0);
  const workspaceKey = `${projectId}:${reloadKey}`;
  const [workspaceState, setWorkspaceState] = useState<
    ResourceState<ProjectWorkspace>
  >(() => idleState(workspaceKey));
  const requestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!isProjectIdValid) {
      queueMicrotask(() => {
        if (requestId === requestIdRef.current) {
          setWorkspaceState(idleState(workspaceKey));
        }
      });
      return;
    }

    queueMicrotask(() => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setWorkspaceState({
        key: workspaceKey,
        status: "loading",
        data: null,
        error: null,
      });
    });

    void getProjectWorkspace(projectId)
      .then((response) => {
        if (
          requestId === requestIdRef.current &&
          idsMatch(response.project.id, projectId)
        ) {
          setWorkspaceState({
            key: workspaceKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === requestIdRef.current) {
          setWorkspaceState({
            key: workspaceKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [isProjectIdValid, projectId, workspaceKey]);

  const retryWorkspace = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const applyProjectUpdate = useCallback((updatedProject: ProjectDetails) => {
    setWorkspaceState((current) => {
      if (
        current.status !== "success" ||
        !idsMatch(current.data.project.id, updatedProject.id)
      ) {
        return current;
      }

      return {
        key: current.key,
        status: "success",
        data: {
          ...current.data,
          project: {
            ...current.data.project,
            code: updatedProject.code,
            name: updatedProject.name,
            location: updatedProject.location,
            isActive: updatedProject.isActive,
            updatedAtUtc: updatedProject.updatedAtUtc,
          },
        },
        error: null,
      };
    });
  }, []);

  const workspace =
    workspaceState.key === workspaceKey && workspaceState.status === "success"
      ? workspaceState.data
      : null;
  const workspaceError =
    workspaceState.key === workspaceKey && workspaceState.status === "error"
      ? workspaceState.error
      : null;

  return {
    workspace,
    workspaceError,
    isWorkspaceLoading:
      isProjectIdValid &&
      (workspaceState.key !== workspaceKey ||
        workspaceState.status === "loading"),
    retryWorkspace,
    applyProjectUpdate,
    isProjectIdValid,
  };
}
