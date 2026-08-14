"use client";

import { useCallback, useState } from "react";

import { estimateDocuments } from "@/features/prequotes/historical-document-estimate-api";
import type { HistoricalDocumentEstimate } from "@/features/prequotes/historical-document-estimate-types";

export function useHistoricalDocumentEstimate(projectId: string) {
  const [result, setResult] = useState<HistoricalDocumentEstimate | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const estimate = useCallback(async (files: File[]) => {
    if (isEstimating || files.length === 0) return false;

    setError(null);
    setIsEstimating(true);
    try {
      const response = await estimateDocuments({ files, projectId });
      setResult(response);
      return true;
    } catch (cause) {
      setError(cause);
      return false;
    } finally {
      setIsEstimating(false);
    }
  }, [isEstimating, projectId]);

  return { result, error, isEstimating, estimate };
}
