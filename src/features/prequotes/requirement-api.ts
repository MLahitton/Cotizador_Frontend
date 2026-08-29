import {
  isDateTime,
  isNonEmptyString,
  isNonNegativeInteger,
  isNullableString,
  isRecord,
} from "@/features/prequotes/newpipe-guards";
import type {
  CreatedRequirement,
  CurrentRequirement,
  ProcessedRequirement,
  RequirementProcessingOutcome,
  RequirementProcessingState,
  RequirementStatus,
  RequirementCommercialLine,
  RequirementDetails,
  RequirementDocument,
  RequirementLifecycleResponse,
} from "@/features/prequotes/requirement-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const REQUIREMENT_STATUSES = ["PENDING", "PROCESSING", "PROCESSED", "FAILED", "CANCELLED", "SUPERSEDED"] as const;
const PROCESSING_STATES = ["Pending", "Processing", "Finished"] as const;
const PROCESSING_OUTCOMES = ["Completed", "RequiresReview", "Failed", "Cancelled"] as const;
const COMMERCIAL_LINES = ["CLASSIC", "ESSENTIAL", "BIOCONFORT", "SIGNATURE"] as const;

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isNullableGuid(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isRequirementDocument(value: unknown): value is RequirementDocument {
  return isRecord(value) && isNonEmptyString(value.requirementFileId) &&
    isNonEmptyString(value.fileName) && isNonEmptyString(value.contentType) &&
    isNonNegativeInteger(value.sizeBytes) && isDateTime(value.createdAtUtc);
}

function hasLifecycle(value: Record<string, unknown>): boolean {
  return typeof value.canEditDocuments === "boolean" && typeof value.canCancel === "boolean" &&
    typeof value.canReplace === "boolean" && typeof value.isCurrent === "boolean" &&
    isNullableGuid(value.supersedesRequirementId) && isNullableGuid(value.supersededByRequirementId) &&
    Array.isArray(value.documents) && value.documents.every(isRequirementDocument);
}

function isCreatedRequirement(value: unknown): value is CreatedRequirement {
  return isRecord(value) &&
    isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.preQuoteId) &&
    isNonNegativeInteger(value.fileCount) && value.fileCount > 0 &&
    isOneOf<RequirementCommercialLine>(value.commercialLine, COMMERCIAL_LINES) &&
    isOneOf<RequirementStatus>(value.status, REQUIREMENT_STATUSES) &&
    isDateTime(value.createdAtUtc) && hasLifecycle(value);
}

function isCurrentRequirement(value: unknown): value is CurrentRequirement {
  return isRecord(value) &&
    isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.preQuoteId) &&
    isOneOf<RequirementStatus>(value.status, REQUIREMENT_STATUSES) &&
    (value.commercialLine === null || isOneOf<RequirementCommercialLine>(value.commercialLine, COMMERCIAL_LINES)) &&
    isDateTime(value.createdAtUtc) &&
    typeof value.hasTechnicalProposal === "boolean" &&
    (value.technicalProposalId === null || isNonEmptyString(value.technicalProposalId)) &&
    (value.latestAttemptState === null || isOneOf<RequirementProcessingState>(value.latestAttemptState, PROCESSING_STATES)) &&
    (value.latestAttemptOutcome === null || isOneOf<RequirementProcessingOutcome>(value.latestAttemptOutcome, PROCESSING_OUTCOMES)) &&
    isNullableString(value.latestAttemptErrorCode) && hasLifecycle(value);
}

function isRequirementDetails(value: unknown): value is RequirementDetails {
  return isRecord(value) && isNonEmptyString(value.requirementId) && isNonEmptyString(value.preQuoteId) &&
    isOneOf<RequirementStatus>(value.status, REQUIREMENT_STATUSES) &&
    (value.commercialLine === null || isOneOf<RequirementCommercialLine>(value.commercialLine, COMMERCIAL_LINES)) &&
    isDateTime(value.createdAtUtc) && isDateTime(value.updatedAtUtc) && hasLifecycle(value);
}

function isLifecycleResponse(value: unknown): value is RequirementLifecycleResponse {
  return isRecord(value) && isNonEmptyString(value.requirementId) && isNonEmptyString(value.preQuoteId) &&
    isNonNegativeInteger(value.fileCount) && isOneOf<RequirementStatus>(value.status, REQUIREMENT_STATUSES) &&
    (value.commercialLine === null || isOneOf<RequirementCommercialLine>(value.commercialLine, COMMERCIAL_LINES)) &&
    isDateTime(value.updatedAtUtc) && hasLifecycle(value);
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
  return new ApiError({ status: 0, title: "Respuesta invalida", detail });
}

export async function createRequirement(preQuoteId: string, files: File[], commercialLine: RequirementCommercialLine): Promise<CreatedRequirement> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("commercialLine", commercialLine);
  const response = await apiRequest(
    `/api/v2/prequotes/${encodeURIComponent(preQuoteId)}/requirements`,
    { method: "POST", authenticated: true, body: formData },
  );
  if (!isCreatedRequirement(response)) {
    throw invalidResponse("El servidor no devolvio el requerimiento creado.");
  }
  return response;
}

export async function getCurrentRequirement(preQuoteId: string): Promise<CurrentRequirement | null> {
  try {
    const response = await apiRequest(
      `/api/v2/prequotes/${encodeURIComponent(preQuoteId)}/requirements/current`,
      { authenticated: true },
    );
    if (!isCurrentRequirement(response)) {
      throw invalidResponse("El servidor no devolvio el requerimiento guardado.");
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function processRequirement(requirementId: string): Promise<ProcessedRequirement> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/process`,
    { method: "POST", authenticated: true },
  );
  if (!isProcessedRequirement(response)) {
    throw invalidResponse("El servidor no devolvio un resultado de analisis valido.");
  }
  return response;
}

export async function cancelRequirementProcessing(requirementId: string): Promise<ProcessedRequirement> {
  const response = await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/process/cancel`, { method: "POST", authenticated: true });
  if (!isProcessedRequirement(response)) throw invalidResponse("El servidor no devolvio el resultado de cancelacion del analisis.");
  return response;
}

export async function cancelRequirementProcessingAttempt(processingAttemptId: string): Promise<ProcessedRequirement> {
  const response = await apiRequest(`/api/v2/processing-attempts/${encodeURIComponent(processingAttemptId)}/cancel`, { method: "POST", authenticated: true });
  if (!isProcessedRequirement(response)) throw invalidResponse("El servidor no devolvio el resultado de cancelacion del analisis.");
  return response;
}

export async function getRequirementById(requirementId: string): Promise<RequirementDetails> {
  const response = await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}`, { authenticated: true });
  if (!isRequirementDetails(response)) throw invalidResponse("El servidor no devolvio el detalle del requerimiento.");
  return response;
}

export async function getRequirementDocuments(requirementId: string): Promise<RequirementDocument[]> {
  const response = await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/documents`, { authenticated: true });
  if (!Array.isArray(response) || !response.every(isRequirementDocument)) throw invalidResponse("El servidor no devolvio los documentos del requerimiento.");
  return response;
}

function documentForm(files: File[]): FormData {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return form;
}

async function lifecycleRequest(path: string, method: "POST" | "PUT" | "DELETE", files?: File[]): Promise<RequirementLifecycleResponse> {
  const response = await apiRequest(path, { method, authenticated: true, body: files ? documentForm(files) : undefined });
  if (!isLifecycleResponse(response)) throw invalidResponse("El servidor no devolvio el estado actualizado del requerimiento.");
  return response;
}

export function addRequirementDocument(requirementId: string, file: File) {
  return lifecycleRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/documents`, "POST", [file]);
}

export function removeRequirementDocument(requirementId: string, requirementFileId: string) {
  return lifecycleRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/documents/${encodeURIComponent(requirementFileId)}`, "DELETE");
}

export function replaceRequirementDocument(requirementId: string, requirementFileId: string, file: File) {
  return lifecycleRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/documents/${encodeURIComponent(requirementFileId)}`, "PUT", [file]);
}

export function cancelRequirement(requirementId: string) {
  return lifecycleRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/cancel`, "POST");
}

export function replaceRequirement(requirementId: string, files: File[]) {
  return lifecycleRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/replacement`, "POST", files);
}

function getProblemDetailsCode(error: ApiError): string | null {
  const value = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getRequirementErrorMessage(error: unknown, operation: "upload" | "process" | "current" | "lifecycle"): string {
  const fallback = operation === "upload"
    ? "No fue posible crear el requerimiento."
    : operation === "current"
      ? "No fue posible cargar el analisis guardado."
      : "No fue posible analizar el requerimiento.";
  if (!(error instanceof ApiError)) return fallback;
  const code = getProblemDetailsCode(error);
  const codeMessages: Record<string, string> = {
    REQUIREMENT_PROCESSING_ALREADY_ACTIVE: "Este requerimiento ya se encuentra en analisis.",
    REQUIREMENT_AI2_SERVICE_UNAVAILABLE: "No fue posible conectar con el servicio de analisis.",
    REQUIREMENT_AI2_TIMEOUT: "El analisis tomo mas tiempo del permitido.",
    REQUIREMENT_AI2_REJECTED: "El servicio de analisis rechazo la solicitud.",
    AI_INVALID_RESPONSE: "El analisis no devolvio una respuesta valida.",
    REQUIREMENT_AI2_SERVICE_ERROR: "El servicio de analisis no pudo completar la solicitud.",
    REQUIREMENT_PERSISTENCE_ERROR: "No fue posible guardar el resultado del analisis.",
    REQUIREMENT_STORAGE_ERROR: "No fue posible leer o guardar los archivos del requerimiento.",
    REQUIREMENT_PROCESSING_POLL_TIMEOUT: "El analisis esta tardando mas de lo esperado. Puedes volver a consultar el estado mas adelante.",
    REQUIREMENT_PROCESSING_FAILED: "El analisis del requerimiento no pudo completarse.",
    REQUIREMENT_PROCESSING_CANCELLED: "Extraccion detenida. Puedes iniciar el analisis nuevamente.",
    REQUIREMENT_NO_FILES: "El requerimiento no tiene archivos disponibles para analizar.",
    REQUIREMENT_UNSUPPORTED_FILE_TYPE: "Uno de los archivos tiene un formato no compatible.",
    REQUIREMENT_EMPTY_FILE: "Uno de los archivos esta vacio.",
    REQUIREMENT_FILE_TOO_LARGE: "Uno de los archivos supera el limite permitido.",
    REQUIREMENT_TOO_MANY_FILES: "Se supero la cantidad maxima de archivos permitida.",
    REQUIREMENT_PROJECT_INACTIVE: "El proyecto esta inactivo.",
    REQUIREMENT_CLIENT_INACTIVE: "El cliente asociado esta inactivo.",
    REQUIREMENT_PREQUOTE_NOT_FOUND: "No se encontro la precotizacion asociada.",
    REQUIREMENT_NOT_FOUND: "No se encontro el requerimiento.",
    REQUIREMENT_NOT_MUTABLE: "Los documentos ya no se pueden modificar. Se actualizo el estado del Requirement.",
    REQUIREMENT_NOT_REPLACEABLE: "Este Requirement ya no se puede reemplazar. Se actualizo su estado.",
  };
  if (code && code in codeMessages) return codeMessages[code];
  const messages: Record<number, string> = {
    0: fallback,
    400: "La solicitud del requerimiento no es valida.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    403: "No tienes acceso para realizar esta operacion.",
    404: operation === "current"
      ? "Aun no se ha procesado un requerimiento para esta precotizacion."
      : "No se encontro la precotizacion o el requerimiento.",
    409: "La operacion no esta disponible en el estado actual.",
    413: "Los archivos superan los limites permitidos.",
    415: "Uno de los archivos tiene un formato no compatible.",
    422: "Uno de los archivos esta vacio o no se puede procesar.",
    500: fallback,
    502: "El servicio de analisis no esta disponible temporalmente.",
    503: "El servicio no esta disponible temporalmente.",
    504: "El analisis supero el tiempo maximo de espera.",
  };
  return messages[error.status] ?? fallback;
}
