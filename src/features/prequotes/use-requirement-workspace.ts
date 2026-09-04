"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getSupportedDocumentFormat,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/features/prequotes/prequote-document-formatters";
import { cancelRequirementProcessing, createRequirement, getCurrentRequirement, processRequirement } from "@/features/prequotes/requirement-api";
import { cancelRequirementPricing, getRequirementPricing, repriceRequirementPricingItem } from "@/features/prequotes/requirement-pricing-api";
import type { RepriceRequirementPricingItemResponse, RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { CreatedRequirement, CurrentRequirement, ProcessedRequirement, RequirementCommercialLine } from "@/features/prequotes/requirement-types";
import { confirmTechnicalProposalSelection, updateTechnicalProposalItemInclusion, updateTechnicalProposalItemSelection, type TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import { createManualTechnicalProposalItem, getTechnicalProposal, type CreateManualTechnicalProposalItemRequest } from "@/features/prequotes/technical-proposal-api";
import type { TechnicalProposal, TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import { getTechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-api";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";
import { ApiError } from "@/lib/http/api-error";

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;
const PROCESSING_POLL_INTERVAL_MS = 7000;
const PROCESSING_POLL_LIMIT_MS = 15 * 60 * 1000;

export type RequirementWorkspacePhase =
  | "hydrating" | "idle" | "uploading" | "ready" | "processing" | "processing-cancelling" | "processing-cancelled" | "completing"
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


function findItemOption<T extends { id: string }>(
  item: TechnicalProposalItem,
  kind: "system" | "glass" | "finish",
  id: string | null,
): T | null {
  if (!id) return null;
  const current = item.selected?.[kind] ?? null;
  const suggested = item.suggested[kind] ?? null;
  const alternatives = kind === "system"
    ? item.alternatives.systems.map(({ option }) => option)
    : kind === "glass"
      ? item.alternatives.glass.map(({ option }) => option)
      : item.alternatives.finishes.map(({ option }) => option);
  const options = [current, suggested, ...alternatives];
  return (options.find((option) => option?.id.toLowerCase() === id.toLowerCase()) ?? null) as T | null;
}

function applyRepricedSelection(
  proposal: TechnicalProposal,
  response: RepriceRequirementPricingItemResponse,
): TechnicalProposal {
  return {
    ...proposal,
    items: proposal.items.map((item) => {
      if (item.itemId.toLowerCase() !== response.technicalProposalItemId.toLowerCase()) return item;
      const selectedAtUtc = item.selected?.selectedAtUtc ?? new Date().toISOString();
      const selectedByUserId = item.selected?.selectedByUserId ?? "local-reprice";
      return {
        ...item,
        selected: {
          system: findItemOption(item, "system", response.configuration.systemId),
          glass: findItemOption(item, "glass", response.configuration.glassTypeId),
          finish: findItemOption(item, "finish", response.configuration.finishTypeId),
          selectedAtUtc,
          selectedByUserId,
        },
        selectionState: "MODIFIED",
      };
    }),
  };
}

function applyRepricedPricing(
  pricing: RequirementPricing,
  response: RepriceRequirementPricingItemResponse,
): RequirementPricing {
  const nextItems = pricing.items.map((item) => {
    if (item.proposalItemId.toLowerCase() !== response.technicalProposalItemId.toLowerCase()) return item;
    const unit = response.pricing.currentUnit ?? { minimum: null, expected: null, maximum: null };
    const line = response.pricing.currentLine ?? { minimum: null, expected: null, maximum: null };
    return {
      ...item,
      status: response.pricing.state,
      configurationSource: "SELECTED" as const,
      unit,
      line,
      originalUnit: response.pricing.originalUnit,
      currentUnit: response.pricing.currentUnit,
      deltaUnit: response.pricing.deltaUnit,
      originalLine: response.pricing.originalLine,
      currentLine: response.pricing.currentLine,
      deltaLine: response.pricing.deltaLine,
      comparables: response.comparables,
      priceSource: response.pricing.priceSource,
      repriceAttemptState: response.pricing.repriceAttemptState,
      repriceAttemptReason: response.pricing.repriceAttemptReason,
      missingData: response.pricing.repriceAttemptState && response.pricing.repriceAttemptState !== "PRICEABLE"
        ? Array.from(new Set([...item.missingData, response.pricing.repriceAttemptReason, "LAST_VALID_PRICE_PRESERVED"].filter((value): value is string => Boolean(value))))
        : line.expected === null ? ["NO_COMPARABLES"] : item.missingData,
      requiresReview: response.pricing.state !== "PRICEABLE" || response.pricing.repriceAttemptState === "NO_ESTIMATE" || item.requiresReview,
    };
  });
  const pricedItemCount = nextItems.filter((item) => item.status === "PRICEABLE").length;
  const notPriceableItemCount = nextItems.length - pricedItemCount;
  return {
    ...pricing,
    items: nextItems,
    pricedItemCount,
    notPriceableItemCount,
    itemsRequiringReview: nextItems.filter((item) => item.requiresReview).length,
    estimatedSubtotal: {
      ...pricing.estimatedSubtotal,
      expected: response.summary.currentGrandTotal,
    },
    isCompleteTotal: notPriceableItemCount === 0,
    requiresReview: nextItems.some((item) => item.requiresReview),
    originalGrandTotal: response.summary.originalGrandTotal,
    currentGrandTotal: response.summary.currentGrandTotal,
    deltaGrandTotal: response.summary.deltaGrandTotal,
  };
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
  const [commercialLine, setCommercialLine] = useState<RequirementCommercialLine | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RequirementWorkspacePhase>("hydrating");
  const [requirement, setRequirement] = useState<WorkspaceRequirement | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessedRequirement | null>(null);
  const [proposal, setProposal] = useState<TechnicalProposal | null>(null);
  const [pricing, setPricing] = useState<RequirementPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<unknown | null>(null);
  const [savingSelectionItemIds, setSavingSelectionItemIds] = useState<string[]>([]);
  const [selectionErrors, setSelectionErrors] = useState<Record<string, unknown>>({});
  const [selectionCatalog, setSelectionCatalog] = useState<TechnicalSelectionCatalog | null>(null);
  const [selectionCatalogLoading, setSelectionCatalogLoading] = useState(false);
  const [selectionCatalogError, setSelectionCatalogError] = useState<string | null>(null);
  const [pricingAfterSelectionError, setPricingAfterSelectionError] = useState(false);
  const [pricingCancelMessage, setPricingCancelMessage] = useState<string | null>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);
  const [confirmationError, setConfirmationError] = useState<unknown | null>(null);
  const [manualItemCreating, setManualItemCreating] = useState(false);
  const [manualItemError, setManualItemError] = useState<unknown | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [currentReloadKey, setCurrentReloadKey] = useState(0);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const pricingBusyRef = useRef(false);
  const preQuoteIdRef = useRef(preQuoteId);
  const workspaceTokenRef = useRef(0);
  const proposalRequestRef = useRef(0);
  const pricingRequestRef = useRef(0);
  const selectionCatalogRequestRef = useRef(0);
  const selectionCatalogCacheRef = useRef(new Map<RequirementCommercialLine, TechnicalSelectionCatalog>());
  const processingPollRef = useRef<{ requirementId: string; startedAt: number } | null>(null);
  const processingCancellationRequestedRef = useRef(false);
  const pricingCancellationRequestedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadSelectionCatalog = useCallback(async (line: RequirementCommercialLine, force = false) => {
    const cached = selectionCatalogCacheRef.current.get(line);
    if (cached && !force) {
      setSelectionCatalog(cached);
      setSelectionCatalogLoading(false);
      setSelectionCatalogError(null);
      return;
    }
    const requestId = ++selectionCatalogRequestRef.current;
    const expectedPreQuoteId = preQuoteIdRef.current;
    setSelectionCatalogLoading(true);
    setSelectionCatalogError(null);
    try {
      const response = await getTechnicalSelectionCatalog(line);
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || selectionCatalogRequestRef.current !== requestId) return;
      setSelectionCatalog(response);
      selectionCatalogCacheRef.current.set(line, response);
    } catch {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || selectionCatalogRequestRef.current !== requestId) return;
      setSelectionCatalogError("No fue posible cargar el catálogo completo de selección.");
    } finally {
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId && selectionCatalogRequestRef.current === requestId) setSelectionCatalogLoading(false);
    }
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
      setCommercialLine(null);
      setValidationError(null);
      setRequirement(null);
      setProcessingResult(null);
      setProposal(null);
      setPricing(null);
      setPricingError(null);
      setPricingLoading(false);
      setSavingSelectionItemIds([]);
      setSelectionErrors({});
      setSelectionCatalog(null);
      setSelectionCatalogLoading(false);
      setSelectionCatalogError(null);
      setPricingAfterSelectionError(false);
      setPricingCancelMessage(null);
      setConfirmationLoading(false);
      setConfirmationError(null);
      setManualItemCreating(false);
      setManualItemError(null);
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
        setCommercialLine(current.commercialLine);
        if (current.commercialLine) void loadSelectionCatalog(current.commercialLine);
        if (current.hasTechnicalProposal) {
          await loadProposal(current.requirementId, { preQuoteId, token });
          return;
        }

        if (isRequirementProcessing(current)) {
          setPhase("processing");
          return;
        }

        if (current.latestAttemptOutcome === "Cancelled") {
          setPhase("processing-cancelled");
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
  }, [currentReloadKey, loadProposal, loadSelectionCatalog, preQuoteId]);

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

        if (current.latestAttemptOutcome === "Cancelled") {
          setPhase("processing-cancelled");
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
    const issue = !commercialLine
      ? "Selecciona una linea comercial."
      : validateFiles(files) ?? (files.length === 0 ? "Selecciona al menos un archivo." : null);
    if (issue) { setValidationError(issue); return; }
    busyRef.current = true;
    setError(null);
    setPhase("uploading");
    try {
      const created = await createRequirement(preQuoteId, files, commercialLine!);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setRequirement(created);
      void loadSelectionCatalog(created.commercialLine);
      setPhase("ready");
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setError(cause);
      setPhase("upload-error");
    } finally {
      busyRef.current = false;
    }
  }, [commercialLine, files, loadSelectionCatalog, preQuoteId, requirement]);

  const retrySelectionCatalog = useCallback(() => {
    if (requirement?.commercialLine) void loadSelectionCatalog(requirement.commercialLine, true);
  }, [loadSelectionCatalog, requirement]);

  const process = useCallback(async () => {
    if (busyRef.current || !requirement || isRequirementProcessing(requirement)) return;
    busyRef.current = true;
    setError(null);
    setPhase("processing");
    try {
      const response = await processRequirement(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setProcessingResult(response);
      if (response.outcome === "Cancelled") {
        setPhase("processing-cancelled");
        return;
      }
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


  const cancelProcessing = useCallback(async () => {
    if (!requirement || phase !== "processing") return;
    processingCancellationRequestedRef.current = true;
    setPhase("processing-cancelling");
    setError(null);
    try {
      const cancelled = await cancelRequirementProcessing(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setProcessingResult(cancelled);
      const current = await getCurrentRequirement(preQuoteId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setRequirement(current);
      setPhase("processing-cancelled");
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      if (getProblemCode(cause) === "REQUIREMENT_PROCESSING_ATTEMPT_NOT_FOUND") {
        setCurrentReloadKey((current) => current + 1);
        return;
      }
      setError(cause);
      setPhase("process-error");
    } finally {
      processingCancellationRequestedRef.current = false;
    }
  }, [phase, preQuoteId, requirement]);
  const retryProposal = useCallback(async () => {
    if (busyRef.current || !requirement) return;
    busyRef.current = true;
    setError(null);
    try { await loadProposal(requirement.requirementId); }
    finally { busyRef.current = false; }
  }, [loadProposal, requirement]);

  const isCommercialMutationBusy = pricingLoading || confirmationLoading || manualItemCreating || savingSelectionItemIds.length > 0;

  const calculatePricing = useCallback(async () => {
    if (pricingBusyRef.current || isCommercialMutationBusy || !requirement || !proposal) return;
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
      setPricingAfterSelectionError(false);
      setPricingCancelMessage(null);
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId || pricingRequestRef.current !== requestId) return;
      if (pricingCancellationRequestedRef.current || getProblemCode(cause) === "REQUIREMENT_PRICING_CANCELLED") {
        setPricingError(null);
        setPricingCancelMessage(pricing ? "Calculo detenido. Se conserva el ultimo precio valido." : "Calculo detenido. No se genero una precotizacion.");
        return;
      }
      setPricingError(cause);
    } finally {
      pricingBusyRef.current = false;
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId && pricingRequestRef.current === requestId) {
        setPricingLoading(false);
      }
    }
  }, [isCommercialMutationBusy, preQuoteId, pricing, proposal, requirement]);


  const cancelPricing = useCallback(async () => {
    if (!requirement || !pricingLoading) return;
    pricingCancellationRequestedRef.current = true;
    setPricingError(null);
    try {
      await cancelRequirementPricing(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      pricingRequestRef.current += 1;
      pricingBusyRef.current = false;
      setPricingLoading(false);
      setPricingCancelMessage(pricing ? "Calculo detenido. Se conserva el ultimo precio valido." : "Calculo detenido. No se genero una precotizacion.");
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== preQuoteId) return;
      setPricingError(cause);
    } finally {
      pricingCancellationRequestedRef.current = false;
    }
  }, [preQuoteId, pricing, pricingLoading, requirement]);

  const saveSelection = useCallback(async (itemId: string, request: TechnicalProposalSelectionRequest) => {
    if (!requirement || !proposal || isCommercialMutationBusy) return false;
    const expectedPreQuoteId = preQuoteId;
    setSavingSelectionItemIds((current) => [...current, itemId]);
    setSelectionErrors((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    setPricingAfterSelectionError(false);
    try {
      if (pricing && proposal.commercialConfirmation.state === "CONFIRMED") {
        const response = await repriceRequirementPricingItem(requirement.requirementId, itemId, {
          systemId: request.systemId,
          glassTypeId: request.glassId,
          finishTypeId: request.finishId,
          quantity: request.quantity,
          widthMm: request.widthMm,
          heightMm: request.heightMm,
        });
        const refreshedProposal = await getTechnicalProposal(requirement.requirementId);
        if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
        setProposal(applyRepricedSelection(refreshedProposal, response));
        setPricing((current) => current ? applyRepricedPricing(current, response) : current);
        setPricingError(null);
        setPricingAfterSelectionError(false);
        setPricingCancelMessage(null);
        setConfirmationError(null);
        return true;
      }

      await updateTechnicalProposalItemSelection(proposal.technicalProposalId, itemId, request);
      const refreshedProposal = await getTechnicalProposal(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setProposal(refreshedProposal);
      setPricing(null);
      setPricingError(null);
      setPricingAfterSelectionError(false);
      setPricingCancelMessage(null);
      setConfirmationError(null);
      return true;
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setSelectionErrors((current) => ({ ...current, [itemId]: cause }));
      return false;
    } finally {
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId) {
        setSavingSelectionItemIds((current) => current.filter((id) => id !== itemId));
      }
    }
  }, [isCommercialMutationBusy, preQuoteId, pricing, proposal, requirement]);


  const createManualItem = useCallback(async (request: CreateManualTechnicalProposalItemRequest) => {
    if (!requirement || !proposal || isCommercialMutationBusy) return false;
    const expectedPreQuoteId = preQuoteId;
    setManualItemCreating(true);
    setManualItemError(null);
    setPricingAfterSelectionError(false);
    try {
      await createManualTechnicalProposalItem(requirement.requirementId, request);
      const refreshedProposal = await getTechnicalProposal(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setProposal(refreshedProposal);
      setPricing(null);
      setPricingError(null);
      setPricingAfterSelectionError(false);
      setPricingCancelMessage(null);
      setConfirmationError(null);
      return true;
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setManualItemError(cause);
      return false;
    } finally {
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId) {
        setManualItemCreating(false);
      }
    }
  }, [isCommercialMutationBusy, preQuoteId, proposal, requirement]);

  const updateItemInclusion = useCallback(async (itemId: string, isIncluded: boolean, reason?: string | null) => {
    if (!requirement || !proposal || isCommercialMutationBusy) return false;
    const expectedPreQuoteId = preQuoteId;
    setSavingSelectionItemIds((current) => [...current, itemId]);
    setSelectionErrors((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    setPricingAfterSelectionError(false);
    try {
      await updateTechnicalProposalItemInclusion(requirement.requirementId, itemId, {
        isIncluded,
        reason: reason?.trim() ? reason.trim() : null,
      });
      const refreshedProposal = await getTechnicalProposal(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setProposal(refreshedProposal);
      setPricing(null);
      setPricingError(null);
      setPricingAfterSelectionError(false);
      setPricingCancelMessage(null);
      setConfirmationError(null);
      return true;
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setSelectionErrors((current) => ({ ...current, [itemId]: { kind: "inclusion", action: isIncluded ? "reactivate" : "exclude", cause } }));
      return false;
    } finally {
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId) {
        setSavingSelectionItemIds((current) => current.filter((id) => id !== itemId));
      }
    }
  }, [isCommercialMutationBusy, preQuoteId, proposal, requirement]);
  const confirmSelection = useCallback(async () => {
    if (!requirement || !proposal || isCommercialMutationBusy) return;
    const expectedPreQuoteId = preQuoteId;
    setConfirmationLoading(true);
    setConfirmationError(null);
    setPricing(null);
    setPricingError(null);
    setPricingAfterSelectionError(false);
    try {
      await confirmTechnicalProposalSelection(proposal.technicalProposalId);
      const refreshedProposal = await getTechnicalProposal(requirement.requirementId);
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setProposal(refreshedProposal);
    } catch (cause) {
      if (!mountedRef.current || preQuoteIdRef.current !== expectedPreQuoteId) return false;
      setConfirmationError(cause);
    } finally {
      if (mountedRef.current && preQuoteIdRef.current === expectedPreQuoteId) {
        setConfirmationLoading(false);
      }
    }
  }, [isCommercialMutationBusy, preQuoteId, proposal, requirement]);
  return {
    files, commercialLine, validationError, phase, requirement, processingResult, proposal, error,
    pricing, pricingLoading, pricingError, pricingAfterSelectionError, pricingCancelMessage, confirmationLoading, confirmationError, manualItemCreating, manualItemError, savingSelectionItemIds, selectionErrors, isCommercialMutationBusy,
    selectionCatalog, selectionCatalogLoading, selectionCatalogError,
    setCommercialLine,
    selectFiles, removeFile, upload, process, cancelProcessing, retryProposal, retryCurrent,
    calculatePricing, cancelPricing, confirmSelection, saveSelection, createManualItem, updateItemInclusion, retrySelectionCatalog,
  };
}
