"use client";

import { useCallback, useEffect, useState } from "react";
import { getProjectDiagnosis } from "./project-diagnosis-api";
import type { ProjectDiagnosisResponse } from "./project-diagnosis-types";

export type DiagnosisLoadState =
  | { status: "loading"; data: null }
  | { status: "success"; data: ProjectDiagnosisResponse }
  | { status: "error"; data: null };

export function useProjectDiagnosis(projectId: string) {
  const [revision, setRevision] = useState(0);
  const key = `${projectId}:${revision}`;
  const [result, setResult] = useState<{ key: string; state: DiagnosisLoadState } | null>(null);

  useEffect(() => {
    let active = true;
    // Deferred start also avoids duplicate requests during Strict Mode's effect replay.
    queueMicrotask(() => {
      if (!active) return;
      void getProjectDiagnosis(projectId).then(
        (data) => { if (active) setResult({ key, state: { status: "success", data } }); },
        () => { if (active) setResult({ key, state: { status: "error", data: null } }); },
      );
    });
    return () => { active = false; };
  }, [projectId, key]);

  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const state: DiagnosisLoadState = result?.key === key ? result.state : { status: "loading", data: null };
  return { state, retry };
}
