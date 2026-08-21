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
  TechnicalProposal,
  TechnicalProposalAlternative,
  TechnicalProposalFinishOption,
  TechnicalProposalGlassOption,
  TechnicalProposalSystemOption,
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

function isProposalItem(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.suggested) ||
      !isRecord(value.alternatives) || !isRecord(value.confidence) ||
      !isRecord(value.historicalEvidence) || !isRecord(value.trace)) return false;

  const suggested = value.suggested;
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
    isNullableNumber(evidence.confidence) && isString(evidence.status));

  return isNonEmptyString(value.itemId) && isNonEmptyString(value.extractedItemId) &&
    isNullableString(value.elementId) && isNonNegativeInteger(value.sequence) &&
    isNullableString(value.reference) && isString(value.description) && isString(value.elementType) &&
    isNullableNumber(value.quantity) && isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) && isNullableNumber(value.areaM2) &&
    isNullableNumber(value.extractionConfidence) && isString(value.extractionStatus) &&
    (suggested.system === null || isSystemOption(suggested.system)) &&
    (suggested.glass === null || isGlassOption(suggested.glass)) &&
    (suggested.finish === null || isFinishOption(suggested.finish)) &&
    Array.isArray(alternatives.systems) && alternatives.systems.every((item) => isAlternative(item, isSystemOption)) &&
    Array.isArray(alternatives.glass) && alternatives.glass.every((item) => isAlternative(item, isGlassOption)) &&
    Array.isArray(alternatives.finishes) && alternatives.finishes.every((item) => isAlternative(item, isFinishOption)) &&
    ["overall", "system", "glass", "finish"].every((key) => isNumber(confidence[key])) &&
    typeof value.requiresReview === "boolean" && isStringArray(value.reviewReasons) &&
    typeof value.isTechnicallyComplete === "boolean" && typeof value.isPriceable === "boolean" &&
    isString(historical.status) && isNonNegativeInteger(historical.supportCount) &&
    isNullableNumber(historical.bestSimilarity) && isNullableNumber(historical.averageSimilarity) && examplesValid &&
    ["requestedSystemRaw", "requestedProfileRaw", "functionalType", "operation", "glassRawSpecification", "glassTypeRaw", "glassTypeNormalized", "finishRawDescription", "finishNormalizedType", "finishColorRaw", "finishColorNormalized"]
      .every((key) => isNullableString(trace[key])) &&
    isNullableNumber(trace.glassThicknessMm) && isStringArray(trace.specialFeatures) && evidenceValid;
}

function isTechnicalProposal(value: unknown): value is TechnicalProposal {
  return isRecord(value) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && isNonEmptyString(value.processingAttemptId) &&
    isNonEmptyString(value.extractionResultId) && isString(value.status) && isDateTime(value.createdAtUtc) &&
    isNonNegativeInteger(value.itemCount) && isNonNegativeInteger(value.itemsRequiringReview) &&
    isNonNegativeInteger(value.technicallyCompleteItems) && isNonNegativeInteger(value.priceableItems) &&
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
      title: "Respuesta inválida",
      detail: "El servidor devolvió una propuesta técnica con un formato inesperado.",
    });
  }
  return response;
}

export function getTechnicalProposalErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible consultar la propuesta técnica.";
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "El requerimiento indicado no es válido.",
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes acceso a esta propuesta técnica.",
    404: "La propuesta técnica todavía no está disponible.",
    409: "La propuesta técnica no está disponible en el estado actual.",
    500: "No fue posible consultar la propuesta técnica.",
  };
  return messages[error.status] ?? "No fue posible consultar la propuesta técnica.";
}
