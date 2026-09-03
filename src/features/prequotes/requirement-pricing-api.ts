import {
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
  RepriceRequirementPricingItemRequest,
  RepriceRequirementPricingItemResponse,
  RequirementPricing,
  RequirementPricingComparable,
  RequirementPricingRange,
} from "@/features/prequotes/requirement-pricing-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isRange(value: unknown): value is RequirementPricingRange {
  return isRecord(value) && isNullableNumber(value.minimum) &&
    isNullableNumber(value.expected) && isNullableNumber(value.maximum);
}

function isNullableRange(value: unknown): value is RequirementPricingRange | null {
  return value === null || isRange(value);
}

function isComparable(value: unknown): value is RequirementPricingComparable {
  return isRecord(value) &&
    isString(value.candidateId) && isNullableString(value.historicalReference) &&
    isNumber(value.publicUnitPrice) && isNumber(value.projectedPrice) &&
    isNumber(value.backendScore) && isNullableNumber(value.ai2Similarity) &&
    isNullableString(value.similarityLevel) && isNumber(value.finalWeight);
}

function isPricingItem(value: unknown): boolean {
  if (!isRecord(value) || !isRange(value.unit) || !isRange(value.line) ||
      !Array.isArray(value.comparables)) return false;
  return isNonEmptyString(value.proposalItemId) && isNonEmptyString(value.extractedItemId) &&
    isNullableString(value.elementId) && isNonNegativeInteger(value.sequence) &&
    isNullableString(value.reference) && isString(value.description) && isNonEmptyString(value.status) &&
    (value.configurationSource === "SUGGESTED" || value.configurationSource === "SELECTED") &&
    isNullableNumber(value.quantity) && isNullableNumber(value.pricingAreaM2) &&
    isNullableNumber(value.confidenceScore) && isNullableString(value.confidenceLevel) &&
    typeof value.requiresReview === "boolean" && isStringArray(value.mappingWarnings) &&
    isStringArray(value.assumptions) && isStringArray(value.missingData) &&
    value.comparables.every(isComparable) &&
    isNullableRange(value.originalUnit) && isNullableRange(value.currentUnit) && isNullableRange(value.deltaUnit) &&
    isNullableRange(value.originalLine) && isNullableRange(value.currentLine) && isNullableRange(value.deltaLine);
}

function isRequirementPricing(value: unknown): value is RequirementPricing {
  return isRecord(value) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && isNonEmptyString(value.currency) &&
    isNonEmptyString(value.pricingBasis) && isNonNegativeInteger(value.itemCount) &&
    isNonNegativeInteger(value.pricedItemCount) && isNonNegativeInteger(value.notPriceableItemCount) &&
    isNonNegativeInteger(value.itemsRequiringReview) && isRange(value.estimatedSubtotal) &&
    typeof value.isCompleteTotal === "boolean" && typeof value.requiresReview === "boolean" &&
    isStringArray(value.assumptions) && isStringArray(value.missingData) &&
    Array.isArray(value.items) && value.items.every(isPricingItem) &&
    isNullableNumber(value.originalGrandTotal) && isNullableNumber(value.currentGrandTotal) &&
    isNullableNumber(value.deltaGrandTotal);
}

function isRepriceResponse(value: unknown): value is RepriceRequirementPricingItemResponse {
  return isRecord(value) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && isNonEmptyString(value.technicalProposalItemId) &&
    isRecord(value.configuration) && isNullableString(value.configuration.systemId) &&
    isNullableString(value.configuration.glassTypeId) && isNullableString(value.configuration.finishTypeId) &&
    isRecord(value.pricing) && isNullableNumber(value.pricing.originalUnitPrice) &&
    isNullableNumber(value.pricing.currentUnitPrice) && isNullableNumber(value.pricing.deltaUnitPrice) &&
    isNullableNumber(value.pricing.originalLineTotal) && isNullableNumber(value.pricing.currentLineTotal) &&
    isNullableNumber(value.pricing.deltaLineTotal) &&
    isNullableRange(value.pricing.originalUnit) && isNullableRange(value.pricing.currentUnit) &&
    isNullableRange(value.pricing.deltaUnit) && isNullableRange(value.pricing.originalLine) &&
    isNullableRange(value.pricing.currentLine) && isNullableRange(value.pricing.deltaLine) &&
    isNonEmptyString(value.pricing.state) &&
    isRecord(value.summary) && isNullableNumber(value.summary.originalGrandTotal) &&
    isNullableNumber(value.summary.currentGrandTotal) && isNullableNumber(value.summary.deltaGrandTotal) &&
    Array.isArray(value.comparables) && value.comparables.every(isComparable);
}

export async function getRequirementPricing(requirementId: string): Promise<RequirementPricing> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/pricing`,
    { authenticated: true },
  );
  if (
    !isRequirementPricing(response) ||
    response.requirementId.toLowerCase() !== requirementId.toLowerCase()
  ) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio una estimacion economica con un formato inesperado.",
    });
  }
  return response;
}

export async function cancelRequirementPricing(requirementId: string): Promise<void> {
  await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/pricing/cancel`, { method: "POST", authenticated: true });
}

export async function repriceRequirementPricingItem(
  requirementId: string,
  technicalProposalItemId: string,
  request: RepriceRequirementPricingItemRequest,
): Promise<RepriceRequirementPricingItemResponse> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/pricing/items/${encodeURIComponent(technicalProposalItemId)}/reprice`,
    { method: "POST", authenticated: true, body: request },
  );
  if (
    !isRepriceResponse(response) ||
    response.requirementId.toLowerCase() !== requirementId.toLowerCase() ||
    response.technicalProposalItemId.toLowerCase() !== technicalProposalItemId.toLowerCase()
  ) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio un repricing con un formato inesperado.",
    });
  }
  return response;
}

function requirementPricingProblemCode(error: ApiError): string | null {
  const value = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getRequirementPricingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible calcular la estimacion economica.";
  const code = requirementPricingProblemCode(error);
  if (code === "TECHNICAL_PROPOSAL_NO_INCLUDED_ITEMS") return "No hay elementos incluidos para calcular precios.";
  if (code === "TECHNICAL_PROPOSAL_ITEM_EXCLUDED") return "El elemento esta excluido del alcance comercial actual.";
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "La configuracion seleccionada no es valida para recalcular el precio.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    403: "No tienes acceso para calcular esta estimacion.",
    404: "El requerimiento, la propuesta o el item ya no esta disponible.",
    409: "Confirma las configuraciones antes de calcular precios o espera a que termine la cancelacion.",
    500: "No fue posible calcular la estimacion economica.",
  };
  return messages[error.status] ?? "No fue posible calcular la estimacion economica.";
}
