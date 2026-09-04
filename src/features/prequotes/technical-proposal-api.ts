import {
  isDateTime,
  isNonEmptyString,
  isNonNegativeInteger,
  isNullableNumber,
  isNullableString,
  isNumber,
  isRecord,
  isString,
  isStringArray,
} from "@/features/prequotes/newpipe-guards";
import type {
  HistoricalEvidenceStatus,
  TechnicalProposal,
  TechnicalProposalAlternative,
  TechnicalProposalFinishOption,
  TechnicalProposalGlassOption,
  TechnicalProposalPendingCategory,
  TechnicalProposalPendingSeverity,
  TechnicalProposalReadinessState,
  TechnicalProposalSystemOption,
  VisualDivision,
  VisualPanel,
  VisualPanelKind,
  VisualPanelRole,
  VisualSystemModel,
} from "@/features/prequotes/technical-proposal-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function hasBaseOption(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isNonEmptyString(value.id) &&
    isNonEmptyString(value.code) && isNonEmptyString(value.displayName);
}

function isSystemOption(value: unknown): value is TechnicalProposalSystemOption {
  return hasBaseOption(value) && ["technicalName", "commercialName", "functionalType", "family", "series", "commercialLine", "variant"]
    .every((key) => isNullableString(value[key]));
}

function isGlassOption(value: unknown): value is TechnicalProposalGlassOption {
  return hasBaseOption(value) && ["family", "composition", "treatment", "pvbType", "pvbColor", "productLine", "productToken", "pattern", "color"]
    .every((key) => isNullableString(value[key])) &&
    ["outerThicknessMm", "innerThicknessMm", "pvbThicknessMm", "chamberThicknessMm"]
      .every((key) => isNullableNumber(value[key]));
}

function isFinishOption(value: unknown): value is TechnicalProposalFinishOption {
  return hasBaseOption(value) && ["normalizedType", "color", "texture", "process", "commercialCode", "material"]
    .every((key) => isNullableString(value[key]));
}

function isAlternative<T>(value: unknown, optionGuard: (option: unknown) => option is T): value is TechnicalProposalAlternative<T> {
  return isRecord(value) && optionGuard(value.option) &&
    isNonNegativeInteger(value.rank) && isNumber(value.confidence) &&
    isStringArray(value.reasons);
}

function isHistoricalEvidenceStatus(value: unknown): value is HistoricalEvidenceStatus {
  return value === "AVAILABLE" || value === "NO_COMPARABLES" || value === "SIMILARITY_UNAVAILABLE";
}
function isReadinessState(value: unknown): value is TechnicalProposalReadinessState {
  return value === "READY" || value === "REVIEW_REQUIRED" || value === "BLOCKED";
}

function isPendingCategory(value: unknown): value is TechnicalProposalPendingCategory {
  return ["SYSTEM", "GLASS", "FINISH", "GEOMETRY", "QUANTITY", "MEASUREMENTS", "COMMERCIAL", "EVIDENCE", "RULE", "OTHER"].includes(String(value));
}

function isPendingSeverity(value: unknown): value is TechnicalProposalPendingSeverity {
  return value === "BLOCKING" || value === "WARNING" || value === "INFO";
}

function isCategoryCounts(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(isNonNegativeInteger);
}

function isPendingDefinition(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.code) && isPendingCategory(value.category) &&
    isPendingSeverity(value.severity) && isNonEmptyString(value.field) && isNonEmptyString(value.title) &&
    isNonEmptyString(value.message) && isNullableString(value.currentValue) && isNonEmptyString(value.requiredAction) &&
    typeof value.blocksConfirmation === "boolean" && typeof value.blocksPricing === "boolean" &&
    isStringArray(value.relatedReasonCodes);
}

function isItemReadiness(value: unknown): boolean {
  return isRecord(value) && isReadinessState(value.state) && isNonNegativeInteger(value.blockingCount) &&
    isNonNegativeInteger(value.warningCount) && Array.isArray(value.pendingDefinitions) &&
    value.pendingDefinitions.every(isPendingDefinition);
}

function isProposalReadiness(value: unknown): boolean {
  return isRecord(value) && isReadinessState(value.state) &&
    typeof value.isReadyForConfirmation === "boolean" && typeof value.isReadyForPricing === "boolean" &&
    isNonNegativeInteger(value.blockingItems) && isNonNegativeInteger(value.warningItems) &&
    isNonNegativeInteger(value.blockingDefinitions) && isNonNegativeInteger(value.warningDefinitions) &&
    isNonNegativeInteger(value.pricingBlockingItems) && isNonNegativeInteger(value.pricingBlockingDefinitions) &&
    isCategoryCounts(value.categories);
}

const VISUAL_PANEL_KINDS = ["SIMPLE", "COMPOSITE"] as const;
const VISUAL_PANEL_ROLES = ["FIXED", "PROJECTING", "SLIDING", "HINGED", "FOLDING", "LOUVER", "UNKNOWN", "COMPOSITE"] as const;

function isVisualPanelKind(value: unknown): value is VisualPanelKind {
  return VISUAL_PANEL_KINDS.includes(value as VisualPanelKind);
}

function isVisualPanelRole(value: unknown): value is VisualPanelRole {
  return VISUAL_PANEL_ROLES.includes(value as VisualPanelRole);
}

function isVisualPanel(value: unknown): value is VisualPanel {
  return isRecord(value) && isNonNegativeInteger(value.index) &&
    isVisualPanelKind(value.kind) && isVisualPanelRole(value.role) &&
    isNullableString(value.operation) && isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) && isNullableNumber(value.widthRatio) &&
    isNullableNumber(value.heightRatio) &&
    (value.isMovable === null || typeof value.isMovable === "boolean") &&
    isNullableString(value.openingDirection) && isNullableNumber(value.confidence) &&
    Array.isArray(value.subPanels) && value.subPanels.every(isVisualPanel);
}

function isVisualDivision(value: unknown): value is VisualDivision {
  return isRecord(value) && isNonEmptyString(value.orientation) &&
    isNullableNumber(value.positionRatio) && isNullableNumber(value.positionMm) &&
    isNullableString(value.source);
}

function isVisualSystemModel(value: unknown): value is VisualSystemModel {
  if (!isRecord(value)) return false;
  const system = value.system;
  return isNonEmptyString(value.version) && isNonEmptyString(value.source) &&
    (system === null || (isRecord(system) && isNonEmptyString(system.id) &&
      isNonEmptyString(system.code) && isNonEmptyString(system.displayName))) &&
    isNullableString(value.functionalType) && isNullableString(value.operation) &&
    isNullableString(value.geometryType) && isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) && isNullableNumber(value.quantity) &&
    Array.isArray(value.panels) && value.panels.every(isVisualPanel) &&
    Array.isArray(value.divisions) && value.divisions.every(isVisualDivision) &&
    isStringArray(value.specialFeatures) && typeof value.requiresReview === "boolean" &&
    isStringArray(value.reviewReasons);
}


function isCommercialConfirmation(value: unknown): boolean {
  return isRecord(value) &&
    (value.state === "PENDING_CONFIRMATION" || value.state === "CONFIRMED") &&
    (value.confirmedAtUtc === null || isDateTime(value.confirmedAtUtc)) &&
    isNullableString(value.confirmedByUserId);
}

function isProposalItem(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.suggested) ||
      !isRecord(value.alternatives) || !isRecord(value.confidence) ||
      !isRecord(value.historicalEvidence) || !isRecord(value.trace) || !isItemReadiness(value.readiness) ||
      (value.visualModel !== null && !isVisualSystemModel(value.visualModel))) return false;

  const suggested = value.suggested;
  const selected = value.selected;
  const alternatives = value.alternatives;
  const confidence = value.confidence;
  const historical = value.historicalEvidence;
  const trace = value.trace;
  const examplesValid = Array.isArray(historical.examples) && historical.examples.every((example) =>
    isRecord(example) && isString(example.candidateId) && isString(example.quoteId) &&
    isNullableString(example.historicalReference) && isNumber(example.similarityScore) &&
    isStringArray(example.matchedFeatures) && isStringArray(example.differences) &&
    isString(example.technicalExplanation));
  const evidenceValid = Array.isArray(value.evidence) && value.evidence.every((evidence) =>
    isRecord(evidence) && isNullableNumber(evidence.pageNumber) && isString(evidence.sourceType) &&
    isString(evidence.text) && isNullableString(evidence.sheetName) &&
    isNullableString(evidence.cellRange) && isNullableString(evidence.sourceId) &&
    isNullableString(evidence.sourceFileName) && isNullableString(evidence.contextLabel) &&
    isNullableNumber(evidence.confidence) && isString(evidence.status));

  return isNonEmptyString(value.itemId) && isNonEmptyString(value.extractedItemId) &&
    isNullableString(value.elementId) && isNonNegativeInteger(value.sequence) &&
    isNullableString(value.reference) && isString(value.description) && isString(value.elementType) &&
    isNullableNumber(value.quantity) && isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) && isNullableNumber(value.manualQuantityOverride) &&
    isNullableNumber(value.manualWidthMmOverride) && isNullableNumber(value.manualHeightMmOverride) &&
    isNullableNumber(value.effectiveQuantity) && isNullableNumber(value.effectiveWidthMm) &&
    isNullableNumber(value.effectiveHeightMm) && isNullableNumber(value.areaM2) &&
    isNullableNumber(value.extractionConfidence) && isString(value.extractionStatus) &&
    (suggested.system === null || isSystemOption(suggested.system)) &&
    (suggested.glass === null || isGlassOption(suggested.glass)) &&
    (suggested.finish === null || isFinishOption(suggested.finish)) &&
    (selected === null || (isRecord(selected) &&
      (selected.system === null || isSystemOption(selected.system)) &&
      (selected.glass === null || isGlassOption(selected.glass)) &&
      (selected.finish === null || isFinishOption(selected.finish)) &&
      isDateTime(selected.selectedAtUtc) && isNonEmptyString(selected.selectedByUserId))) &&
    ["UNCONFIRMED", "CONFIRMED_AS_SUGGESTED", "MODIFIED"].includes(String(value.selectionState)) &&
    Array.isArray(alternatives.systems) && alternatives.systems.every((item) => isAlternative(item, isSystemOption)) &&
    Array.isArray(alternatives.glass) && alternatives.glass.every((item) => isAlternative(item, isGlassOption)) &&
    Array.isArray(alternatives.finishes) && alternatives.finishes.every((item) => isAlternative(item, isFinishOption)) &&
    ["overall", "system", "glass", "finish"].every((key) => isNumber(confidence[key])) &&
    typeof value.requiresReview === "boolean" && isStringArray(value.reviewReasons) &&
    isStringArray(value.systemResolutionReasons) && isStringArray(value.glassResolutionReasons) &&
    isStringArray(value.finishResolutionReasons) &&
    typeof value.isTechnicallyComplete === "boolean" && typeof value.isPriceable === "boolean" &&
    isHistoricalEvidenceStatus(historical.status) && isNonNegativeInteger(historical.supportCount) &&
    isNullableNumber(historical.bestSimilarity) && isNullableNumber(historical.averageSimilarity) && examplesValid &&
    ["requestedSystemRaw", "requestedProfileRaw", "functionalType", "operation", "glassRawSpecification", "glassTypeRaw", "glassTypeNormalized", "finishRawDescription", "finishNormalizedType", "finishColorRaw", "finishColorNormalized", "geometryType"]
      .every((key) => isNullableString(trace[key])) &&
    isNullableNumber(trace.glassThicknessMm) && isStringArray(trace.specialFeatures) && evidenceValid;
}

function isTechnicalProposal(value: unknown): value is TechnicalProposal {
  return isRecord(value) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && isNonEmptyString(value.processingAttemptId) &&
    isNonEmptyString(value.extractionResultId) && isString(value.status) && isDateTime(value.createdAtUtc) &&
    (value.commercialLine === null || ["CLASSIC", "ESSENTIAL", "BIOCONFORT", "SIGNATURE"].includes(String(value.commercialLine))) &&
    isCommercialConfirmation(value.commercialConfirmation) &&
    isNonNegativeInteger(value.itemCount) && isNonNegativeInteger(value.itemsRequiringReview) &&
    isNonNegativeInteger(value.technicallyCompleteItems) && isNonNegativeInteger(value.priceableItems) &&
    isProposalReadiness(value.readiness) &&
    Array.isArray(value.items) && value.items.every(isProposalItem);
}

export async function getTechnicalProposal(requirementId: string): Promise<TechnicalProposal> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/technical-proposal`,
    { authenticated: true },
  );
  if (!isTechnicalProposal(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio una propuesta tecnica con un formato inesperado.",
    });
  }
  return response;
}

export function getTechnicalProposalErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible consultar la propuesta tecnica.";
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "El requerimiento indicado no es valido.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    403: "No tienes acceso a esta propuesta tecnica.",
    404: "La propuesta tecnica todavia no esta disponible.",
    409: "La propuesta tecnica no esta disponible en el estado actual.",
    500: "No fue posible consultar la propuesta tecnica.",
  };
  return messages[error.status] ?? "No fue posible consultar la propuesta tecnica.";
}
