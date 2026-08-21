import {
  isDateTime,
  isNonEmptyString,
  isNonNegativeInteger,
  isRecord,
} from "@/features/prequotes/newpipe-guards";
import type {
  CreatedRequirement,
  ProcessedRequirement,
  RequirementProcessingOutcome,
  RequirementProcessingState,
  RequirementStatus,
} from "@/features/prequotes/requirement-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const REQUIREMENT_STATUSES = ["PENDING", "PROCESSING", "PROCESSED", "FAILED"] as const;
const PROCESSING_STATES = ["Pending", "Processing", "Finished"] as const;
const PROCESSING_OUTCOMES = ["Completed", "RequiresReview", "Failed"] as const;

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isCreatedRequirement(value: unknown): value is CreatedRequirement {
  return isRecord(value) &&
    isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.preQuoteId) &&
    isNonNegativeInteger(value.fileCount) && value.fileCount > 0 &&
    isOneOf<RequirementStatus>(value.status, REQUIREMENT_STATUSES) &&
    isDateTime(value.createdAtUtc);
}

function isProcessedRequirement(value: unknown): value is ProcessedRequirement {
  if (!isRecord(value)) return false;
  const summary = value.summary;
  return isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.processingAttemptId) &&
    isNonEmptyString(value.correlationId) &&
    isOneOf<RequirementProcessingState>(value.processingState, PROCESSING_STATES) &&
    isOneOf<RequirementProcessingOutcome>(value.outcome, PROCESSING_OUTCOMES) &&
    (value.errorCode === null || isNonEmptyString(value.errorCode)) &&
    isDateTime(value.startedAtUtc) && isDateTime(value.completedAtUtc) &&
    (summary === null || (isRecord(summary) &&
      isNonNegativeInteger(summary.itemCount) &&
      isNonNegativeInteger(summary.itemsRequiringReview) &&
      isNonNegativeInteger(summary.issueCount) &&
      isNonNegativeInteger(summary.conflictCount) &&
      isNonEmptyString(summary.processingMethod) &&
      isNonNegativeInteger(summary.durationMs)));
}

function invalidResponse(detail: string): ApiError {
  return new ApiError({ status: 0, title: "Respuesta inválida", detail });
}

export async function createRequirement(preQuoteId: string, files: File[]): Promise<CreatedRequirement> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await apiRequest(
    `/api/v2/prequotes/${encodeURIComponent(preQuoteId)}/requirements`,
    { method: "POST", authenticated: true, body: formData },
  );
  if (!isCreatedRequirement(response)) {
    throw invalidResponse("El servidor no devolvió el requerimiento creado.");
  }
  return response;
}

export async function processRequirement(requirementId: string): Promise<ProcessedRequirement> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/process`,
    { method: "POST", authenticated: true },
  );
  if (!isProcessedRequirement(response)) {
    throw invalidResponse("El servidor no devolvió un resultado de análisis válido.");
  }
  return response;
}

export function getRequirementErrorMessage(error: unknown, operation: "upload" | "process"): string {
  const fallback = operation === "upload"
    ? "No fue posible crear el requerimiento."
    : "No fue posible analizar el requerimiento.";
  if (!(error instanceof ApiError)) return fallback;
  const code = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  if (code === "REQUIREMENT_PROCESSING_ALREADY_ACTIVE") {
    return "Este requerimiento ya se está procesando.";
  }
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor. Inténtalo nuevamente.",
    400: "La solicitud del requerimiento no es válida.",
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes acceso para realizar esta operación.",
    404: "No se encontró la precotización o el requerimiento.",
    409: "La operación no está disponible en el estado actual.",
    413: "Los archivos superan los límites permitidos.",
    415: "Uno de los archivos tiene un formato no compatible.",
    422: "Uno de los archivos está vacío o no se puede procesar.",
    500: fallback,
    502: "El servicio de análisis no está disponible temporalmente.",
    503: "El servicio no está disponible temporalmente.",
    504: "El análisis superó el tiempo máximo de espera.",
  };
  return messages[error.status] ?? fallback;
}
