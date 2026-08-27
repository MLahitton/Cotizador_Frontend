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
import { getStructuredDocumentExtraction } from "@/features/prequotes/structured-extraction-api";
import type { StructuredDocumentExtractionDetailsResponse } from "@/features/prequotes/structured-extraction-types";

type ResourceState<T> =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "success"; data: T; error: null }
  | { key: string; status: "error"; data: null; error: PreQuoteLoadError };

function idleState<T>(key: string): ResourceState<T> {
  return { key, status: "idle", data: null, error: null };
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useStructuredExtractionDetails(
  projectId: string,
  preQuoteId: string,
  documentId: string,
) {
  const [projectReloadKey, setProjectReloadKey] = useState(0);
  const [preQuoteReloadKey, setPreQuoteReloadKey] = useState(0);
  const [extractionReloadKey, setExtractionReloadKey] = useState(0);

  const projectKey = `${projectId}:${projectReloadKey}`;
  const preQuoteKey = `${projectId}:${preQuoteId}:${preQuoteReloadKey}`;
  const extractionKey = `${preQuoteId}:${documentId}:${extractionReloadKey}`;

  const [projectState, setProjectState] = useState<ResourceState<ProjectDetails>>(
    () => idleState(projectKey),
  );
  const [preQuoteState, setPreQuoteState] = useState<
    ResourceState<PreQuoteDetails>
  >(() => idleState(preQuoteKey));
  const [extractionState, setExtractionState] = useState<
    ResourceState<StructuredDocumentExtractionDetailsResponse>
  >(() => idleState(extractionKey));

  const projectRequestIdRef = useRef(0);
  const preQuoteRequestIdRef = useRef(0);
  const extractionRequestIdRef = useRef(0);

  const isProjectIdValid = isValidProjectId(projectId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);
  const isDocumentIdValid = isValidPreQuoteId(documentId);

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

  useEffect(() => {
    const requestId = extractionRequestIdRef.current + 1;
    extractionRequestIdRef.current = requestId;

    if (!isPreQuoteIdValid || !isDocumentIdValid) {
      return;
    }

    void getStructuredDocumentExtraction(documentId, preQuoteId)
      .then((response) => {
        if (
          requestId === extractionRequestIdRef.current &&
          idsMatch(response.document.documentId, documentId) &&
          idsMatch(response.document.preQuoteId, preQuoteId)
        ) {
          setExtractionState({
            key: extractionKey,
            status: "success",
            data: response,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === extractionRequestIdRef.current) {
          setExtractionState({
            key: extractionKey,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [
    documentId,
    extractionKey,
    isDocumentIdValid,
    isPreQuoteIdValid,
    preQuoteId,
  ]);

  const retryProject = useCallback(() => {
    setProjectReloadKey((current) => current + 1);
  }, []);

  const retryPreQuote = useCallback(() => {
    setPreQuoteReloadKey((current) => current + 1);
  }, []);

  const retryExtraction = useCallback(() => {
    setExtractionReloadKey((current) => current + 1);
  }, []);

  const project =
    projectState.key === projectKey && projectState.status === "success"
      ? projectState.data
      : null;
  const projectError =
    projectState.key === projectKey && projectState.status === "error"
      ? projectState.error
      : null;
  const preQuote =
    preQuoteState.key === preQuoteKey && preQuoteState.status === "success"
      ? preQuoteState.data
      : null;
  const preQuoteError =
    preQuoteState.key === preQuoteKey && preQuoteState.status === "error"
      ? preQuoteState.error
      : null;
  const extraction =
    extractionState.key === extractionKey && extractionState.status === "success"
      ? extractionState.data
      : null;
  const extractionError =
    extractionState.key === extractionKey && extractionState.status === "error"
      ? extractionState.error
      : null;

  return {
    project,
    preQuote,
    extraction,
    projectError,
    preQuoteError,
    extractionError,
    isProjectLoading:
      isProjectIdValid &&
      (projectState.key !== projectKey || projectState.status === "idle"),
    isPreQuoteLoading:
      isProjectIdValid &&
      isPreQuoteIdValid &&
      (preQuoteState.key !== preQuoteKey || preQuoteState.status === "idle"),
    isExtractionLoading:
      isPreQuoteIdValid &&
      isDocumentIdValid &&
      (extractionState.key !== extractionKey ||
        extractionState.status === "idle"),
    retryProject,
    retryPreQuote,
    retryExtraction,
    isProjectIdValid,
    isPreQuoteIdValid,
    isDocumentIdValid,
  };
}
