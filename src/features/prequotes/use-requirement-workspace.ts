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

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;

export type RequirementWorkspacePhase =
  | "hydrating" | "idle" | "uploading" | "ready" | "processing" | "completing"
  | "proposal-loading" | "complete" | "upload-error" | "process-error" | "proposal-error" | "current-error";

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

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadProposal = useCallback(async (requirementId: string) => {
    setPhase("proposal-loading");
    try {
      const response = await getTechnicalProposal(requirementId);
      if (!mountedRef.current) return;
      setProposal(response);
      setPhase("complete");
      setError(null);
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(cause);
      setPhase("proposal-error");
    }
  }, []);

  useEffect(() => {
    preQuoteIdRef.current = preQuoteId;
    let cancelled = false;
    busyRef.current = false;
    pricingBusyRef.current = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled || !mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
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
        if (cancelled || !mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
        if (!current) {
          setPhase("idle");
          return;
        }

        setRequirement(current);
        if (current.hasTechnicalProposal) {
          await loadProposal(current.requirementId);
          return;
        }

        if (current.status === "PROCESSING" || current.latestAttemptState === "Processing") {
          setPhase("processing");
          return;
        }

        setPhase("ready");
      } catch (cause) {
        if (!cancelled && mountedRef.current && preQuoteIdRef.current === preQuoteId) {
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
      if (!mountedRef.current) return;
      setRequirement(created);
      setPhase("ready");
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(cause);
      setPhase("upload-error");
    } finally {
      busyRef.current = false;
    }
  }, [files, preQuoteId, requirement]);

  const process = useCallback(async () => {
    if (busyRef.current || !requirement) return;
    busyRef.current = true;
    setError(null);
    setPhase("processing");
    try {
      const response = await processRequirement(requirement.requirementId);
      if (!mountedRef.current) return;
      setProcessingResult(response);
      if (response.outcome === "Failed") {
        setError(new Error("El analisis del requerimiento no pudo completarse."));
        setPhase("process-error");
        return;
      }
      setPhase("completing");
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      if (mountedRef.current) await loadProposal(requirement.requirementId);
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(cause);
      setPhase("process-error");
    } finally {
      busyRef.current = false;
    }
  }, [loadProposal, requirement]);

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
    try {
      const response = await getRequirementPricing(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      if (response.technicalProposalId.toLowerCase() !== proposal.technicalProposalId.toLowerCase()) {
        throw new Error("La estimación no corresponde a la propuesta técnica vigente.");
      }
      setPricing(response);
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setPricingError(cause);
    } finally {
      pricingBusyRef.current = false;
      if (mountedRef.current && preQuoteIdRef.current === preQuoteId) {
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
