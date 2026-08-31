import { apiRequest } from "@/lib/http/api-client";

import type {
  GetGlassTypesCatalogResponse,
  GlassCatalogItem,
  GlassPriceRange,
  GlassPriceRangeStatus,
} from "./glass-catalog-types";

export const INVALID_GLASS_CATALOG_RESPONSE_MESSAGE =
  "El servidor devolvió una respuesta inesperada al consultar el catálogo de vidrios.";

const CONTRACT_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

export class InvalidGlassCatalogResponseError extends Error {
  constructor() {
    super(INVALID_GLASS_CATALOG_RESPONSE_MESSAGE);
    this.name = "InvalidGlassCatalogResponseError";
  }
}

export function isInvalidGlassCatalogResponseError(
  error: unknown,
): error is InvalidGlassCatalogResponseError {
  return error instanceof InvalidGlassCatalogResponseError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isContractGuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = value.trim();
  return (
    normalizedValue === value &&
    normalizedValue.toLowerCase() !== EMPTY_GUID &&
    CONTRACT_GUID_PATTERN.test(normalizedValue)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isCurrency(value: unknown): value is string {
  return typeof value === "string" && CURRENCY_PATTERN.test(value);
}

function isGlassPriceRangeStatus(
  value: unknown,
): value is GlassPriceRangeStatus {
  return value === "PRELIMINARY" || value === "ACTIVE" || value === "RETIRED";
}

function isValidDateTime(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isValidNullableEndDate(
  value: unknown,
  validFromUtc: string,
): value is string | null {
  if (value === null) {
    return true;
  }

  if (!isValidDateTime(value)) {
    return false;
  }

  return Date.parse(value) > Date.parse(validFromUtc);
}

function isGlassPriceRange(value: unknown): value is GlassPriceRange {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isContractGuid(value.glassPriceRangeVersionId) ||
    !isPositiveInteger(value.version) ||
    !isPositiveFiniteNumber(value.minimumPricePerSquareMeter) ||
    !isPositiveFiniteNumber(value.expectedAmountPerM2) ||
    !isPositiveFiniteNumber(value.maximumPricePerSquareMeter) ||
    value.minimumPricePerSquareMeter > value.expectedAmountPerM2 ||
    value.expectedAmountPerM2 > value.maximumPricePerSquareMeter ||
    !isCurrency(value.currency) ||
    !isGlassPriceRangeStatus(value.status) ||
    !isValidDateTime(value.validFromUtc) ||
    !isValidNullableEndDate(value.validToUtc, value.validFromUtc)
  ) {
    return false;
  }

  return true;
}

function isGlassCatalogItem(value: unknown): value is GlassCatalogItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isContractGuid(value.glassTypeId) &&
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.name) &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.isSelectable === "boolean" &&
    typeof value.isActive === "boolean" &&
    (value.currentPriceRange === null ||
      isGlassPriceRange(value.currentPriceRange))
  );
}

function isGetGlassTypesCatalogResponse(
  value: unknown,
): value is GetGlassTypesCatalogResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every(isGlassCatalogItem);
}

export async function getGlassTypesCatalog(): Promise<GetGlassTypesCatalogResponse> {
  const response = await apiRequest("/api/v1/catalogs/glass-types", {
    authenticated: true,
  });

  if (!isGetGlassTypesCatalogResponse(response)) {
    throw new InvalidGlassCatalogResponseError();
  }

  return response;
}
