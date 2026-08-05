export type PreQuoteDraftStatus =
  | "PENDING_REVIEW"
  | "IN_REVIEW"
  | "APPROVED";

export type PreQuoteDraftOrigin = "AI" | "MANUAL";

export type PreQuoteDraftResolutionStatus =
  | "PENDING"
  | "RESOLVED"
  | "DISMISSED";

export type PreQuoteDraftValuationStatus =
  | "PENDING"
  | "VALUED"
  | "STALE"
  | "REQUIRES_REVIEW";

export type PreQuoteDraftElementType =
  | "WINDOW"
  | "DOOR"
  | "FACADE"
  | "PARTITION"
  | "RAILING"
  | "SKYLIGHT"
  | "OTHER";

export type PreQuoteDraftGlassAssignmentScope =
  | "ITEM"
  | "SECTION"
  | "GENERAL"
  | "UNASSIGNED";

export type PreQuoteDraftGlassReviewReason =
  | "GLASS_TYPE_NOT_IDENTIFIED"
  | "GLASS_TYPE_AMBIGUOUS"
  | "GLASS_TYPE_CONFLICT";

export type PreQuoteDraftEvidenceSourceType = "NATIVE" | "OCR";

export type PreQuoteDraftValuationReason =
  | "MISSING_MEASUREMENTS"
  | "MISSING_QUANTITY"
  | "GLASS_NOT_NORMALIZED"
  | "GLASS_TYPE_NOT_RESOLVED"
  | "PRICE_RANGE_NOT_AVAILABLE"
  | "CURRENCY_MISMATCH";

export type PreQuoteDraftValuationInvalidationReason =
  | "MULTIPLE_INPUTS_CHANGED"
  | "WIDTH_CHANGED"
  | "HEIGHT_CHANGED"
  | "QUANTITY_CHANGED";

export type PreQuoteDraftRequirementCategory =
  | "GLASS_SPECIFICATION"
  | "PROFILE_SPECIFICATION"
  | "FINISH"
  | "ACCESSORIES_AND_SEALANTS"
  | "GENERAL_NOTE";

export interface CreatePreQuoteDraftRequest {
  sourceDocumentId: string;
  sourceStructuredExtractionId: string;
}

export interface UpdatePreQuoteDraftProjectRequest {
  name: string | null;
  clientName: string | null;
  location: string | null;
}

export interface UpdatePreQuoteDraftItemRequest {
  draftItemId: string | null;
  sequence: number;
  reference: string | null;
  description: string;
  elementType: PreQuoteDraftElementType;
  rawMeasurements: string | null;
  widthMillimeters: number | null;
  heightMillimeters: number | null;
  quantity: number | null;
  isIncluded: boolean;
}

export interface UpdatePreQuoteDraftRequirementRequest {
  draftRequirementId: string | null;
  sequence: number;
  category: PreQuoteDraftRequirementCategory;
  value: string;
  isIncluded: boolean;
}

export interface UpdatePreQuoteDraftDocumentReferenceRequest {
  draftDocumentReferenceId: string | null;
  sequence: number;
  reference: string | null;
  description: string;
  detail: string | null;
  quantity: number | null;
  isIncluded: boolean;
}

export interface UpdatePreQuoteDraftIssueResolutionRequest {
  draftIssueId: string;
  resolutionStatus: PreQuoteDraftResolutionStatus;
  resolutionNote: string | null;
}

export interface UpdatePreQuoteDraftConflictResolutionRequest {
  draftConflictId: string;
  resolutionStatus: PreQuoteDraftResolutionStatus;
  resolutionNote: string | null;
}

export interface UpdatePreQuoteDraftRequest {
  expectedVersion: number;
  project: UpdatePreQuoteDraftProjectRequest;
  items: UpdatePreQuoteDraftItemRequest[];
  requirements: UpdatePreQuoteDraftRequirementRequest[];
  documentReferences: UpdatePreQuoteDraftDocumentReferenceRequest[];
  issues: UpdatePreQuoteDraftIssueResolutionRequest[];
  conflicts: UpdatePreQuoteDraftConflictResolutionRequest[];
}

export interface PreQuoteDraftItemGlassEvidence {
  sequence: number;
  pageNumber: number;
  sourceType: PreQuoteDraftEvidenceSourceType;
  text: string;
}

export interface PreQuoteDraftItemGlass {
  sourceStructuredItemGlassId: string | null;
  glassTypeId: string | null;
  rawSpecification: string | null;
  normalizedCodeSnapshot: string | null;
  assignmentScope: PreQuoteDraftGlassAssignmentScope;
  requiresReview: boolean;
  reviewReasons: PreQuoteDraftGlassReviewReason[];
  sourcePages: number[];
  evidence: PreQuoteDraftItemGlassEvidence[];
}

export interface PreQuoteDraftItemValuation {
  sourceStructuredItemValuationId: string;
  status: PreQuoteDraftValuationStatus;
  reason: PreQuoteDraftValuationReason | null;
  glassTypeId: string | null;
  glassPriceRangeVersionId: string | null;
  widthMillimetersUsed: number | null;
  heightMillimetersUsed: number | null;
  quantityUsed: number | null;
  unitAreaSquareMeters: number | null;
  totalAreaSquareMeters: number | null;
  unitPricePerSquareMeter: number | null;
  unitAmount: number | null;
  totalAmount: number | null;
  currency: string | null;
  valuedAtUtc: string;
  invalidatedAtUtc: string | null;
  invalidationReason: PreQuoteDraftValuationInvalidationReason | null;
}

export interface PreQuoteDraftItem {
  id: string;
  sequence: number;
  origin: PreQuoteDraftOrigin;
  sourceStructuredItemId: string | null;
  sourceItemSequence: number | null;
  sourceSequence: number | null;
  reference: string | null;
  description: string;
  elementType: PreQuoteDraftElementType;
  rawMeasurements: string | null;
  widthMillimeters: number | null;
  heightMillimeters: number | null;
  quantity: number | null;
  isIncluded: boolean;
  glass: PreQuoteDraftItemGlass | null;
  valuation: PreQuoteDraftItemValuation | null;
}

export interface PreQuoteDraftRequirement {
  draftRequirementId: string;
  sequence: number;
  origin: PreQuoteDraftOrigin;
  sourceSequence: number | null;
  category: PreQuoteDraftRequirementCategory;
  value: string;
  isIncluded: boolean;
}

export interface PreQuoteDraftDocumentReference {
  draftDocumentReferenceId: string;
  sequence: number;
  origin: PreQuoteDraftOrigin;
  sourceSequence: number | null;
  reference: string | null;
  description: string;
  detail: string | null;
  quantity: number | null;
  isIncluded: boolean;
}

export interface PreQuoteDraftIssue {
  draftIssueId: string;
  sequence: number;
  sourceSequence: number | null;
  code: string;
  message: string;
  itemSequence: number | null;
  pageNumbers: number[];
  resolutionStatus: PreQuoteDraftResolutionStatus;
  resolutionNote: string | null;
  resolvedByUserId: string | null;
  resolvedAtUtc: string | null;
}

export interface PreQuoteDraftConflict {
  draftConflictId: string;
  sequence: number;
  sourceSequence: number;
  code: string;
  message: string;
  itemSequences: number[];
  pageNumbers: number[];
  resolutionStatus: PreQuoteDraftResolutionStatus;
  resolutionNote: string | null;
  resolvedByUserId: string | null;
  resolvedAtUtc: string | null;
}

export interface PreQuoteDraftEconomicSummary {
  includedItemCount: number;
  includedKnownQuoteableUnitCount: number;
  valuedItemCount: number;
  pendingValuationItemCount: number;
  staleValuationItemCount: number;
  itemsRequiringReviewCount: number;
  totalAreaSquareMeters: number | null;
  glassSubtotal: number | null;
  currency: string | null;
  isEconomicallyComplete: boolean;
}

export interface PreQuoteDraftSummary {
  totalItemCount: number;
  includedItemCount: number;
  excludedItemCount: number;
  manualItemCount: number;
  itemsRequiringCompletion: number;
  includedKnownQuoteableUnitCount: number;
  totalRequirementCount: number;
  includedRequirementCount: number;
  totalDocumentReferenceCount: number;
  includedDocumentReferenceCount: number;
  pendingIssueCount: number;
  resolvedIssueCount: number;
  dismissedIssueCount: number;
  pendingConflictCount: number;
  resolvedConflictCount: number;
  dismissedConflictCount: number;
}

export interface PreQuoteDraftAudit {
  createdByUserId: string;
  updatedByUserId: string;
  approvedByUserId: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  approvedAtUtc: string | null;
}

export interface PreQuoteDraftDetails {
  id: string;
  preQuoteId: string;
  sourceDocumentId: string;
  sourceStructuredExtractionId: string;
  status: PreQuoteDraftStatus;
  version: number;
  projectName: string | null;
  clientName: string | null;
  location: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  approvedAtUtc: string | null;
  items: PreQuoteDraftItem[];
  requirements: PreQuoteDraftRequirement[];
  documentReferences: PreQuoteDraftDocumentReference[];
  issues: PreQuoteDraftIssue[];
  conflicts: PreQuoteDraftConflict[];
  economicSummary: PreQuoteDraftEconomicSummary;
  summary: PreQuoteDraftSummary | null;
  audit: PreQuoteDraftAudit | null;
}

export interface PreQuoteDraftLoadError {
  cause: unknown;
}

export interface CreatePreQuoteDraftError {
  cause: unknown;
}

export interface UpdatePreQuoteDraftError {
  cause: unknown;
}

export type CreatePreQuoteDraftResult =
  | { status: "created"; draft: PreQuoteDraftDetails }
  | { status: "already-exists" }
  | { status: "failed" }
  | { status: "ignored" }
  | { status: "stale" };

export type UpdatePreQuoteDraftResult =
  | { status: "updated"; draft: PreQuoteDraftDetails }
  | { status: "version-conflict" }
  | { status: "already-approved" }
  | { status: "failed" }
  | { status: "ignored" }
  | { status: "stale" };
