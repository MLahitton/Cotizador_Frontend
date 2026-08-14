import type {
  EstimateDocumentsParameters,
  HistoricalDocumentEstimate,
  HistoricalDocumentEstimateItem,
  HistoricalDocumentPricingStatus,
} from "@/features/prequotes/historical-document-estimate-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const PRICING_STATUSES = [
  "PRICEABLE",
  "NOT_PRICEABLE",
  "TECHNICAL_FAILURE",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPricingStatus(value: unknown): value is HistoricalDocumentPricingStatus {
  return typeof value === "string" && PRICING_STATUSES.includes(value as HistoricalDocumentPricingStatus);
}

function isEstimateItem(value: unknown): value is HistoricalDocumentEstimateItem {
  if (!isRecord(value)) return false;

  return (
    typeof value.elementId === "number" &&
    isNullableString(value.reference) &&
    isNullableString(value.category) &&
    isNullableString(value.system) &&
    isNullableString(value.glass) &&
    isNullableString(value.configuration) &&
    isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) &&
    isNullableNumber(value.areaM2) &&
    isNullableNumber(value.quantity) &&
    isNullableString(value.finish) &&
    isPricingStatus(value.pricingStatus) &&
    ["unitMinimum", "unitExpected", "unitMaximum", "lineMinimum", "lineExpected", "lineMaximum", "minimum", "expected", "maximum", "confidenceScore", "candidateCount", "strongComparableCount"].every((key) => isNullableNumber(value[key])) &&
    isNullableString(value.confidenceLevel) &&
    typeof value.requiresReview === "boolean" &&
    isStringArray(value.mappingWarnings) &&
    isStringArray(value.assumptions) &&
    isStringArray(value.missingData)
  );
}

function isEstimate(value: unknown): value is HistoricalDocumentEstimate {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;

  return (
    isNullableString(value.projectId) &&
    isNullableString(value.requirementId) &&
    ["sourceCount", "extractedElementCount", "itemCount", "pricedItemCount", "notPriceableItemCount", "technicalFailureItemCount"].every((key) => typeof value[key] === "number" && Number.isInteger(value[key]) && (value[key] as number) >= 0) &&
    isNullableString(value.currency) &&
    typeof value.pricingBasis === "string" &&
    isNullableNumber(value.minimum) &&
    isNullableNumber(value.expected) &&
    isNullableNumber(value.maximum) &&
    typeof value.confidenceScore === "number" &&
    typeof value.confidenceLevel === "string" &&
    typeof value.isPartial === "boolean" &&
    typeof value.requiresReview === "boolean" &&
    isStringArray(value.assumptions) &&
    isStringArray(value.missingData) &&
    isStringArray(value.warnings) &&
    value.items.every(isEstimateItem)
  );
}

export async function estimateDocuments({
  files,
  projectId,
  requirementId,
}: EstimateDocumentsParameters): Promise<HistoricalDocumentEstimate> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (projectId) formData.append("projectId", projectId);
  if (requirementId) formData.append("requirementId", requirementId);

  const response = await apiRequest(
    "/api/v1/historical-pricing/document-estimate",
    { method: "POST", authenticated: true, body: formData },
  );

  if (!isEstimate(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: "El servidor devolvió una precotización con un formato inesperado.",
    });
  }

  return response;
}

export function getEstimateDocumentsErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible calcular la precotización.";
  }

  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor. Inténtalo nuevamente.",
    400: "El documento no es válido o no se puede procesar.",
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes permiso para generar esta precotización.",
    502: "El servicio de análisis no está disponible o agotó su tiempo de respuesta.",
    503: "El histórico de precios no está disponible temporalmente.",
    500: "No fue posible calcular la precotización.",
  };
  return messages[error.status] ?? "No fue posible calcular la precotización.";
}
