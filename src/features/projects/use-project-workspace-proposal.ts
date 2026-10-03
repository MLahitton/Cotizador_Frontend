"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getTechnicalProposal } from "@/features/prequotes/technical-proposal-api";
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

  return {
    proposal: state.key === key && state.status === "success" ? state.data : null,
    proposalError: state.key === key && state.status === "error" ? state.error : null,
    isProposalLoading:
      enabled &&
      Boolean(requirementId) &&
      (state.key !== key || state.status === "loading"),
    retryProposal: retry,
  };
}
