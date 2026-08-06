import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import type {
  DocumentExtractionResultMetadata,
  DocumentProcessingAttemptSummary,
  DocumentProcessingAvailability,
  DocumentProcessingOutcome,
  DocumentProcessingState,
  PdfClassification,
} from "@/features/prequotes/prequote-documents-types";
import type {
  EvidenceSourceType,
  GlassAssignmentScope,
  GlassReviewReason,
  GlassValuationReason,
  GlassValuationStatus,
  RequirementCategory,
  StructuredConflict,
  StructuredConflictCode,
  StructuredDocument,
  StructuredDocumentExtractionDetailsResponse,
  StructuredDocumentReference,
  StructuredElementType,
  StructuredEvidence,
  StructuredExtractionDetails,
  StructuredExtractionStatus,
  StructuredIssue,
  StructuredIssueCode,
  StructuredItem,
  StructuredItemGlass,
  StructuredItemGlassValuation,
  StructuredProcessingMetadata,
  StructuredProject,
  StructuredRequirement,
  StructuredSummary,
} from "@/features/prequotes/structured-extraction-types";
import type {
  StructuredItemTechnicalClassification,
  TechnicalClassificationSource,
} from "@/features/prequotes/prequote-technical-types";
import { apiRequest } from "@/lib/http/api-client";

const INVALID_EXTRACTION_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar la extracción.";
const DOCUMENT_MISMATCH_DETAIL =
  "El documento solicitado no pertenece a esta precotización.";

const PROCESSING_AVAILABILITIES = [
  "NOT_PROCESSED",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "LEGACY_ONLY",
  "AVAILABLE_CURRENT",
  "AVAILABLE_PREVIOUS",
] as const;
const PROCESSING_STATES = ["PENDING", "PROCESSING", "FINISHED"] as const;
const PROCESSING_OUTCOMES = [
  "COMPLETED",
  "REQUIRES_REVIEW",
  "FAILED",
] as const;
const PDF_CLASSIFICATIONS = ["PDF_TEXT", "PDF_SCANNED", "PDF_MIXED"] as const;
const EVIDENCE_SOURCE_TYPES = ["NATIVE", "OCR"] as const;
const STRUCTURED_STATUSES = ["COMPLETED", "REQUIRES_REVIEW"] as const;
const GLASS_ASSIGNMENT_SCOPES = [
  "ITEM",
  "SECTION",
  "GENERAL",
  "UNASSIGNED",
] as const;
const GLASS_REVIEW_REASONS = [
  "GLASS_TYPE_NOT_IDENTIFIED",
  "GLASS_TYPE_AMBIGUOUS",
  "GLASS_TYPE_CONFLICT",
] as const;
const GLASS_VALUATION_STATUSES = ["VALUED", "NOT_VALUED"] as const;
const GLASS_VALUATION_REASONS = [
  "MISSING_MEASUREMENTS",
  "MISSING_QUANTITY",
  "GLASS_NOT_NORMALIZED",
  "GLASS_TYPE_NOT_RESOLVED",
  "PRICE_RANGE_NOT_AVAILABLE",
  "CURRENCY_MISMATCH",
] as const;
const ELEMENT_TYPES = [
  "WINDOW",
  "DOOR",
  "FACADE",
  "PARTITION",
  "RAILING",
  "SKYLIGHT",
  "SHOWER_DIVISION",
  "OTHER",
] as const;
const TECHNICAL_CLASSIFICATION_SOURCES = [
  "EXPLICIT",
  "ALIAS",
  "INFERRED",
  "UNRESOLVED",
] as const;
const REQUIREMENT_CATEGORIES = [
  "GLASS_SPECIFICATION",
  "PROFILE_SPECIFICATION",
  "FINISH",
  "ACCESSORIES_AND_SEALANTS",
  "GENERAL_NOTE",
] as const;
const ISSUE_CODES = [
  "PROJECT_NAME_NOT_FOUND",
  "NO_QUOTEABLE_ITEMS_FOUND",
  "INCOMPLETE_TABLE_ROW",
  "MISSING_ITEM_REFERENCE",
  "MISSING_OR_INVALID_MEASUREMENTS",
  "MISSING_OR_INVALID_QUANTITY",
  "UNKNOWN_ELEMENT_TYPE",
  "OCR_REVIEW_REQUIRED",
  "GLASS_TYPE_NOT_IDENTIFIED",
  "GLASS_TYPE_AMBIGUOUS",
  "GLASS_TYPE_CONFLICT",
] as const;
const CONFLICT_CODES = [
  "CONFLICTING_PROJECT_NAME",
  "CONFLICTING_CLIENT_NAME",
  "CONFLICTING_LOCATION",
  "DUPLICATE_ITEM_REFERENCE",
] as const;
const CONTRACT_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isStringIn<const T extends readonly string[]>(
  value: unknown,
  values: T,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isValidContractGuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = value.trim();

  return (
    CONTRACT_GUID_PATTERN.test(normalizedValue) &&
    normalizedValue.toLowerCase() !== EMPTY_GUID
  );
}

function isNullableContractGuid(value: unknown): value is string | null {
  return value === null || isValidContractGuid(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isPositiveNullableInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeNullableFiniteNumber(
  value: unknown,
): value is number | null {
  return value === null || isNonNegativeFiniteNumber(value);
}

function isValidDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNullableDateTime(value: unknown): value is string | null {
  return value === null || isValidDateTime(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isPositiveInteger);
}

function isProcessingAvailability(
  value: unknown,
): value is DocumentProcessingAvailability {
  return isStringIn(value, PROCESSING_AVAILABILITIES);
}

function isProcessingState(value: unknown): value is DocumentProcessingState {
  return isStringIn(value, PROCESSING_STATES);
}

function isProcessingOutcome(
  value: unknown,
): value is DocumentProcessingOutcome {
  return isStringIn(value, PROCESSING_OUTCOMES);
}

function isPdfClassification(value: unknown): value is PdfClassification {
  return isStringIn(value, PDF_CLASSIFICATIONS);
}

function isEvidenceSourceType(value: unknown): value is EvidenceSourceType {
  return isStringIn(value, EVIDENCE_SOURCE_TYPES);
}

function isStructuredStatus(value: unknown): value is StructuredExtractionStatus {
  return isStringIn(value, STRUCTURED_STATUSES);
}

function isGlassAssignmentScope(value: unknown): value is GlassAssignmentScope {
  return isStringIn(value, GLASS_ASSIGNMENT_SCOPES);
}

function isGlassReviewReason(value: unknown): value is GlassReviewReason {
  return isStringIn(value, GLASS_REVIEW_REASONS);
}

function isGlassValuationStatus(value: unknown): value is GlassValuationStatus {
  return isStringIn(value, GLASS_VALUATION_STATUSES);
}

function isGlassValuationReason(value: unknown): value is GlassValuationReason {
  return isStringIn(value, GLASS_VALUATION_REASONS);
}

function isTechnicalClassificationSource(
  value: unknown,
): value is TechnicalClassificationSource {
  return isStringIn(value, TECHNICAL_CLASSIFICATION_SOURCES);
}

function isElementType(value: unknown): value is StructuredElementType {
  return isStringIn(value, ELEMENT_TYPES);
}

function isRequirementCategory(value: unknown): value is RequirementCategory {
  return isStringIn(value, REQUIREMENT_CATEGORIES);
}

function isIssueCode(value: unknown): value is StructuredIssueCode {
  return isStringIn(value, ISSUE_CODES);
}

function isConflictCode(value: unknown): value is StructuredConflictCode {
  return isStringIn(value, CONFLICT_CODES);
}

function isResultMetadata(
  value: unknown,
): value is DocumentExtractionResultMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.schemaVersion) &&
    isPdfClassification(value.classification) &&
    typeof value.requiresOcr === "boolean" &&
    isPositiveInteger(value.pageCount) &&
    isNonEmptyString(value.processingMethod) &&
    isNonNegativeInteger(value.durationMs)
  );
}

function isLatestAttempt(
  value: unknown,
): value is DocumentProcessingAttemptSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.processingAttemptId === "string" &&
    isValidPreQuoteId(value.processingAttemptId) &&
    isProcessingState(value.processingState) &&
    (value.outcome === null || isProcessingOutcome(value.outcome)) &&
    (value.errorCode === null || typeof value.errorCode === "string") &&
    isValidDateTime(value.createdAtUtc) &&
    isNullableDateTime(value.startedAtUtc) &&
    isNullableDateTime(value.completedAtUtc) &&
    (value.resultMetadata === null || isResultMetadata(value.resultMetadata))
  );
}

function isEvidence(value: unknown): value is StructuredEvidence {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.pageNumber) &&
    isEvidenceSourceType(value.sourceType) &&
    isNonEmptyString(value.text)
  );
}

function isEvidenceArray(value: unknown): value is StructuredEvidence[] {
  return Array.isArray(value) && value.every(isEvidence);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableTechnicalClassificationSource(
  value: unknown,
): value is TechnicalClassificationSource | null {
  return value === null || isTechnicalClassificationSource(value);
}

function isStructuredItemTechnicalClassification(
  value: unknown,
): value is StructuredItemTechnicalClassification {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.systemCode) &&
    isNullableString(value.systemOriginalText) &&
    isNullableTechnicalClassificationSource(value.systemSource) &&
    isNonNegativeNullableFiniteNumber(value.systemConfidence) &&
    isNullableString(value.frameCode) &&
    isNullableString(value.frameOriginalText) &&
    isNullableTechnicalClassificationSource(value.frameSource) &&
    isNonNegativeNullableFiniteNumber(value.frameConfidence) &&
    isNullableString(value.finishCode) &&
    isNullableString(value.finishOriginalText) &&
    isNullableTechnicalClassificationSource(value.finishSource) &&
    isNonNegativeNullableFiniteNumber(value.finishConfidence) &&
    typeof value.requiresReview === "boolean" &&
    isStringArray(value.reviewReasons)
  );
}

function isStructuredItemGlass(value: unknown): value is StructuredItemGlass {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableContractGuid(value.glassTypeId) &&
    (value.rawSpecification === null ||
      isNonEmptyString(value.rawSpecification)) &&
    (value.normalizedCode === null || isNonEmptyString(value.normalizedCode)) &&
    isGlassAssignmentScope(value.assignmentScope) &&
    typeof value.requiresReview === "boolean" &&
    Array.isArray(value.reviewReasons) &&
    value.reviewReasons.every(isGlassReviewReason) &&
    isNumberArray(value.sourcePages) &&
    isEvidenceArray(value.evidence)
  );
}

function isStructuredItemGlassValuation(
  value: unknown,
): value is StructuredItemGlassValuation {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !(
      isGlassValuationStatus(value.status) &&
      (value.reason === null || isGlassValuationReason(value.reason)) &&
      isNullableContractGuid(value.glassTypeId) &&
      isNullableContractGuid(value.glassPriceRangeVersionId) &&
      (value.priceRangeVersion === null ||
        isPositiveInteger(value.priceRangeVersion)) &&
      (value.priceRangeStatus === null ||
        isNonEmptyString(value.priceRangeStatus)) &&
      (value.currency === null || isNonEmptyString(value.currency)) &&
      isNonNegativeNullableFiniteNumber(value.unitAreaSquareMeters) &&
      isNonNegativeNullableFiniteNumber(value.totalAreaSquareMeters) &&
      isNonNegativeNullableFiniteNumber(value.minimumPricePerSquareMeter) &&
      isNonNegativeNullableFiniteNumber(value.expectedPricePerSquareMeter) &&
      isNonNegativeNullableFiniteNumber(value.maximumPricePerSquareMeter) &&
      isNonNegativeNullableFiniteNumber(value.minimumAmount) &&
      isNonNegativeNullableFiniteNumber(value.expectedAmount) &&
      isNonNegativeNullableFiniteNumber(value.maximumAmount) &&
      isValidDateTime(value.calculatedAtUtc)
    )
  ) {
    return false;
  }

  if (
    value.minimumPricePerSquareMeter !== null &&
    value.maximumPricePerSquareMeter !== null &&
    value.minimumPricePerSquareMeter > value.maximumPricePerSquareMeter
  ) {
    return false;
  }

  if (
    value.minimumPricePerSquareMeter !== null &&
    value.expectedPricePerSquareMeter !== null &&
    value.minimumPricePerSquareMeter > value.expectedPricePerSquareMeter
  ) {
    return false;
  }

  if (
    value.expectedPricePerSquareMeter !== null &&
    value.maximumPricePerSquareMeter !== null &&
    value.expectedPricePerSquareMeter > value.maximumPricePerSquareMeter
  ) {
    return false;
  }

  if (
    value.minimumAmount !== null &&
    value.maximumAmount !== null &&
    value.minimumAmount > value.maximumAmount
  ) {
    return false;
  }

  if (
    value.minimumAmount !== null &&
    value.expectedAmount !== null &&
    value.minimumAmount > value.expectedAmount
  ) {
    return false;
  }

  return !(
    value.expectedAmount !== null &&
    value.maximumAmount !== null &&
    value.expectedAmount > value.maximumAmount
  );
}

function isStructuredProject(value: unknown): value is StructuredProject {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNullableString(value.name) &&
    isNullableString(value.clientName) &&
    isNullableString(value.location) &&
    isNumberArray(value.sourcePages) &&
    isEvidenceArray(value.evidence)
  );
}

function isRequirement(value: unknown): value is StructuredRequirement {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.sequence) &&
    isRequirementCategory(value.category) &&
    isNonEmptyString(value.value) &&
    isEvidenceArray(value.evidence)
  );
}

function isItem(value: unknown): value is StructuredItem {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !(
      !("glass" in value) ||
      value.glass === null ||
      isStructuredItemGlass(value.glass)
    )
  ) {
    return false;
  }

  if (
    !(
      !("valuation" in value) ||
      value.valuation === null ||
      isStructuredItemGlassValuation(value.valuation)
    )
  ) {
    return false;
  }

  if (
    !(
      !("technicalClassification" in value) ||
      value.technicalClassification === null ||
      isStructuredItemTechnicalClassification(value.technicalClassification)
    )
  ) {
    return false;
  }

  return (
    isPositiveInteger(value.sequence) &&
    isNullableString(value.reference) &&
    isNonEmptyString(value.description) &&
    isElementType(value.elementType) &&
    isNullableString(value.rawMeasurements) &&
    isPositiveNullableInteger(value.widthMillimeters) &&
    isPositiveNullableInteger(value.heightMillimeters) &&
    isPositiveNullableInteger(value.quantity) &&
    typeof value.requiresReview === "boolean" &&
    Array.isArray(value.reviewReasons) &&
    value.reviewReasons.every(isNonEmptyString) &&
    isNumberArray(value.sourcePages) &&
    isEvidenceArray(value.evidence)
  );
}

function isDocumentReference(
  value: unknown,
): value is StructuredDocumentReference {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.sequence) &&
    isNullableString(value.reference) &&
    isNonEmptyString(value.description) &&
    isNullableString(value.detail) &&
    isPositiveNullableInteger(value.quantity) &&
    isNumberArray(value.sourcePages) &&
    isEvidenceArray(value.evidence)
  );
}

function isIssue(value: unknown): value is StructuredIssue {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.sequence) &&
    isIssueCode(value.code) &&
    isNonEmptyString(value.message) &&
    (value.itemSequence === null || isPositiveInteger(value.itemSequence)) &&
    isNumberArray(value.pageNumbers)
  );
}

function isConflict(value: unknown): value is StructuredConflict {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPositiveInteger(value.sequence) &&
    isConflictCode(value.code) &&
    isNonEmptyString(value.message) &&
    isNumberArray(value.itemSequences) &&
    isNumberArray(value.pageNumbers)
  );
}

function isSummary(value: unknown): value is StructuredSummary {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !(
      isNonNegativeInteger(value.itemCount) &&
      isNonNegativeInteger(value.documentReferenceCount) &&
      isNonNegativeInteger(value.itemsRequiringReview) &&
      isNonNegativeInteger(value.knownQuoteableUnitCount) &&
      isNonNegativeInteger(value.issueCount) &&
      isNonNegativeInteger(value.conflictCount)
    )
  ) {
    return false;
  }

  if (
    "identifiedGlassItemCount" in value &&
    !(
      value.identifiedGlassItemCount === null ||
      (isNonNegativeInteger(value.identifiedGlassItemCount) &&
        value.identifiedGlassItemCount <= value.itemCount)
    )
  ) {
    return false;
  }

  if (
    "glassItemsRequiringReview" in value &&
    !(
      value.glassItemsRequiringReview === null ||
      (isNonNegativeInteger(value.glassItemsRequiringReview) &&
        value.glassItemsRequiringReview <= value.itemCount)
    )
  ) {
    return false;
  }

  if (
    "valuedItemCount" in value &&
    !(
      isNonNegativeInteger(value.valuedItemCount) &&
      value.valuedItemCount <= value.itemCount
    )
  ) {
    return false;
  }

  if (
    "notValuedItemCount" in value &&
    !(
      isNonNegativeInteger(value.notValuedItemCount) &&
      value.notValuedItemCount <= value.itemCount
    )
  ) {
    return false;
  }

  if (
    "valuedItemCount" in value &&
    "notValuedItemCount" in value &&
    isNonNegativeInteger(value.valuedItemCount) &&
    isNonNegativeInteger(value.notValuedItemCount) &&
    value.valuedItemCount + value.notValuedItemCount > value.itemCount
  ) {
    return false;
  }

  if (
    "totalGlassAreaSquareMeters" in value &&
    !isNonNegativeFiniteNumber(value.totalGlassAreaSquareMeters)
  ) {
    return false;
  }

  if (
    "minimumGlassAmount" in value &&
    !isNonNegativeNullableFiniteNumber(value.minimumGlassAmount)
  ) {
    return false;
  }

  if (
    "maximumGlassAmount" in value &&
    !isNonNegativeNullableFiniteNumber(value.maximumGlassAmount)
  ) {
    return false;
  }

  if (
    "minimumGlassAmount" in value &&
    "maximumGlassAmount" in value &&
    value.minimumGlassAmount !== null &&
    value.maximumGlassAmount !== null &&
    isNonNegativeFiniteNumber(value.minimumGlassAmount) &&
    isNonNegativeFiniteNumber(value.maximumGlassAmount) &&
    value.minimumGlassAmount > value.maximumGlassAmount
  ) {
    return false;
  }

  if (
    "currency" in value &&
    !(value.currency === null || isNonEmptyString(value.currency))
  ) {
    return false;
  }

  if ("isAggregable" in value && typeof value.isAggregable !== "boolean") {
    return false;
  }

  return !(
    "aggregationIssue" in value &&
    !(value.aggregationIssue === null || isNonEmptyString(value.aggregationIssue))
  );
}

function isProcessingMetadata(
  value: unknown,
): value is StructuredProcessingMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return isNonEmptyString(value.method) && isNonNegativeInteger(value.durationMs);
}

function isConsecutiveSequence<T extends { sequence: number }>(
  values: T[],
): boolean {
  return values.every((value, index) => value.sequence === index + 1);
}

function isStructuredExtraction(
  value: unknown,
): value is StructuredExtractionDetails {
  if (
    !isRecord(value) ||
    !Array.isArray(value.requirements) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.documentReferences) ||
    !Array.isArray(value.issues) ||
    !Array.isArray(value.conflicts)
  ) {
    return false;
  }

  if (
    !(
      typeof value.structuredExtractionId === "string" &&
      isValidPreQuoteId(value.structuredExtractionId) &&
      typeof value.sourceProcessingAttemptId === "string" &&
      isValidPreQuoteId(value.sourceProcessingAttemptId) &&
      typeof value.isFromLatestAttempt === "boolean" &&
      isStructuredStatus(value.status) &&
      isStructuredProject(value.project) &&
      value.requirements.every(isRequirement) &&
      value.items.every(isItem) &&
      value.documentReferences.every(isDocumentReference) &&
      value.issues.every(isIssue) &&
      value.conflicts.every(isConflict) &&
      isSummary(value.summary) &&
      isProcessingMetadata(value.processingMetadata) &&
      isValidDateTime(value.createdAtUtc)
    )
  ) {
    return false;
  }

  return (
    isConsecutiveSequence(value.requirements) &&
    isConsecutiveSequence(value.items) &&
    isConsecutiveSequence(value.documentReferences) &&
    isConsecutiveSequence(value.issues) &&
    isConsecutiveSequence(value.conflicts) &&
    value.summary.itemCount === value.items.length &&
    value.summary.documentReferenceCount === value.documentReferences.length &&
    value.summary.itemsRequiringReview ===
      value.items.filter((item) => item.requiresReview).length &&
    value.summary.knownQuoteableUnitCount ===
      value.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0) &&
    value.summary.issueCount === value.issues.length &&
    value.summary.conflictCount === value.conflicts.length
  );
}

function isDocument(
  value: unknown,
  documentId: string,
  preQuoteId: string,
): value is StructuredDocument {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.documentId === "string" &&
    isValidPreQuoteId(value.documentId) &&
    idsMatch(value.documentId, documentId) &&
    typeof value.preQuoteId === "string" &&
    isValidPreQuoteId(value.preQuoteId) &&
    idsMatch(value.preQuoteId, preQuoteId) &&
    isNonEmptyString(value.originalFileName) &&
    isNonEmptyString(value.contentType) &&
    isPositiveInteger(value.sizeBytes) &&
    isValidDateTime(value.createdAtUtc)
  );
}

function isResponse(
  value: unknown,
  documentId: string,
  preQuoteId: string,
): value is StructuredDocumentExtractionDetailsResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isDocument(value.document, documentId, preQuoteId) &&
    isProcessingAvailability(value.processingAvailability) &&
    (value.latestAttempt === null || isLatestAttempt(value.latestAttempt)) &&
    (value.structuredExtraction === null ||
      isStructuredExtraction(value.structuredExtraction))
  );
}

export class InvalidStructuredExtractionResponseError extends Error {
  constructor() {
    super(INVALID_EXTRACTION_RESPONSE_DETAIL);
    this.name = "InvalidStructuredExtractionResponseError";
  }
}

export class StructuredDocumentPreQuoteMismatchError extends Error {
  constructor() {
    super(DOCUMENT_MISMATCH_DETAIL);
    this.name = "StructuredDocumentPreQuoteMismatchError";
  }
}

export function isInvalidStructuredExtractionResponseError(
  error: unknown,
): error is InvalidStructuredExtractionResponseError {
  return error instanceof InvalidStructuredExtractionResponseError;
}

export function isStructuredDocumentMismatchError(
  error: unknown,
): error is StructuredDocumentPreQuoteMismatchError {
  return error instanceof StructuredDocumentPreQuoteMismatchError;
}

export async function getStructuredDocumentExtraction(
  documentId: string,
  preQuoteId: string,
): Promise<StructuredDocumentExtractionDetailsResponse> {
  const response = await apiRequest(
    `/api/v1/prequote-documents/${encodeURIComponent(documentId)}/structured-extraction`,
    { authenticated: true },
  );

  if (!isResponse(response, documentId, preQuoteId)) {
    if (
      isRecord(response) &&
      isRecord(response.document) &&
      typeof response.document.preQuoteId === "string" &&
      isValidPreQuoteId(response.document.preQuoteId) &&
      !idsMatch(response.document.preQuoteId, preQuoteId)
    ) {
      throw new StructuredDocumentPreQuoteMismatchError();
    }

    throw new InvalidStructuredExtractionResponseError();
  }

  return response;
}
