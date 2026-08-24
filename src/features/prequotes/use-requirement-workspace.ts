"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSupportedDocumentFormat,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/features/prequotes/prequote-document-formatters";
import { createRequirement, getCurrentRequirement, processRequirement } from "@/features/prequotes/requirement-api";
import { getRequirementPricing } from "@/features/prequotes/requirement-pricing-api";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { CreatedRequirement, CurrentRequirement, ProcessedRequirement } from "@/features/prequotes/requirement-types";
import { getTechnicalProposal } from "@/features/prequotes/technical-proposal-api";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";
import { ApiError } from "@/lib/http/api-error";

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;
const PROCESSING_POLL_INTERVAL_MS = 7000;
const PROCESSING_POLL_LIMIT_MS = 15 * 60 * 1000;

export type RequirementWorkspacePhase =
  | "hydrating" | "idle" | "uploading" | "ready" | "processing" | "completing"
  | "proposal-loading" | "complete" | "upload-error" | "process-error" | "proposal-error" | "current-error"
  | "processing-timeout";

type WorkspaceRequirement = CreatedRequirement | CurrentRequirement;

function validateFiles(files: File[]): string | null {
  if (files.length === 0) return null;
  if (files.length > MAX_FILES) return "Puedes adjuntar maximo 10 archivos por requerimiento.";
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE_BYTES) {
    return "El tamano total de los archivos no puede superar 100 MiB.";
  }
  for (const file of files) {
    if (!getSupportedDocumentFormat(file.name, file.type)) {
      return `${file.name} no es un archivo PDF, XLSX, JPG o PNG compatible.`;
    }
    if (file.size === 0) return `${file.name} esta vacio.`;
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) return `${file.name} supera el limite de 20 MiB.`;
  }
  return null;
}

function identity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function isRequirementProcessing(value: WorkspaceRequirement): boolean {
  return value.status === "PROCESSING" ||
    ("latestAttemptState" in value && value.latestAttemptState === "Processing");
}

function isRequirementFailed(value: WorkspaceRequirement): boolean {
  return value.status === "FAILED" ||
    ("latestAttemptOutcome" in value && value.latestAttemptOutcome === "Failed");
}

function getProblemCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const value = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function processingFailureError(current: CurrentRequirement): ApiError {
  const code = current.latestAttemptErrorCode ?? "REQUIREMENT_PROCESSING_FAILED";
  return new ApiError({
    status: 0,
    title: "Analisis no completado",
    detail: "El analisis del requerimiento no pudo completarse.",
    problemDetails: { errorCode: code, code },
  });
}

function processingResultError(response: ProcessedRequirement): ApiError {
  const code = response.errorCode ?? "REQUIREMENT_PROCESSING_FAILED";
  return new ApiError({
    status: 0,
    title: "Analisis no completado",
    detail: "El analisis del requerimiento no pudo completarse.",
    problemDetails: { errorCode: code, code },
  });
}

function processingTimeoutError(): ApiError {
  return new ApiError({
    status: 0,
    title: "Analisis en curso",
    detail: "El analisis esta tardando mas de lo esperado. Puedes volver a consultar el estado mas adelante.",
    problemDetails: { errorCode: "REQUIREMENT_PROCESSING_POLL_TIMEOUT" },
  });
}

export function useRequirementWorkspace(preQuoteId: string) {
  const [files, setFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RequirementWorkspacePhase>("hydrating");
  const [requirement, setRequirement] = useState<WorkspaceRequirement | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessedRequirement | null>(null);
  const [proposal, setProposal] = useState<TechnicalProposal | null>(null);
  const [pricing, setPricing] = useState<RequirementPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<unknown | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [currentReloadKey, setCurrentReloadKey] = useState(0);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const pricingBusyRef = useRef(false);
  const preQuoteIdRef = useRef(preQuoteId);
  const workspaceTokenRef = useRef(0);
  const proposalRequestRef = useRef(0);
  const pricingRequestRef = useRef(0);
  const processingPollRef = useRef<{ requirementId: string; startedAt: number } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadProposal = useCallback(async (
    requirementId: string,
    options?: { preQuoteId?: string; token?: number },
  ) => {
    const requestId = proposalRequestRef.current + 1;
    proposalRequestRef.current = requestId;
    const expectedPreQuoteId = options?.preQuoteId ?? preQuoteIdRef.current;
    const expectedToken = options?.token ?? workspaceTokenRef.current;
    setPhase("proposal-loading");
    try {
      const response = await getTechnicalProposal(requirementId);
      if (
        !mountedRef.current ||
        preQuoteIdRef.current !== expectedPreQuoteId ||
        workspaceTokenRef.current !== expectedToken ||
        proposalRequestRef.current !== requestId ||
        response.requirementId.toLowerCase() !== requirementId.toLowerCase()
      ) return;
      setProposal(response);
      setPhase("complete");
      setError(null);
    } catch (cause) {
      if (
        !mountedRef.current ||
        preQuoteIdRef.current !== expectedPreQuoteId ||
        workspaceTokenRef.current !== expectedToken ||
        proposalRequestRef.current !== requestId
      ) return;
      setError(cause);
      setPhase("proposal-error");
    }
  }, []);

  useEffect(() => {
    preQuoteIdRef.current = preQuoteId;
    let cancelled = false;
    const token = workspaceTokenRef.current + 1;
    workspaceTokenRef.current = token;
    busyRef.current = false;
    pricingBusyRef.current = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled || !mountedRef.current || preQuoteIdRef.current !== preQuoteId || workspaceTokenRef.current !== token) return;
      setFiles([]);
      setValidationError(null);
      setRequirement(null);
      setProcessingResult(null);
      setProposal(null);
      setPricing(null);
      setPricingError(null);
      setPricingLoading(false);
      setError(null);
      setPhase("hydrating");

      try {
        const current = await getCurrentRequirement(preQuoteId);
        if (cancelled || !mountedRef.current || preQuoteIdRef.current !== preQuoteId || workspaceTokenRef.current !== token) return;
        if (!current) {
          setPhase("idle");
          return;
        }

        setRequirement(current);
        if (current.hasTechnicalProposal) {
          await loadProposal(current.requirementId, { preQuoteId, token });
          return;
        }

        if (isRequirementProcessing(current)) {
          setPhase("processing");
          return;
        }

        if (isRequirementFailed(current)) {
          setError(processingFailureError(current));
          setPhase("process-error");
          return;
        }

        if (current.status === "PROCESSED") {
          await loadProposal(current.requirementId, { preQuoteId, token });
          return;
        }

        setPhase("ready");
      } catch (cause) {
        if (!cancelled && mountedRef.current && preQuoteIdRef.current === preQuoteId && workspaceTokenRef.current === token) {
          setError(cause);
          setPhase("current-error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentReloadKey, loadProposal, preQuoteId]);

  const retryCurrent = useCallback(() => {
    setCurrentReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (phase !== "processing" || !requirement) {
      processingPollRef.current = null;
      return;
    }
    if (busyRef.current) return;
    const token = workspaceTokenRef.current;
    const expectedPreQuoteId = preQuoteId;
    const requirementId = requirement.requirementId;
    const currentPoll = processingPollRef.current;
    const startedAt = currentPoll?.requirementId === requirementId ? currentPoll.startedAt : Date.now();
    processingPollRef.current = { requirementId, startedAt };
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (cancelled || !mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || workspaceTokenRef.current !== token) return;
      if (Date.now() - startedAt >= PROCESSING_POLL_LIMIT_MS) {
        setError(processingTimeoutError());
        setPhase("processing-timeout");
        return;
      }

      try {
        const current = await getCurrentRequirement(expectedPreQuoteId);
        if (cancelled || !mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || workspaceTokenRef.current !== token) return;
        if (!current) {
          setRequirement(null);
          setPhase("idle");
          return;
        }
        if (current.requirementId.toLowerCase() !== requirementId.toLowerCase()) return;

        setRequirement(current);
        if (current.hasTechnicalProposal || current.status === "PROCESSED") {
          await loadProposal(current.requirementId, { preQuoteId: expectedPreQuoteId, token });
          return;
        }

        if (isRequirementFailed(current)) {
          setError(processingFailureError(current));
          setPhase("process-error");
          return;
        }

        timer = window.setTimeout(poll, PROCESSING_POLL_INTERVAL_MS);
      } catch (cause) {
        if (cancelled || !mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || workspaceTokenRef.current !== token) return;
        setError(cause);
        setPhase("current-error");
      }
    };

    timer = window.setTimeout(poll, PROCESSING_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [loadProposal, phase, preQuoteId, requirement]);

  const selectFiles = useCallback((incoming: File[]) => {
    if (busyRef.current || requirement) return;
    setFiles((current) => {
      const known = new Set(current.map(identity));
      const next = [...current, ...incoming.filter((file) => !known.has(identity(file)))];
      setValidationError(validateFiles(next));
      return next;
    });
    setError(null);
  }, [requirement]);

  const removeFile = useCallback((index: number) => {
    if (busyRef.current || requirement) return;
    setFiles((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      setValidationError(validateFiles(next));
      return next;
    });
  }, [requirement]);

  const upload = useCallback(async () => {
    if (busyRef.current || requirement) return;
    const issue = validateFiles(files) ?? (files.length === 0 ? "Selecciona al menos un archivo." : null);
    if (issue) { setValidationError(issue); return; }
    busyRef.current = true;
    setError(null);
    setPhase("uploading");
    try {
      const created = await createRequirement(preQuoteId, files);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setRequirement(created);
      setPhase("ready");
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setError(cause);
      setPhase("upload-error");
    } finally {
      busyRef.current = false;
    }
  }, [files, preQuoteId, requirement]);

  const process = useCallback(async () => {
    if (busyRef.current || !requirement || isRequirementProcessing(requirement)) return;
    busyRef.current = true;
    setError(null);
    setPhase("processing");
    try {
      const response = await processRequirement(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setProcessingResult(response);
      if (response.outcome === "Failed") {
        setError(processingResultError(response));
        setPhase("process-error");
        return;
      }
      setPhase("completing");
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      if (mountedRef.current && preQuoteIdRef.current === preQuoteId) {
        await loadProposal(requirement.requirementId);
      }
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      if (getProblemCode(cause) === "REQUIREMENT_PROCESSING_ALREADY_ACTIVE") {
        busyRef.current = false;
        setCurrentReloadKey((current) => current + 1);
        setPhase("processing");
        return;
      }
      setError(cause);
      setPhase("process-error");
    } finally {
      busyRef.current = false;
    }
  }, [loadProposal, preQuoteId, requirement]);

  const retryProposal = useCallback(async () => {
    if (busyRef.current || !requirement) return;
    busyRef.current = true;
    setError(null);
    try { await loadProposal(requirement.requirementId); }
    finally { busyRef.current = false; }
  }, [loadProposal, requirement]);

  const calculatePricing = useCallback(async () => {
    if (pricingBusyRef.current || !requirement || !proposal) return;
    pricingBusyRef.current = true;
    setPricingLoading(true);
    setPricingError(null);
    const requestId = pricingRequestRef.current + 1;
    pricingRequestRef.current = requestId;
    const expectedPreQuoteId = preQuoteId;
    const expectedRequirementId = requirement.requirementId;
    const expectedProposalId = proposal.technicalProposalId;
    try {
      const response = await getRequirementPricing(expectedRequirementId);
      if (
        !mountedRef.current ||
        preQuoteIdRef.current !== expectedPreQuoteId ||
        pricingRequestRef.current !== requestId ||
        response.requirementId.toLowerCase() !== expectedRequirementId.toLowerCase() ||
        response.technicalProposalId.toLowerCase() !== expectedProposalId.toLowerCase()
      ) return;
      setPricing(response);
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || pricingRequestRef.current !== requestId) return;
      setPricingError(cause);
    } finally {
      pricingBusyRef.current = false;
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId && pricingRequestRef.current === requestId) {
        setPricingLoading(false);
      }
    }
  }, [preQuoteId, proposal, requirement]);

  return {
    files, validationError, phase, requirement, processingResult, proposal, error,
    pricing, pricingLoading, pricingError,
    selectFiles, removeFile, upload, process, retryProposal, retryCurrent,
    calculatePricing,
  };
}
