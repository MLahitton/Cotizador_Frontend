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
  RequirementPricing,
  RequirementPricingRange,
} from "@/features/prequotes/requirement-pricing-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isRange(value: unknown): value is RequirementPricingRange {
  return isRecord(value) && isNullableNumber(value.minimum) &&
    isNullableNumber(value.expected) && isNullableNumber(value.maximum);
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
    value.comparables.every((comparable) => isRecord(comparable) &&
      isString(comparable.candidateId) && isNullableString(comparable.historicalReference) &&
      isNumber(comparable.publicUnitPrice) && isNumber(comparable.projectedPrice) &&
      isNumber(comparable.backendScore) && isNullableNumber(comparable.ai2Similarity) &&
      isNullableString(comparable.similarityLevel) && isNumber(comparable.finalWeight));
}

function isRequirementPricing(value: unknown): value is RequirementPricing {
  return isRecord(value) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && isNonEmptyString(value.currency) &&
    isNonEmptyString(value.pricingBasis) && isNonNegativeInteger(value.itemCount) &&
    isNonNegativeInteger(value.pricedItemCount) && isNonNegativeInteger(value.notPriceableItemCount) &&
    isNonNegativeInteger(value.itemsRequiringReview) && isRange(value.estimatedSubtotal) &&
    typeof value.isCompleteTotal === "boolean" && typeof value.requiresReview === "boolean" &&
    isStringArray(value.assumptions) && isStringArray(value.missingData) &&
    Array.isArray(value.items) && value.items.every(isPricingItem);
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
      title: "Respuesta inválida",
      detail: "El servidor devolvió una estimación económica con un formato inesperado.",
    });
  }
  return response;
}

export function getRequirementPricingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible calcular la estimación económica.";
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "El requerimiento indicado no es válido.",
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes acceso para calcular esta estimación.",
    404: "El requerimiento o su propuesta técnica no está disponible.",
    409: "No es posible calcular precios en el estado actual.",
    500: "No fue posible calcular la estimación económica.",
  };
  return messages[error.status] ?? "No fue posible calcular la estimación económica.";
}
