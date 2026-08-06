export type TechnicalClassificationSource =
  | "EXPLICIT"
  | "ALIAS"
  | "INFERRED"
  | "UNRESOLVED";

export type PreQuotePricingConfidenceLevel = "LOW" | "MEDIUM" | "GOOD" | "HIGH";

export interface StructuredItemTechnicalClassification {
  systemCode: string | null;
  systemOriginalText: string | null;
  systemSource: TechnicalClassificationSource | null;
  systemConfidence: number | null;
  frameCode: string | null;
  frameOriginalText: string | null;
  frameSource: TechnicalClassificationSource | null;
  frameConfidence: number | null;
  finishCode: string | null;
  finishOriginalText: string | null;
  finishSource: TechnicalClassificationSource | null;
  finishConfidence: number | null;
  requiresReview: boolean;
  reviewReasons: string[];
}

export interface PreQuoteDraftItemTechnicalSnapshot
  extends StructuredItemTechnicalClassification {
  sourceStructuredItemTechnicalClassificationId: string;
}
