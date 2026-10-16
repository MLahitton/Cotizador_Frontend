"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getTechnicalProposal,
  type TechnicalProposalItemLocationResponse,
  type TechnicalProposalItemObservationResponse,
  type TechnicalProposalItemPhysicalDataResponse,
} from "@/features/prequotes/technical-proposal-api";
import type {
  TechnicalProposalItemInclusionResponse,
} from "@/features/prequotes/technical-proposal-selection-api";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";

export interface ProjectWorkspaceProposalError {
  cause: unknown;
}

type ProposalState =
  | { key: string; status: "idle"; data: null; error: null }
  | { key: string; status: "loading"; data: null; error: null }
  | { key: string; status: "success"; data: TechnicalProposal; error: null }
  | { key: string; status: "error"; data: null; error: ProjectWorkspaceProposalError };

export function useProjectWorkspaceProposal(
  requirementId: string | null,
  enabled: boolean,
) {
  const [reloadKey, setReloadKey] = useState(0);
  const key = `${requirementId ?? "none"}:${enabled ? "on" : "off"}:${reloadKey}`;
  const [state, setState] = useState<ProposalState>({
    key,
    status: "idle",
    data: null,
    error: null,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!enabled || !requirementId) {
      queueMicrotask(() => {
        if (requestId === requestIdRef.current) {
          setState({ key, status: "idle", data: null, error: null });
        }
      });
      return;
    }

    queueMicrotask(() => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState({ key, status: "loading", data: null, error: null });
    });

    void getTechnicalProposal(requirementId)
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setState({ key, status: "success", data: response, error: null });
        }
      })
      .catch((requestError: unknown) => {
        if (requestId === requestIdRef.current) {
          setState({
            key,
            status: "error",
            data: null,
            error: { cause: requestError },
          });
        }
      });
  }, [enabled, key, requirementId]);

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const applyItemInclusionUpdate = useCallback((
    update: TechnicalProposalItemInclusionResponse,
  ) => {
    setState((current) => {
      if (
        current.status !== "success" ||
        current.data.technicalProposalId.toLowerCase() !==
          update.technicalProposalId.toLowerCase()
      ) {
        return current;
      }

      return {
        ...current,
        data: {
          ...current.data,
          items: current.data.items.map((item) =>
            item.itemId.toLowerCase() === update.itemId.toLowerCase()
              ? {
                  ...item,
                  isIncluded: update.isIncluded,
                  excludedAtUtc: update.excludedAtUtc,
                  excludedByUserId: update.excludedByUserId,
                  exclusionReason: update.exclusionReason,
                }
              : item,
          ),
        },
      };
    });
  }, []);

  const applyItemLocationUpdate = useCallback((
    update: TechnicalProposalItemLocationResponse,
  ) => {
    setState((current) => {
      if (
        current.status !== "success" ||
        current.data.technicalProposalId.toLowerCase() !==
          update.technicalProposalId.toLowerCase()
      ) {
        return current;
      }

      return {
        ...current,
        data: {
          ...current.data,
          items: current.data.items.map((item) =>
            item.itemId.toLowerCase() === update.itemId.toLowerCase()
              ? {
                  ...item,
                  extractedLocation: update.extractedLocation,
                  manualLocationOverride: update.manualLocationOverride,
                  effectiveLocation: update.effectiveLocation,
                  occurrenceContext: update.extractedLocation,
                }
              : item,
          ),
        },
      };
    });
  }, []);


  const applyItemObservationUpdate = useCallback((
    update: TechnicalProposalItemObservationResponse,
  ) => {
    setState((current) => {
      if (
        current.status !== "success" ||
        current.data.technicalProposalId.toLowerCase() !==
          update.technicalProposalId.toLowerCase()
      ) {
        return current;
      }

      return {
        ...current,
        data: {
          ...current.data,
          items: current.data.items.map((item) =>
            item.itemId.toLowerCase() === update.itemId.toLowerCase()
              ? {
                  ...item,
                  manualObservation: update.manualObservation,
                }
              : item,
          ),
        },
      };
    });
  }, []);
  const applyItemPhysicalUpdate = useCallback((
    update: TechnicalProposalItemPhysicalDataResponse,
  ) => {
    setState((current) => {
      if (current.status !== "success" || current.data.technicalProposalId !== update.technicalProposalId) {
        return current;
      }

      return {
        ...current,
        data: {
          ...current.data,
          items: current.data.items.map((item) =>
            item.itemId.toLowerCase() === update.itemId.toLowerCase()
              ? {
                  ...item,
                  effectiveQuantity: update.quantity,
                  quantitySource: update.quantitySource,
                  quantityExtractionStatus: update.quantityExtractionStatus,
                  quantityExtractionConfidence: update.quantityExtractionConfidence,
                  effectiveWidthMm: update.widthMm,
                  effectiveHeightMm: update.heightMm,
                  dataCompleteness: update.dataCompleteness,
                }
              : item,
          ),
        },
      };
    });
  }, []);

  return {
    proposal: state.key === key && state.status === "success" ? state.data : null,
    proposalError: state.key === key && state.status === "error" ? state.error : null,
    isProposalLoading:
      enabled &&
      Boolean(requirementId) &&
      (state.key !== key || state.status === "loading"),
    retryProposal: retry,
    applyItemInclusionUpdate,
    applyItemLocationUpdate,
    applyItemObservationUpdate,
    applyItemPhysicalUpdate,
  };
}
