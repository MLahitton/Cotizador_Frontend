"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getClientById } from "@/features/clients/clients-api";
import type { ClientDetails } from "@/features/clients/clients-types";
import { isValidProjectId } from "@/features/projects/project-identifiers";
import { getProjectById } from "@/features/projects/projects-api";
import type { ProjectDetails } from "@/features/projects/projects-types";

export interface ProjectDetailsLoadError {
  cause: unknown;
}

type ResourceState<T> =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: T; error: null }
  | { key: string; status: "error"; data: null; error: ProjectDetailsLoadError };

function idleState<T>(key: string): ResourceState<T> {
  return { key, status: "idle", data: null, error: null };
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useProjectDetails(projectId: string) {
  const [projectState, setProjectState] = useState<ResourceState<ProjectDetails>>(
    () => idleState(projectId),
  );
  const [projectReloadKey, setProjectReloadKey] = useState(0);
  const projectKey = `${projectId}:${projectReloadKey}`;

  const [clientState, setClientState] = useState<ResourceState<ClientDetails>>(
    () => idleState(""),
  );

  const projectRequestIdRef = useRef(0);
  const clientRequestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);

  const loadClient = useCallback((clientId: string) => {
    const requestId = clientRequestIdRef.current + 1;
    clientRequestIdRef.current = requestId;
    setClientState({
      key: clientId,
      status: "loading",
      data: null,
      error: null,
    });

    void getClientById(clientId)
      .then((response) => {
        if (
          requestId === clientRequestIdRef.current &&
          idsMatch(response.id, clientId)
        ) {
          setClientState({
            key: clientId,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === clientRequestIdRef.current) {
          setClientState({
            key: clientId,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, []);

  useEffect(() => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;
    clientRequestIdRef.current += 1;

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
          loadClient(response.clientId);
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
  }, [isProjectIdValid, loadClient, projectId, projectKey]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const renderableProject =
    projectState.key === projectKey && projectState.status === "success"
      ? projectState.data
      : null;
  const renderableProjectError =
    projectState.key === projectKey && projectState.status === "error"
      ? projectState.error
      : null;
  const currentClientId = renderableProject?.clientId ?? "";
  const renderableClient =
    clientState.key === currentClientId && clientState.status === "success"
      ? clientState.data
      : null;
  const renderableClientError =
    clientState.key === currentClientId && clientState.status === "error"
      ? clientState.error
      : null;

  const retryClient = useCallback(() => {
    if (renderableProject) {
      loadClient(renderableProject.clientId);
    }
  }, [loadClient, renderableProject]);

  const applyProjectUpdate = useCallback((updatedProject: ProjectDetails) => {
    setProjectState((currentProjectState) => {
      if (
        currentProjectState.status !== "success" ||
        !idsMatch(currentProjectState.data.id, updatedProject.id)
      ) {
        return currentProjectState;
      }

      return {
        key: currentProjectState.key,
        status: "success",
        data: updatedProject,
        error: null,
      };
    });
  }, []);

  return {
    project: renderableProject,
    projectError: renderableProjectError,
    isProjectLoading:
      isProjectIdValid &&
      (projectState.key !== projectKey || projectState.status === "loading"),
    retryProject,
    applyProjectUpdate,
    client: renderableClient,
    clientError: renderableClientError,
    isClientLoading:
      Boolean(currentClientId) &&
      (clientState.key !== currentClientId || clientState.status === "loading"),
    retryClient,
    isProjectIdValid,
  };
}
