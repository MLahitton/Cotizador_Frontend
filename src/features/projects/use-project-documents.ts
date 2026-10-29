"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getRequirementById } from "@/features/prequotes/requirement-api";
import type { ProjectWorkspace } from "./project-workspace-types";
import { createProjectDocumentsQuery, resolveProjectDocumentsContext, type ProjectDocumentsState } from "./project-documents-query";

export function useProjectDocuments(workspace: ProjectWorkspace) {
  const context = useMemo(() => resolveProjectDocumentsContext(workspace), [workspace]);
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([workspace.project.id, workspace.workflow.resolutionState,
    workspace.workflow.requirementId, workspace.workflow.preQuoteId, revision]);
  const [result, setResult] = useState<{ key: string; state: ProjectDocumentsState } | null>(null);

  useEffect(() => {
    if (context.status !== "resolved") return;
    const query = createProjectDocumentsQuery(context, getRequirementById, (state) => setResult({ key, state }));
    queueMicrotask(() => { void query.load(); });
    return () => query.dispose();
  }, [context, key]);

  const retry = useCallback(() => setRevision((current) => current + 1), []);
  const state: ProjectDocumentsState = context.status !== "resolved"
    ? { status: context.status }
    : result?.key === key ? result.state : { status: "loading" };
  return { state, retry };
}
