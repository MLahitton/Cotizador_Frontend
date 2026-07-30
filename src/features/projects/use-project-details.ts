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

export function useProjectDetails(projectId: string) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [projectError, setProjectError] =
    useState<ProjectDetailsLoadError | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectReloadKey, setProjectReloadKey] = useState(0);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [clientError, setClientError] =
    useState<ProjectDetailsLoadError | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(false);

  const projectRequestIdRef = useRef(0);
  const clientRequestIdRef = useRef(0);
  const isProjectIdValid = isValidProjectId(projectId);

  const loadClient = useCallback((clientId: string) => {
    const requestId = clientRequestIdRef.current + 1;
    clientRequestIdRef.current = requestId;
    setClient(null);
    setClientError(null);
    setIsClientLoading(true);

    void getClientById(clientId)
      .then((response) => {
        if (requestId === clientRequestIdRef.current) {
          setClient(response);
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === clientRequestIdRef.current) {
          setClient(null);
          setClientError({ cause: requestError });
        }
      })
      .finally(() => {
        if (requestId === clientRequestIdRef.current) {
          setIsClientLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;
    clientRequestIdRef.current += 1;

    queueMicrotask(() => {
      if (requestId !== projectRequestIdRef.current) {
        return;
      }

      setProject(null);
      setProjectError(null);
      setClient(null);
      setClientError(null);
      setIsClientLoading(false);

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
        if (requestId === projectRequestIdRef.current) {
          setProject(response);
          loadClient(response.clientId);
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
  }, [isProjectIdValid, loadClient, projectId, projectReloadKey]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryClient = useCallback(() => {
    if (project) {
      loadClient(project.clientId);
    }
  }, [loadClient, project]);

  const applyProjectUpdate = useCallback((updatedProject: ProjectDetails) => {
    setProject((currentProject) => {
      if (!currentProject || currentProject.id !== updatedProject.id) {
        return currentProject;
      }

      return updatedProject;
    });
  }, []);

  return {
    project,
    projectError,
    isProjectLoading,
    retryProject,
    applyProjectUpdate,
    client,
    clientError,
    isClientLoading,
    retryClient,
    isProjectIdValid,
  };
}
