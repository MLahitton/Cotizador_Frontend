"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isValidProjectId } from "@/features/projects/project-identifiers";
import { getProjectWorkspace } from "@/features/projects/project-workspace-api";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { getAccessToken } from "@/features/auth/auth-storage";
import { createExtractionRefresh, mergeWorkflowRefresh } from "./workspace-extraction-refresh";

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

export function useProjectWorkspace(projectId: string, sessionKey = "legacy") {
  const [reloadKey, setReloadKey] = useState(0);
  const workspaceKey = `${projectId}:${sessionKey}:${reloadKey}`;
  const [refreshNotice, setRefreshNotice] = useState<{ key: string; message: string } | null>(null);
  const [consulting, setConsulting] = useState<{ key: string; request: symbol } | null>(null);
  const refreshRef = useRef<ReturnType<typeof createExtractionRefresh> | null>(null);
  const [workspaceState, setWorkspaceState] = useState<
    ResourceState<ProjectWorkspace>
  >(() => idleState(workspaceKey));
  const requestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);

  useEffect(() => {
    const controller = new AbortController();
    const token = getAccessToken();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!isProjectIdValid || !sessionKey) {
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

    void getProjectWorkspace(projectId, controller.signal)
      .then((response) => {
        if (
          requestId === requestIdRef.current &&
          !controller.signal.aborted && getAccessToken() === token &&
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
        if (requestId === requestIdRef.current && !controller.signal.aborted && getAccessToken() === token) {
          setWorkspaceState({
            key: workspaceKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
    return () => { controller.abort(); requestIdRef.current++; };
  }, [isProjectIdValid, projectId, workspaceKey, sessionKey]);

  const loaded = workspaceState.key === workspaceKey && workspaceState.status === "success" ? workspaceState.data : null;
  const version = loaded?.workflow.requirementId;
  const currentToken = getAccessToken();
  const loadedRef = useRef(loaded);
  useEffect(() => { loadedRef.current = loaded; }, [loaded]);
  useEffect(() => {
    if (!version || !sessionKey) return;
    const token = currentToken;
    const requestId = requestIdRef.current;
    const cycle = createExtractionRefresh({
      initialRefresh: loadedRef.current?.workflow.extraction?.refreshRecommended === true,
      read: (signal) => getProjectWorkspace(projectId, signal),
      current: () => requestId === requestIdRef.current && getAccessToken() === token,
      apply: (response) => setWorkspaceState((current) => {
        if (current.key !== workspaceKey || current.status !== "success" || current.data.workflow.requirementId !== version) return current;
        // Keep project edits and proposal/card state; only the server workflow is refreshed.
        return { ...current, data: mergeWorkflowRefresh(current.data, response) };
      }),
      notice: (message) => setRefreshNotice(message ? { key: `${workspaceKey}:${version}`, message } : null),
      busy: (request, value) => setConsulting((current) => value
        ? { key: `${workspaceKey}:${version}`, request }
        : current?.request === request ? null : current),
      schedule: (callback, delay) => { const timer = window.setTimeout(callback, delay); return () => window.clearTimeout(timer); },
    });
    refreshRef.current = cycle;
    return () => { cycle(); if (refreshRef.current === cycle) refreshRef.current = null; };
  }, [projectId, workspaceKey, version, sessionKey, currentToken]);

  const consultWorkspace = useCallback(() => { void refreshRef.current?.consult(); }, []);

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
    consultWorkspace,
    isConsulting: consulting?.key === `${workspaceKey}:${version}`,
    refreshNotice: refreshNotice?.key === `${workspaceKey}:${version}` ? refreshNotice.message : null,
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
