"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentRequirement, getRequirementErrorMessage, processRequirement } from "@/features/prequotes/requirement-api";
import { ApiError } from "@/lib/http/api-error";
import { createProjectRequirementAnalysis, type ProjectAnalysisState } from "./project-requirement-analysis";
import type { ProjectWorkspaceWorkflow } from "./project-workspace-types";

export function useProjectRequirementAnalysis({ projectId, workflow, readOnly, onRefreshWorkspace }: {
  projectId: string;
  workflow: ProjectWorkspaceWorkflow | undefined;
  readOnly: boolean;
  onRefreshWorkspace: () => void;
}) {
  const enabled = workflow?.resolutionState === "RESOLVED" && !workflow.hasTechnicalProposal
    && (!workflow.extraction || workflow.extraction.state === "Manual");
  const capabilityReadOnly = readOnly || workflow?.extraction?.canAnalyze === false;
  const requirementId = enabled ? workflow.requirementId : null;
  const preQuoteId = enabled ? workflow.preQuoteId : null;
  const status = enabled ? workflow.requirementStatus : null;
  const key = `${projectId}:${requirementId}:${preQuoteId}:${status}:${capabilityReadOnly}`;
  const [local, setLocal] = useState<{ key: string; state: ProjectAnalysisState } | null>(null);
  const sessionRef = useRef<ReturnType<typeof createProjectRequirementAnalysis> | null>(null);

  useEffect(() => {
    if (!requirementId) return;
    const session = createProjectRequirementAnalysis({
      requirementId, preQuoteId, status, readOnly: capabilityReadOnly,
      processRequirement, getCurrentRequirement,
      isAlreadyActive: (error) => error instanceof ApiError &&
        (error.problemDetails?.errorCode ?? error.problemDetails?.code) === "REQUIREMENT_PROCESSING_ALREADY_ACTIVE",
      errorMessage: (error) => getRequirementErrorMessage(error, "process"),
      failureMessage: (code) => getRequirementErrorMessage(new ApiError({
        status: 0, title: "Análisis no completado", detail: "No fue posible completar el análisis.",
        problemDetails: { errorCode: code ?? "REQUIREMENT_PROCESSING_FAILED" },
      }), "process"),
      onChange: (state) => setLocal({ key, state }),
      onRefresh: onRefreshWorkspace,
      schedule: (callback, delay) => {
        const timer = window.setTimeout(callback, delay);
        return () => window.clearTimeout(timer);
      },
    });
    sessionRef.current = session;
    session.startPolling();
    return () => {
      session.dispose();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [key, requirementId, preQuoteId, status, capabilityReadOnly, onRefreshWorkspace]);

  const process = useCallback(() => { void sessionRef.current?.process(); }, []);
  const state = local?.key === key ? local.state : { status, error: null, isSubmitting: false };
  return { ...state, process, readOnly: capabilityReadOnly };
}
