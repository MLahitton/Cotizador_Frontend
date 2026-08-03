import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import type {
  DocumentExtractionResultMetadata,
  DocumentProcessingAttemptSummary,
  DocumentProcessingAvailability,
  DocumentProcessingOutcome,
  DocumentProcessingState,
  GetPreQuoteDocumentsParameters,
  PdfClassification,
  PreQuoteDocumentListItem,
  PreQuoteDocumentsPage,
  StartedDocumentProcessingAttempt,
  StructuredExtractionStatus,
  StructuredExtractionSummary,
  UploadedPreQuoteDocument,
} from "@/features/prequotes/prequote-documents-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const INVALID_UPLOAD_DOCUMENT_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al registrar el documento.";
const INVALID_START_PROCESSING_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al iniciar el procesamiento.";

const INVALID_DOCUMENTS_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar los documentos.";

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
const STRUCTURED_EXTRACTION_STATUSES = [
  "COMPLETED",
  "REQUIRES_REVIEW",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isValidDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isNullableDateTime(value: unknown): value is string | null {
  return value === null || isValidDateTime(value);
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

function isStructuredExtractionStatus(
  value: unknown,
): value is StructuredExtractionStatus {
  return isStringIn(value, STRUCTURED_EXTRACTION_STATUSES);
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

function isStructuredExtractionSummary(
  value: unknown,
): value is StructuredExtractionSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.structuredExtractionId === "string" &&
    isValidPreQuoteId(value.structuredExtractionId) &&
    typeof value.sourceProcessingAttemptId === "string" &&
    isValidPreQuoteId(value.sourceProcessingAttemptId) &&
    typeof value.isFromLatestAttempt === "boolean" &&
    isStructuredExtractionStatus(value.status) &&
    (value.projectName === null || typeof value.projectName === "string") &&
    (value.clientName === null || typeof value.clientName === "string") &&
    (value.location === null || typeof value.location === "string") &&
    isNonNegativeInteger(value.itemCount) &&
    isNonNegativeInteger(value.documentReferenceCount) &&
    isNonNegativeInteger(value.itemsRequiringReview) &&
    isNonNegativeInteger(value.knownQuoteableUnitCount) &&
    isNonNegativeInteger(value.issueCount) &&
    isNonNegativeInteger(value.conflictCount) &&
    isNonEmptyString(value.processingMethod) &&
    isNonNegativeInteger(value.durationMs) &&
    isValidDateTime(value.createdAtUtc)
  );
}

function isPreQuoteDocumentListItem(
  value: unknown,
  requestedPreQuoteId: string,
): value is PreQuoteDocumentListItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.documentId === "string" &&
    isValidPreQuoteId(value.documentId) &&
    typeof value.preQuoteId === "string" &&
    isValidPreQuoteId(value.preQuoteId) &&
    idsMatch(value.preQuoteId, requestedPreQuoteId) &&
    isNonEmptyString(value.originalFileName) &&
    isNonEmptyString(value.contentType) &&
    isPositiveInteger(value.sizeBytes) &&
    isValidDateTime(value.createdAtUtc) &&
    isProcessingAvailability(value.processingAvailability) &&
    (value.latestAttempt === null || isLatestAttempt(value.latestAttempt)) &&
    (value.structuredExtractionSummary === null ||
      isStructuredExtractionSummary(value.structuredExtractionSummary))
  );
}

function isPreQuoteDocumentsPage(
  value: unknown,
  parameters: GetPreQuoteDocumentsParameters,
): value is PreQuoteDocumentsPage {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  if (
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !isNonNegativeInteger(value.totalPages) ||
    value.page !== parameters.page ||
    value.pageSize !== parameters.pageSize ||
    value.items.length > parameters.pageSize
  ) {
    return false;
  }

  if (value.totalCount === 0 && value.items.length !== 0) {
    return false;
  }

  return value.items.every((item) =>
    isPreQuoteDocumentListItem(item, parameters.preQuoteId),
  );
}

export class InvalidStartDocumentProcessingResponseError extends Error {
  constructor() {
    super(INVALID_START_PROCESSING_RESPONSE_DETAIL);
    this.name = "InvalidStartDocumentProcessingResponseError";
  }
}

export function isInvalidStartDocumentProcessingResponseError(
  error: unknown,
): error is InvalidStartDocumentProcessingResponseError {
  return error instanceof InvalidStartDocumentProcessingResponseError;
}

function isValidAttemptLifecycle(value: {
  processingState: DocumentProcessingState;
  outcome: DocumentProcessingOutcome | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
}): boolean {
  if (
    value.startedAtUtc &&
    value.completedAtUtc &&
    Date.parse(value.completedAtUtc) < Date.parse(value.startedAtUtc)
  ) {
    return false;
  }

  switch (value.processingState) {
    case "PENDING":
      return value.outcome === null && value.completedAtUtc === null;
    case "PROCESSING":
      return (
        isValidDateTime(value.startedAtUtc) &&
        value.outcome === null &&
        value.completedAtUtc === null
      );
    case "FINISHED":
      return value.outcome !== null && isValidDateTime(value.completedAtUtc);
  }
}

function isStartedDocumentProcessingAttempt(
  value: unknown,
  requestedDocumentId: string,
): value is StartedDocumentProcessingAttempt {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.processingAttemptId !== "string" ||
    !isValidPreQuoteId(value.processingAttemptId) ||
    typeof value.documentId !== "string" ||
    !isValidPreQuoteId(value.documentId) ||
    !idsMatch(value.documentId, requestedDocumentId) ||
    !isProcessingState(value.processingState) ||
    !(value.outcome === null || isProcessingOutcome(value.outcome)) ||
    !(value.errorCode === null || isNonEmptyString(value.errorCode)) ||
    !isValidDateTime(value.createdAtUtc) ||
    !isNullableDateTime(value.startedAtUtc) ||
    !isNullableDateTime(value.completedAtUtc) ||
    !("result" in value)
  ) {
    return false;
  }

  return isValidAttemptLifecycle({
    processingState: value.processingState,
    outcome: value.outcome,
    startedAtUtc: value.startedAtUtc,
    completedAtUtc: value.completedAtUtc,
  });
}

export class InvalidUploadPreQuoteDocumentResponseError extends Error {
  constructor() {
    super(INVALID_UPLOAD_DOCUMENT_RESPONSE_DETAIL);
    this.name = "InvalidUploadPreQuoteDocumentResponseError";
  }
}

export function isInvalidUploadPreQuoteDocumentResponseError(
  error: unknown,
): error is InvalidUploadPreQuoteDocumentResponseError {
  return error instanceof InvalidUploadPreQuoteDocumentResponseError;
}

function isUploadedPreQuoteDocument(
  value: unknown,
  requestedPreQuoteId: string,
): value is UploadedPreQuoteDocument {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isValidPreQuoteId(value.id) &&
    typeof value.preQuoteId === "string" &&
    isValidPreQuoteId(value.preQuoteId) &&
    idsMatch(value.preQuoteId, requestedPreQuoteId) &&
    isNonEmptyString(value.originalFileName) &&
    isNonEmptyString(value.contentType) &&
    isPositiveInteger(value.sizeBytes) &&
    isValidDateTime(value.createdAtUtc)
  );
}

export async function getPreQuoteDocuments(
  parameters: GetPreQuoteDocumentsParameters,
): Promise<PreQuoteDocumentsPage> {
  const query = new URLSearchParams({
    page: String(parameters.page),
    pageSize: String(parameters.pageSize),
  });

  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(parameters.preQuoteId)}/documents?${query.toString()}`,
    { authenticated: true },
  );

  if (!isPreQuoteDocumentsPage(response, parameters)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_DOCUMENTS_RESPONSE_DETAIL,
    });
  }

  return response;
}

export async function uploadPreQuoteDocument(
  preQuoteId: string,
  file: File,
): Promise<UploadedPreQuoteDocument> {
  if (!isValidPreQuoteId(preQuoteId)) {
    throw new InvalidUploadPreQuoteDocumentResponseError();
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(preQuoteId)}/documents`,
    {
      method: "POST",
      authenticated: true,
      body: formData,
    },
  );

  if (!isUploadedPreQuoteDocument(response, preQuoteId)) {
    throw new InvalidUploadPreQuoteDocumentResponseError();
  }

  return response;
}

export async function startPreQuoteDocumentProcessing(
  documentId: string,
): Promise<StartedDocumentProcessingAttempt> {
  if (!isValidPreQuoteId(documentId)) {
    throw new InvalidStartDocumentProcessingResponseError();
  }

  const response = await apiRequest(
    `/api/v1/prequote-documents/${encodeURIComponent(documentId)}/processing-attempts`,
    {
      method: "POST",
      authenticated: true,
    },
  );

  if (!isStartedDocumentProcessingAttempt(response, documentId)) {
    throw new InvalidStartDocumentProcessingResponseError();
  }

  return response;
}
