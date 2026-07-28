import type {
  ClientListItem,
  ClientsPage,
  GetClientsParameters,
} from "@/features/clients/clients-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const INVALID_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar clientes.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isValidPageSize(value: unknown): value is number {
  return isPositiveInteger(value) && value <= 100;
}

function isClientListItem(value: unknown): value is ClientListItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.clientType === "string" &&
    typeof value.legalName === "string" &&
    isNullableString(value.tradeName) &&
    isNullableString(value.documentType) &&
    isNullableString(value.documentNumber) &&
    isNullableString(value.email) &&
    isNullableString(value.phone) &&
    isNullableString(value.address) &&
    isNullableString(value.city) &&
    typeof value.isActive === "boolean" &&
    typeof value.createdAtUtc === "string" &&
    typeof value.updatedAtUtc === "string"
  );
}

function isClientsPage(value: unknown): value is ClientsPage {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  return (
    value.items.every(isClientListItem) &&
    isPositiveInteger(value.page) &&
    isValidPageSize(value.pageSize) &&
    isNonNegativeInteger(value.totalCount) &&
    isNonNegativeInteger(value.totalPages)
  );
}

export async function getClients(
  parameters: GetClientsParameters,
): Promise<ClientsPage> {
  const query = new URLSearchParams({
    status: parameters.status,
    page: String(parameters.page),
    pageSize: String(parameters.pageSize),
  });

  const normalizedSearch = parameters.search?.trim();
  if (normalizedSearch) {
    query.set("search", normalizedSearch);
  }

  const response = await apiRequest(`/api/v1/clients?${query.toString()}`, {
    authenticated: true,
  });

  if (!isClientsPage(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_RESPONSE_DETAIL,
    });
  }

  return response;
}
