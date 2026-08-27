"use client";

import { useCallback, useState } from "react";

import { estimatePreQuoteDocuments } from "@/features/prequotes/historical-document-estimate-api";
import type { HistoricalDocumentEstimate } from "@/features/prequotes/historical-document-estimate-types";

export function useHistoricalDocumentEstimate(preQuoteId: string) {
  const [result, setResult] = useState<HistoricalDocumentEstimate | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const estimate = useCallback(async (documentIds?: string[]) => {
    if (isEstimating) return false;

    setError(null);
    setIsEstimating(true);
    try {
      const response = await estimatePreQuoteDocuments({
        preQuoteId,
        documentIds,
      });
      setResult(response);
      return true;
    } catch (cause) {
      setError(cause);
      return false;
    } finally {
      setIsEstimating(false);
    }
  }, [isEstimating, preQuoteId]);

  return { result, error, isEstimating, estimate };
}
