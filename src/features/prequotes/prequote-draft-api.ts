import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import type {
  CreatePreQuoteDraftRequest,
  PreQuoteDraftAudit,
  PreQuoteDraftConflict,
  PreQuoteDraftDetails,
  PreQuoteDraftDocumentReference,
  PreQuoteDraftEconomicSummary,
  PreQuoteDraftEvidenceSourceType,
  PreQuoteDraftGlassAssignmentScope,
  PreQuoteDraftGlassReviewReason,
  PreQuoteDraftIssue,
  PreQuoteDraftItem,
  PreQuoteDraftItemGlass,
  PreQuoteDraftItemGlassEvidence,
  PreQuoteDraftItemValuation,
  PreQuoteDraftRequirement,
  PreQuoteDraftSummary,
  PreQuoteDraftValuationInvalidationReason,
  PreQuoteDraftValuationReason,
  UpdatePreQuoteDraftRequest,
} from "@/features/prequotes/prequote-draft-types";
import { apiRequest } from "@/lib/http/api-client";

const INVALID_DRAFT_RESPONSE_MESSAGE =
  "El servidor devolvió una respuesta inesperada al consultar el borrador.";
const INVALID_CREATE_DRAFT_RESPONSE_MESSAGE =
  "El servidor devolvió una respuesta inesperada al crear el borrador.";

const INVALID_UPDATE_DRAFT_RESPONSE_MESSAGE =
  "El servidor devolvio una respuesta inesperada al actualizar el borrador.";

const CONTRACT_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const DRAFT_STATUSES = ["PENDING_REVIEW", "IN_REVIEW", "APPROVED"] as const;
const ORIGINS = ["AI", "MANUAL"] as const;
const RESOLUTION_STATUSES = ["PENDING", "RESOLVED", "DISMISSED"] as const;
const VALUATION_STATUSES = [
  "PENDING",
  "VALUED",
  "STALE",
  "REQUIRES_REVIEW",
] as const;
const ELEMENT_TYPES = [
  "WINDOW",
  "DOOR",
  "FACADE",
  "PARTITION",
  "RAILING",
  "SKYLIGHT",
  "OTHER",
] as const;
const REQUIREMENT_CATEGORIES = [
  "GLASS_SPECIFICATION",
  "PROFILE_SPECIFICATION",
  "FINISH",
  "ACCESSORIES_AND_SEALANTS",
  "GENERAL_NOTE",
] as const;

const ASSIGNMENT_SCOPE_ALIASES = {
  ITEM: "ITEM",
  Item: "ITEM",
  SECTION: "SECTION",
  Section: "SECTION",
  GENERAL: "GENERAL",
  General: "GENERAL",
  UNASSIGNED: "UNASSIGNED",
  Unassigned: "UNASSIGNED",
} as const satisfies Record<string, PreQuoteDraftGlassAssignmentScope>;

const REVIEW_REASON_ALIASES = {
  GLASS_TYPE_NOT_IDENTIFIED: "GLASS_TYPE_NOT_IDENTIFIED",
  GlassTypeNotIdentified: "GLASS_TYPE_NOT_IDENTIFIED",
  GLASS_TYPE_AMBIGUOUS: "GLASS_TYPE_AMBIGUOUS",
  GlassTypeAmbiguous: "GLASS_TYPE_AMBIGUOUS",
  GLASS_TYPE_CONFLICT: "GLASS_TYPE_CONFLICT",
  GlassTypeConflict: "GLASS_TYPE_CONFLICT",
} as const satisfies Record<string, PreQuoteDraftGlassReviewReason>;

const EVIDENCE_SOURCE_ALIASES = {
  NATIVE: "NATIVE",
  Native: "NATIVE",
  OCR: "OCR",
  Ocr: "OCR",
} as const satisfies Record<string, PreQuoteDraftEvidenceSourceType>;

const VALUATION_REASON_ALIASES = {
  MISSING_MEASUREMENTS: "MISSING_MEASUREMENTS",
  MissingMeasurements: "MISSING_MEASUREMENTS",
  MISSING_QUANTITY: "MISSING_QUANTITY",
  MissingQuantity: "MISSING_QUANTITY",
  GLASS_NOT_NORMALIZED: "GLASS_NOT_NORMALIZED",
  GlassNotNormalized: "GLASS_NOT_NORMALIZED",
  GLASS_TYPE_NOT_RESOLVED: "GLASS_TYPE_NOT_RESOLVED",
  GlassTypeNotResolved: "GLASS_TYPE_NOT_RESOLVED",
  PRICE_RANGE_NOT_AVAILABLE: "PRICE_RANGE_NOT_AVAILABLE",
  PriceRangeNotAvailable: "PRICE_RANGE_NOT_AVAILABLE",
  CURRENCY_MISMATCH: "CURRENCY_MISMATCH",
  CurrencyMismatch: "CURRENCY_MISMATCH",
} as const satisfies Record<string, PreQuoteDraftValuationReason>;

const INVALIDATION_REASON_ALIASES = {
  MULTIPLE_INPUTS_CHANGED: "MULTIPLE_INPUTS_CHANGED",
  MultipleInputsChanged: "MULTIPLE_INPUTS_CHANGED",
  WIDTH_CHANGED: "WIDTH_CHANGED",
  WidthChanged: "WIDTH_CHANGED",
  HEIGHT_CHANGED: "HEIGHT_CHANGED",
  HeightChanged: "HEIGHT_CHANGED",
  QUANTITY_CHANGED: "QUANTITY_CHANGED",
  QuantityChanged: "QUANTITY_CHANGED",
} as const satisfies Record<string, PreQuoteDraftValuationInvalidationReason>;

export class InvalidPreQuoteDraftResponseError extends Error {
  constructor() {
    super(INVALID_DRAFT_RESPONSE_MESSAGE);
    this.name = "InvalidPreQuoteDraftResponseError";
  }
}

export class InvalidCreatePreQuoteDraftResponseError extends Error {
  constructor() {
    super(INVALID_CREATE_DRAFT_RESPONSE_MESSAGE);
    this.name = "InvalidCreatePreQuoteDraftResponseError";
  }
}

export class InvalidUpdatePreQuoteDraftResponseError extends Error {
  constructor() {
    super(INVALID_UPDATE_DRAFT_RESPONSE_MESSAGE);
    this.name = "InvalidUpdatePreQuoteDraftResponseError";
  }
}

export function isInvalidPreQuoteDraftResponseError(
  error: unknown,
): error is InvalidPreQuoteDraftResponseError {
  return error instanceof InvalidPreQuoteDraftResponseError;
}

export function isInvalidCreatePreQuoteDraftResponseError(
  error: unknown,
): error is InvalidCreatePreQuoteDraftResponseError {
  return error instanceof InvalidCreatePreQuoteDraftResponseError;
}

export function isInvalidUpdatePreQuoteDraftResponseError(
  error: unknown,
): error is InvalidUpdatePreQuoteDraftResponseError {
  return error instanceof InvalidUpdatePreQuoteDraftResponseError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringIn<const T extends readonly string[]>(
  value: unknown,
  values: T,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function normalizeFromAliases<T extends string>(
  value: unknown,
  aliases: Record<string, T>,
): T | null {
  if (typeof value !== "string") {
    return null;
  }

  return aliases[value] ?? null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveNullableInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isValidDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNullableDateTime(value: unknown): value is string | null {
  return value === null || isValidDateTime(value);
}

function isValidContractGuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();
  return (
    CONTRACT_GUID_PATTERN.test(trimmedValue) &&
    trimmedValue.toLowerCase() !== EMPTY_GUID
  );
}

function isNullableContractGuid(value: unknown): value is string | null {
  return value === null || isValidContractGuid(value);
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isPositiveIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isPositiveInteger);
}

function isConsecutiveSequence<T extends { sequence: number }>(
  values: T[],
): boolean {
  return values.every((value, index) => value.sequence === index + 1);
}

function normalizeEvidence(value: unknown): PreQuoteDraftItemGlassEvidence | null {
  if (!isRecord(value)) {
    return null;
  }

  const sourceType = normalizeFromAliases(value.sourceType, EVIDENCE_SOURCE_ALIASES);

  if (
    !isPositiveInteger(value.sequence) ||
    !isPositiveInteger(value.pageNumber) ||
    !sourceType ||
    !isNonEmptyString(value.text)
  ) {
    return null;
  }

  return {
    sequence: value.sequence,
    pageNumber: value.pageNumber,
    sourceType,
    text: value.text,
  };
}

function normalizeEvidenceArray(
  value: unknown,
): PreQuoteDraftItemGlassEvidence[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const evidence = value.map(normalizeEvidence);
  return evidence.every((item) => item !== null)
    ? (evidence as PreQuoteDraftItemGlassEvidence[])
    : null;
}

function normalizeReviewReasons(
  value: unknown,
): PreQuoteDraftGlassReviewReason[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const reasons = value.map((reason) =>
    normalizeFromAliases(reason, REVIEW_REASON_ALIASES),
  );

  return reasons.every((reason) => reason !== null)
    ? (reasons as PreQuoteDraftGlassReviewReason[])
    : null;
}

function normalizeGlass(value: unknown): PreQuoteDraftItemGlass | null | false {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return false;
  }

  const assignmentScope = normalizeFromAliases(
    value.assignmentScope,
    ASSIGNMENT_SCOPE_ALIASES,
  );
  const reviewReasons = normalizeReviewReasons(value.reviewReasons);
  const evidence = normalizeEvidenceArray(value.evidence);

  if (
    !isNullableContractGuid(value.sourceStructuredItemGlassId) ||
    !isNullableContractGuid(value.glassTypeId) ||
    !isNullableString(value.rawSpecification) ||
    !isNullableString(value.normalizedCodeSnapshot) ||
    !assignmentScope ||
    typeof value.requiresReview !== "boolean" ||
    !reviewReasons ||
    !isPositiveIntegerArray(value.sourcePages) ||
    !evidence ||
    !isConsecutiveSequence(evidence)
  ) {
    return false;
  }

  return {
    sourceStructuredItemGlassId: value.sourceStructuredItemGlassId,
    glassTypeId: value.glassTypeId,
    rawSpecification: value.rawSpecification,
    normalizedCodeSnapshot: value.normalizedCodeSnapshot,
    assignmentScope,
    requiresReview: value.requiresReview,
    reviewReasons,
    sourcePages: value.sourcePages,
    evidence,
  };
}

function normalizeValuation(
  value: unknown,
): PreQuoteDraftItemValuation | null | false {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return false;
  }

  const reason =
    value.reason === null
      ? null
      : normalizeFromAliases(value.reason, VALUATION_REASON_ALIASES);
  const invalidationReason =
    value.invalidationReason === null
      ? null
      : normalizeFromAliases(
          value.invalidationReason,
          INVALIDATION_REASON_ALIASES,
        );

  if (
    !isValidContractGuid(value.sourceStructuredItemValuationId) ||
    !isStringIn(value.status, VALUATION_STATUSES) ||
    reason === null && value.reason !== null ||
    !isNullableContractGuid(value.glassTypeId) ||
    !isNullableContractGuid(value.glassPriceRangeVersionId) ||
    !isPositiveNullableInteger(value.widthMillimetersUsed) ||
    !isPositiveNullableInteger(value.heightMillimetersUsed) ||
    !isPositiveNullableInteger(value.quantityUsed) ||
    !isNullableFiniteNumber(value.unitAreaSquareMeters) ||
    !isNullableFiniteNumber(value.totalAreaSquareMeters) ||
    !isNullableFiniteNumber(value.unitPricePerSquareMeter) ||
    !isNullableFiniteNumber(value.unitAmount) ||
    !isNullableFiniteNumber(value.totalAmount) ||
    !isNullableString(value.currency) ||
    !isValidDateTime(value.valuedAtUtc) ||
    !isNullableDateTime(value.invalidatedAtUtc) ||
    (invalidationReason === null && value.invalidationReason !== null)
  ) {
    return false;
  }

  return {
    sourceStructuredItemValuationId: value.sourceStructuredItemValuationId,
    status: value.status,
    reason,
    glassTypeId: value.glassTypeId,
    glassPriceRangeVersionId: value.glassPriceRangeVersionId,
    widthMillimetersUsed: value.widthMillimetersUsed,
    heightMillimetersUsed: value.heightMillimetersUsed,
    quantityUsed: value.quantityUsed,
    unitAreaSquareMeters: value.unitAreaSquareMeters,
    totalAreaSquareMeters: value.totalAreaSquareMeters,
    unitPricePerSquareMeter: value.unitPricePerSquareMeter,
    unitAmount: value.unitAmount,
    totalAmount: value.totalAmount,
    currency: value.currency,
    valuedAtUtc: value.valuedAtUtc,
    invalidatedAtUtc: value.invalidatedAtUtc,
    invalidationReason,
  };
}

function normalizeItem(value: unknown): PreQuoteDraftItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const glass = normalizeGlass(value.glass);
  const valuation = normalizeValuation(value.valuation);
  const sourceSequence =
    "sourceSequence" in value ? value.sourceSequence : value.sourceItemSequence;

  if (
    !isValidContractGuid(value.id) ||
    !isPositiveInteger(value.sequence) ||
    !isStringIn(value.origin, ORIGINS) ||
    !isNullableContractGuid(value.sourceStructuredItemId) ||
    !isPositiveNullableInteger(value.sourceItemSequence) ||
    !isPositiveNullableInteger(sourceSequence) ||
    !isNullableString(value.reference) ||
    !isNonEmptyString(value.description) ||
    !isStringIn(value.elementType, ELEMENT_TYPES) ||
    !isNullableString(value.rawMeasurements) ||
    !isPositiveNullableInteger(value.widthMillimeters) ||
    !isPositiveNullableInteger(value.heightMillimeters) ||
    !isPositiveNullableInteger(value.quantity) ||
    typeof value.isIncluded !== "boolean" ||
    glass === false ||
    valuation === false
  ) {
    return null;
  }

  return {
    id: value.id,
    sequence: value.sequence,
    origin: value.origin,
    sourceStructuredItemId: value.sourceStructuredItemId,
    sourceItemSequence: value.sourceItemSequence,
    sourceSequence,
    reference: value.reference,
    description: value.description,
    elementType: value.elementType,
    rawMeasurements: value.rawMeasurements,
    widthMillimeters: value.widthMillimeters,
    heightMillimeters: value.heightMillimeters,
    quantity: value.quantity,
    isIncluded: value.isIncluded,
    glass,
    valuation,
  };
}

function normalizeRequirement(
  value: unknown,
): PreQuoteDraftRequirement | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isValidContractGuid(value.draftRequirementId) ||
    !isPositiveInteger(value.sequence) ||
    !isStringIn(value.origin, ORIGINS) ||
    !isPositiveNullableInteger(value.sourceSequence) ||
    !isStringIn(value.category, REQUIREMENT_CATEGORIES) ||
    !isNonEmptyString(value.value) ||
    typeof value.isIncluded !== "boolean"
  ) {
    return null;
  }

  return {
    draftRequirementId: value.draftRequirementId,
    sequence: value.sequence,
    origin: value.origin,
    sourceSequence: value.sourceSequence,
    category: value.category,
    value: value.value,
    isIncluded: value.isIncluded,
  };
}

function normalizeDocumentReference(
  value: unknown,
): PreQuoteDraftDocumentReference | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isValidContractGuid(value.draftDocumentReferenceId) ||
    !isPositiveInteger(value.sequence) ||
    !isStringIn(value.origin, ORIGINS) ||
    !isPositiveNullableInteger(value.sourceSequence) ||
    !isNullableString(value.reference) ||
    !isNonEmptyString(value.description) ||
    !isNullableString(value.detail) ||
    !isPositiveNullableInteger(value.quantity) ||
    typeof value.isIncluded !== "boolean"
  ) {
    return null;
  }

  return {
    draftDocumentReferenceId: value.draftDocumentReferenceId,
    sequence: value.sequence,
    origin: value.origin,
    sourceSequence: value.sourceSequence,
    reference: value.reference,
    description: value.description,
    detail: value.detail,
    quantity: value.quantity,
    isIncluded: value.isIncluded,
  };
}

function normalizeIssue(value: unknown): PreQuoteDraftIssue | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isValidContractGuid(value.draftIssueId) ||
    !isPositiveInteger(value.sequence) ||
    !isPositiveNullableInteger(value.sourceSequence) ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.message) ||
    !isPositiveNullableInteger(value.itemSequence) ||
    !isPositiveIntegerArray(value.pageNumbers) ||
    !isStringIn(value.resolutionStatus, RESOLUTION_STATUSES) ||
    !isNullableString(value.resolutionNote) ||
    !isNullableContractGuid(value.resolvedByUserId) ||
    !isNullableDateTime(value.resolvedAtUtc)
  ) {
    return null;
  }

  return {
    draftIssueId: value.draftIssueId,
    sequence: value.sequence,
    sourceSequence: value.sourceSequence,
    code: value.code,
    message: value.message,
    itemSequence: value.itemSequence,
    pageNumbers: value.pageNumbers,
    resolutionStatus: value.resolutionStatus,
    resolutionNote: value.resolutionNote,
    resolvedByUserId: value.resolvedByUserId,
    resolvedAtUtc: value.resolvedAtUtc,
  };
}

function normalizeConflict(value: unknown): PreQuoteDraftConflict | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isValidContractGuid(value.draftConflictId) ||
    !isPositiveInteger(value.sequence) ||
    !isPositiveInteger(value.sourceSequence) ||
    !isNonEmptyString(value.code) ||
    !isNonEmptyString(value.message) ||
    !isPositiveIntegerArray(value.itemSequences) ||
    !isPositiveIntegerArray(value.pageNumbers) ||
    !isStringIn(value.resolutionStatus, RESOLUTION_STATUSES) ||
    !isNullableString(value.resolutionNote) ||
    !isNullableContractGuid(value.resolvedByUserId) ||
    !isNullableDateTime(value.resolvedAtUtc)
  ) {
    return null;
  }

  return {
    draftConflictId: value.draftConflictId,
    sequence: value.sequence,
    sourceSequence: value.sourceSequence,
    code: value.code,
    message: value.message,
    itemSequences: value.itemSequences,
    pageNumbers: value.pageNumbers,
    resolutionStatus: value.resolutionStatus,
    resolutionNote: value.resolutionNote,
    resolvedByUserId: value.resolvedByUserId,
    resolvedAtUtc: value.resolvedAtUtc,
  };
}

function normalizeArray<T>(
  value: unknown,
  normalize: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map(normalize);
  return items.every((item) => item !== null) ? (items as T[]) : null;
}

function normalizeEconomicSummary(
  value: unknown,
): PreQuoteDraftEconomicSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonNegativeInteger(value.includedItemCount) ||
    !isNonNegativeInteger(value.includedKnownQuoteableUnitCount) ||
    !isNonNegativeInteger(value.valuedItemCount) ||
    !isNonNegativeInteger(value.pendingValuationItemCount) ||
    !isNonNegativeInteger(value.staleValuationItemCount) ||
    !isNonNegativeInteger(value.itemsRequiringReviewCount) ||
    !isNullableFiniteNumber(value.totalAreaSquareMeters) ||
    !isNullableFiniteNumber(value.glassSubtotal) ||
    !isNullableString(value.currency) ||
    typeof value.isEconomicallyComplete !== "boolean"
  ) {
    return null;
  }

  return {
    includedItemCount: value.includedItemCount,
    includedKnownQuoteableUnitCount: value.includedKnownQuoteableUnitCount,
    valuedItemCount: value.valuedItemCount,
    pendingValuationItemCount: value.pendingValuationItemCount,
    staleValuationItemCount: value.staleValuationItemCount,
    itemsRequiringReviewCount: value.itemsRequiringReviewCount,
    totalAreaSquareMeters: value.totalAreaSquareMeters,
    glassSubtotal: value.glassSubtotal,
    currency: value.currency,
    isEconomicallyComplete: value.isEconomicallyComplete,
  };
}

function normalizeSummary(value: unknown): PreQuoteDraftSummary | null | false {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return false;
  }

  const keys = [
    "totalItemCount",
    "includedItemCount",
    "excludedItemCount",
    "manualItemCount",
    "itemsRequiringCompletion",
    "includedKnownQuoteableUnitCount",
    "totalRequirementCount",
    "includedRequirementCount",
    "totalDocumentReferenceCount",
    "includedDocumentReferenceCount",
    "pendingIssueCount",
    "resolvedIssueCount",
    "dismissedIssueCount",
    "pendingConflictCount",
    "resolvedConflictCount",
    "dismissedConflictCount",
  ] as const;

  if (!keys.every((key) => isNonNegativeInteger(value[key]))) {
    return false;
  }

  const summary = value as Record<(typeof keys)[number], number>;

  return {
    totalItemCount: summary.totalItemCount,
    includedItemCount: summary.includedItemCount,
    excludedItemCount: summary.excludedItemCount,
    manualItemCount: summary.manualItemCount,
    itemsRequiringCompletion: summary.itemsRequiringCompletion,
    includedKnownQuoteableUnitCount: summary.includedKnownQuoteableUnitCount,
    totalRequirementCount: summary.totalRequirementCount,
    includedRequirementCount: summary.includedRequirementCount,
    totalDocumentReferenceCount: summary.totalDocumentReferenceCount,
    includedDocumentReferenceCount: summary.includedDocumentReferenceCount,
    pendingIssueCount: summary.pendingIssueCount,
    resolvedIssueCount: summary.resolvedIssueCount,
    dismissedIssueCount: summary.dismissedIssueCount,
    pendingConflictCount: summary.pendingConflictCount,
    resolvedConflictCount: summary.resolvedConflictCount,
    dismissedConflictCount: summary.dismissedConflictCount,
  };
}

function normalizeAudit(value: unknown): PreQuoteDraftAudit | null | false {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return false;
  }

  if (
    !isValidContractGuid(value.createdByUserId) ||
    !isValidContractGuid(value.updatedByUserId) ||
    !isNullableContractGuid(value.approvedByUserId) ||
    !isValidDateTime(value.createdAtUtc) ||
    !isValidDateTime(value.updatedAtUtc) ||
    !isNullableDateTime(value.approvedAtUtc)
  ) {
    return false;
  }

  return {
    createdByUserId: value.createdByUserId,
    updatedByUserId: value.updatedByUserId,
    approvedByUserId: value.approvedByUserId,
    createdAtUtc: value.createdAtUtc,
    updatedAtUtc: value.updatedAtUtc,
    approvedAtUtc: value.approvedAtUtc,
  };
}

function normalizeDraftDetails(
  value: unknown,
  requestedPreQuoteId: string,
): PreQuoteDraftDetails | null {
  if (!isRecord(value)) {
    return null;
  }

  const items = normalizeArray(value.items, normalizeItem);
  const requirements = normalizeArray(value.requirements, normalizeRequirement);
  const documentReferences = normalizeArray(
    value.documentReferences,
    normalizeDocumentReference,
  );
  const issues = normalizeArray(value.issues, normalizeIssue);
  const conflicts = normalizeArray(value.conflicts, normalizeConflict);
  const economicSummary = normalizeEconomicSummary(value.economicSummary);
  const summary = normalizeSummary(value.summary);
  const audit = normalizeAudit(value.audit);

  if (
    !isValidContractGuid(value.id) ||
    !isValidContractGuid(value.preQuoteId) ||
    !idsMatch(value.preQuoteId, requestedPreQuoteId) ||
    !isValidContractGuid(value.sourceDocumentId) ||
    !isValidContractGuid(value.sourceStructuredExtractionId) ||
    !isStringIn(value.status, DRAFT_STATUSES) ||
    !isPositiveInteger(value.version) ||
    !isNullableString(value.projectName) ||
    !isNullableString(value.clientName) ||
    !isNullableString(value.location) ||
    !isValidDateTime(value.createdAtUtc) ||
    !isValidDateTime(value.updatedAtUtc) ||
    !isNullableDateTime(value.approvedAtUtc) ||
    !items ||
    !requirements ||
    !documentReferences ||
    !issues ||
    !conflicts ||
    !economicSummary ||
    summary === false ||
    audit === false ||
    !isConsecutiveSequence(items) ||
    !isConsecutiveSequence(requirements) ||
    !isConsecutiveSequence(documentReferences) ||
    !isConsecutiveSequence(issues) ||
    !isConsecutiveSequence(conflicts)
  ) {
    return null;
  }

  return {
    id: value.id,
    preQuoteId: value.preQuoteId,
    sourceDocumentId: value.sourceDocumentId,
    sourceStructuredExtractionId: value.sourceStructuredExtractionId,
    status: value.status,
    version: value.version,
    projectName: value.projectName,
    clientName: value.clientName,
    location: value.location,
    createdAtUtc: value.createdAtUtc,
    updatedAtUtc: value.updatedAtUtc,
    approvedAtUtc: value.approvedAtUtc,
    items,
    requirements,
    documentReferences,
    issues,
    conflicts,
    economicSummary,
    summary,
    audit,
  };
}

function hasUniqueNullableIds(values: (string | null)[]): boolean {
  const persistedIds = values.filter((value): value is string => value !== null);
  return (
    new Set(persistedIds.map((value) => value.toLowerCase())).size ===
    persistedIds.length
  );
}

function hasUniqueIds(values: string[]): boolean {
  return new Set(values.map((value) => value.toLowerCase())).size === values.length;
}

function hasConsecutiveRequestSequences(values: { sequence: number }[]): boolean {
  return values.every((value, index) => value.sequence === index + 1);
}

function isValidUpdateRequest(request: UpdatePreQuoteDraftRequest): boolean {
  return (
    isPositiveInteger(request.expectedVersion) &&
    isRecord(request.project) &&
    isNullableString(request.project.name) &&
    isNullableString(request.project.clientName) &&
    isNullableString(request.project.location) &&
    Array.isArray(request.items) &&
    Array.isArray(request.requirements) &&
    Array.isArray(request.documentReferences) &&
    Array.isArray(request.issues) &&
    Array.isArray(request.conflicts) &&
    hasConsecutiveRequestSequences(request.items) &&
    hasConsecutiveRequestSequences(request.requirements) &&
    hasConsecutiveRequestSequences(request.documentReferences) &&
    hasUniqueNullableIds(request.items.map((item) => item.draftItemId)) &&
    hasUniqueNullableIds(
      request.requirements.map((requirement) => requirement.draftRequirementId),
    ) &&
    hasUniqueNullableIds(
      request.documentReferences.map(
        (reference) => reference.draftDocumentReferenceId,
      ),
    ) &&
    hasUniqueIds(request.issues.map((issue) => issue.draftIssueId)) &&
    hasUniqueIds(request.conflicts.map((conflict) => conflict.draftConflictId)) &&
    request.items.every(
      (item) =>
        isNullableContractGuid(item.draftItemId) &&
        isPositiveInteger(item.sequence) &&
        isNullableString(item.reference) &&
        isNonEmptyString(item.description) &&
        isStringIn(item.elementType, ELEMENT_TYPES) &&
        isNullableString(item.rawMeasurements) &&
        isPositiveNullableInteger(item.widthMillimeters) &&
        isPositiveNullableInteger(item.heightMillimeters) &&
        isPositiveNullableInteger(item.quantity) &&
        typeof item.isIncluded === "boolean",
    ) &&
    request.requirements.every(
      (requirement) =>
        isNullableContractGuid(requirement.draftRequirementId) &&
        isPositiveInteger(requirement.sequence) &&
        isStringIn(requirement.category, REQUIREMENT_CATEGORIES) &&
        typeof requirement.value === "string" &&
        typeof requirement.isIncluded === "boolean",
    ) &&
    request.documentReferences.every(
      (reference) =>
        isNullableContractGuid(reference.draftDocumentReferenceId) &&
        isPositiveInteger(reference.sequence) &&
        isNullableString(reference.reference) &&
        isNonEmptyString(reference.description) &&
        isNullableString(reference.detail) &&
        isPositiveNullableInteger(reference.quantity) &&
        typeof reference.isIncluded === "boolean",
    ) &&
    request.issues.every(
      (issue) =>
        isValidContractGuid(issue.draftIssueId) &&
        isStringIn(issue.resolutionStatus, RESOLUTION_STATUSES) &&
        isNullableString(issue.resolutionNote),
    ) &&
    request.conflicts.every(
      (conflict) =>
        isValidContractGuid(conflict.draftConflictId) &&
        isStringIn(conflict.resolutionStatus, RESOLUTION_STATUSES) &&
        isNullableString(conflict.resolutionNote),
    )
  );
}

export function isValidPreQuoteDraftContractGuid(value: string): boolean {
  return isValidContractGuid(value);
}

export async function getPreQuoteDraft(
  preQuoteId: string,
): Promise<PreQuoteDraftDetails> {
  if (!isValidPreQuoteId(preQuoteId)) {
    throw new InvalidPreQuoteDraftResponseError();
  }

  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(preQuoteId)}/draft`,
    { authenticated: true },
  );
  const draft = normalizeDraftDetails(response, preQuoteId);

  if (!draft) {
    throw new InvalidPreQuoteDraftResponseError();
  }

  return draft;
}

export async function createPreQuoteDraft(
  preQuoteId: string,
  request: CreatePreQuoteDraftRequest,
): Promise<PreQuoteDraftDetails> {
  if (
    !isValidPreQuoteId(preQuoteId) ||
    !isValidContractGuid(request.sourceDocumentId) ||
    !isValidContractGuid(request.sourceStructuredExtractionId)
  ) {
    throw new InvalidCreatePreQuoteDraftResponseError();
  }

  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(preQuoteId)}/draft`,
    {
      method: "POST",
      authenticated: true,
      body: request,
    },
  );
  const draft = normalizeDraftDetails(response, preQuoteId);

  if (!draft) {
    throw new InvalidCreatePreQuoteDraftResponseError();
  }

  return draft;
}

export async function updatePreQuoteDraft(
  preQuoteId: string,
  request: UpdatePreQuoteDraftRequest,
): Promise<PreQuoteDraftDetails> {
  if (!isValidPreQuoteId(preQuoteId) || !isValidUpdateRequest(request)) {
    throw new InvalidUpdatePreQuoteDraftResponseError();
  }

  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(preQuoteId)}/draft`,
    {
      method: "PUT",
      authenticated: true,
      body: request,
    },
  );
  const draft = normalizeDraftDetails(response, preQuoteId);

  if (!draft) {
    throw new InvalidUpdatePreQuoteDraftResponseError();
  }

  return draft;
}
