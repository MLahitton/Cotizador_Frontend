import { isValidProjectId } from "@/features/projects/project-identifiers";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";
import type {
  GetProjectPreQuotesParameters,
  PreQuoteDetails,
  PreQuoteListItem,
  ProjectPreQuotesPage,
} from "@/features/prequotes/prequotes-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";

const INVALID_LIST_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar las precotizaciones.";
const INVALID_DETAILS_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar la precotización.";
const PREQUOTE_PROJECT_MISMATCH_DETAIL =
  "La precotización solicitada no pertenece a este proyecto.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
}

function isPreQuoteListItem(
  value: unknown,
  requestedProjectId: string,
): value is PreQuoteListItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isValidPreQuoteId(value.id) &&
    typeof value.projectId === "string" &&
    isValidProjectId(value.projectId) &&
    normalizeId(value.projectId) === normalizeId(requestedProjectId) &&
    isNonNegativeInteger(value.documentCount) &&
    isValidDateTime(value.createdAtUtc) &&
    isValidDateTime(value.updatedAtUtc)
  );
}

function isProjectPreQuotesPage(
  value: unknown,
  parameters: GetProjectPreQuotesParameters,
): value is ProjectPreQuotesPage {
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
    isPreQuoteListItem(item, parameters.projectId),
  );
}

function isPreQuoteDetails(value: unknown): value is PreQuoteDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isValidPreQuoteId(value.id) &&
    typeof value.projectId === "string" &&
    isValidProjectId(value.projectId) &&
    isNonNegativeInteger(value.documentCount) &&
    isValidDateTime(value.createdAtUtc) &&
    isValidDateTime(value.updatedAtUtc)
  );
}

export function createPreQuoteProjectMismatchError(): ApiError {
  return new ApiError({
    status: 0,
    title: "Respuesta inválida",
    detail: PREQUOTE_PROJECT_MISMATCH_DETAIL,
  });
}

export function isPreQuoteProjectMismatchError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 0 &&
    error.detail === PREQUOTE_PROJECT_MISMATCH_DETAIL
  );
}

export async function getProjectPreQuotes(
  parameters: GetProjectPreQuotesParameters,
): Promise<ProjectPreQuotesPage> {
  const query = new URLSearchParams({
    page: String(parameters.page),
    pageSize: String(parameters.pageSize),
  });

  const response = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(parameters.projectId)}/prequotes?${query.toString()}`,
    { authenticated: true },
  );

  if (!isProjectPreQuotesPage(response, parameters)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_LIST_RESPONSE_DETAIL,
    });
  }

  return response;
}

export async function getPreQuoteById(
  preQuoteId: string,
): Promise<PreQuoteDetails> {
  const response = await apiRequest(
    `/api/v1/prequotes/${encodeURIComponent(preQuoteId)}`,
    { authenticated: true },
  );

  if (!isPreQuoteDetails(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_DETAILS_RESPONSE_DETAIL,
    });
  }

  if (normalizeId(response.id) !== normalizeId(preQuoteId)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_DETAILS_RESPONSE_DETAIL,
    });
  }

  return response;
}

export function assertPreQuoteBelongsToProject(
  preQuote: PreQuoteDetails,
  projectId: string,
): void {
  if (normalizeId(preQuote.projectId) !== normalizeId(projectId)) {
    throw createPreQuoteProjectMismatchError();
  }
}
