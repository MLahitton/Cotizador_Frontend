import type {
  GlobalSearchClient,
  GlobalSearchPreQuote,
  GlobalSearchProject,
  GlobalSearchResult,
} from "@/features/search/global-search-types";

import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function invalidResponseError(): ApiError {
  return new ApiError({
    status: 0,
    title: "Respuesta inválida",
    detail:
      "El servidor devolvió una respuesta de búsqueda inesperada.",
  });
}

function requireString(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidResponseError();
  }

  return value;
}

function requireNullableString(
  value: unknown,
): string | null {
  if (value === null) {
    return null;
  }

  return requireString(value);
}

function parseProject(
  value: unknown,
): GlobalSearchProject {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    projectId: requireString(value.projectId),
    code: requireString(value.code),
    name: requireString(value.name),
    clientName: requireString(value.clientName),
  };
}

function parsePreQuote(
  value: unknown,
): GlobalSearchPreQuote {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    preQuoteId: requireString(value.preQuoteId),
    serial: requireString(value.serial),
    name: requireNullableString(value.name),
    projectId: requireString(value.projectId),
    projectCode: requireString(value.projectCode),
    projectName: requireString(value.projectName),
  };
}

function parseClient(
  value: unknown,
): GlobalSearchClient {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    clientId: requireString(value.clientId),
    name: requireString(value.name),
    documentType: requireNullableString(
      value.documentType,
    ),
    documentNumber: requireNullableString(
      value.documentNumber,
    ),
  };
}

function parseSearchResult(
  value: unknown,
): GlobalSearchResult {
  if (
    !isRecord(value) ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.preQuotes) ||
    !Array.isArray(value.clients)
  ) {
    throw invalidResponseError();
  }

  return {
    projects: value.projects.map(parseProject),
    preQuotes: value.preQuotes.map(parsePreQuote),
    clients: value.clients.map(parseClient),
  };
}

export async function searchGlobal(
  query: string,
): Promise<GlobalSearchResult> {
  const response = await apiRequest(
    `/api/v1/search?q=${encodeURIComponent(query)}`,
    {
      authenticated: true,
    },
  );

  return parseSearchResult(response);
}