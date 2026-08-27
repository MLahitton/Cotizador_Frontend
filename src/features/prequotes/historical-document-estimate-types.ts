export type HistoricalDocumentPricingStatus =
  | "PRICEABLE"
  | "NOT_PRICEABLE"
  | "TECHNICAL_FAILURE";

export interface HistoricalDocumentEstimateItem {
  elementId: number;
  reference: string | null;
  category: string | null;
  system: string | null;
  glass: string | null;
  configuration: string | null;
  widthMm: number | null;
  heightMm: number | null;
  areaM2: number | null;
  quantity: number | null;
  finish: string | null;
  pricingStatus: HistoricalDocumentPricingStatus;
  unitMinimum: number | null;
  unitExpected: number | null;
  unitMaximum: number | null;
  lineMinimum: number | null;
  lineExpected: number | null;
  lineMaximum: number | null;
  minimum: number | null;
  expected: number | null;
  maximum: number | null;
  confidenceScore: number | null;
  confidenceLevel: string | null;
  requiresReview: boolean;
  candidateCount: number | null;
  strongComparableCount: number | null;
  mappingWarnings: string[];
  assumptions: string[];
  missingData: string[];
}

export interface HistoricalDocumentEstimate {
  projectId: string | null;
  requirementId: string | null;
  sourceCount: number;
  extractedElementCount: number;
  itemCount: number;
  pricedItemCount: number;
  notPriceableItemCount: number;
  technicalFailureItemCount: number;
  currency: string | null;
  pricingBasis: string;
  minimum: number | null;
  expected: number | null;
  maximum: number | null;
  confidenceScore: number;
  confidenceLevel: string;
  isPartial: boolean;
  requiresReview: boolean;
  assumptions: string[];
  missingData: string[];
  warnings: string[];
  items: HistoricalDocumentEstimateItem[];
}

export interface EstimateDocumentsParameters {
  files: File[];
  projectId?: string;
  requirementId?: string;
}

export interface EstimatePreQuoteDocumentsParameters {
  preQuoteId: string;
  documentIds?: string[];
}
