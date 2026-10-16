export type QuantityExtractionStatus =
  | "EXPLICIT"
  | "INFERRED"
  | "AMBIGUOUS"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export function isQuantityExtractionStatus(value: unknown): value is QuantityExtractionStatus | null {
  return value === null || ["EXPLICIT", "INFERRED", "AMBIGUOUS", "UNKNOWN", "NOT_APPLICABLE"].includes(String(value));
}

export function hasUncertainExtractedQuantity(item: {
  quantitySource: string | null;
  quantityExtractionStatus: QuantityExtractionStatus | null;
}): boolean {
  return item.quantitySource === "EXTRACTED" &&
    (item.quantityExtractionStatus === "AMBIGUOUS" || item.quantityExtractionStatus === "UNKNOWN");
}

export function isQuantityReviewReason(reason: string): boolean {
  return ["QUANTITY_ASSUMED", "QUANTITY_AMBIGUOUS", "QUANTITY_UNKNOWN"].includes(reason);
}
