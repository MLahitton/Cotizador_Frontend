import { apiRequest } from "@/lib/http/api-client";

import type {
  CanonicalCatalogAlias,
  CanonicalCatalogAliasCategory,
  CanonicalCatalogAliasMatchPolicy,
  CanonicalCatalogFinish,
  CanonicalCatalogFrame,
  CanonicalCatalogSystem,
  GetCanonicalCatalogResponse,
} from "./canonical-catalog-types";

export const INVALID_CANONICAL_CATALOG_RESPONSE_MESSAGE =
  "El servidor devolvió una respuesta inesperada al consultar el catálogo técnico.";

const CANONICAL_CODE_PATTERN = /^[A-Z0-9_-]{1,30}$/;

export class InvalidCanonicalCatalogResponseError extends Error {
  constructor() {
    super(INVALID_CANONICAL_CATALOG_RESPONSE_MESSAGE);
    this.name = "InvalidCanonicalCatalogResponseError";
  }
}

export function isInvalidCanonicalCatalogResponseError(
  error: unknown,
): error is InvalidCanonicalCatalogResponseError {
  return error instanceof InvalidCanonicalCatalogResponseError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrimmedStringWithLength(
  value: unknown,
  maximumLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim() === value &&
    value.length <= maximumLength
  );
}

function isCanonicalCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    CANONICAL_CODE_PATTERN.test(value)
  );
}

function isAliasCategory(
  value: unknown,
): value is CanonicalCatalogAliasCategory {
  return value === "SYSTEM" || value === "FRAME" || value === "FINISH";
}

function isAliasMatchPolicy(
  value: unknown,
): value is CanonicalCatalogAliasMatchPolicy {
  return value === "EXACT_NORMALIZED" || value === "TECHNICAL_PHRASE";
}

function isAliasConfidence(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isCanonicalCatalogSystem(
  value: unknown,
): value is CanonicalCatalogSystem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCanonicalCode(value.code) &&
    isTrimmedStringWithLength(value.name, 100) &&
    ["technicalName", "commercialName", "functionalType", "family", "series", "commercialLine", "variant"]
      .every((key) => value[key] === null || typeof value[key] === "string") &&
    typeof value.isSelectable === "boolean" &&
    typeof value.activeForRecognition === "boolean" &&
    typeof value.priceable === "boolean" &&
    typeof value.futurePriceable === "boolean" &&
    typeof value.requiresReview === "boolean" &&
    typeof value.isActive === "boolean"
  );
}

function isCanonicalCatalogFrame(
  value: unknown,
): value is CanonicalCatalogFrame {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCanonicalCode(value.code) &&
    isTrimmedStringWithLength(value.name, 100) &&
    typeof value.isActive === "boolean"
  );
}

function isCanonicalCatalogFinish(
  value: unknown,
): value is CanonicalCatalogFinish {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCanonicalCode(value.code) &&
    isTrimmedStringWithLength(value.name, 100) &&
    typeof value.requiresReview === "boolean" &&
    typeof value.isActive === "boolean"
  );
}

function isCanonicalCatalogAlias(
  value: unknown,
): value is CanonicalCatalogAlias {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isAliasCategory(value.category) &&
    isTrimmedStringWithLength(value.alias, 200) &&
    isTrimmedStringWithLength(value.normalizedAlias, 200) &&
    isCanonicalCode(value.canonicalCode) &&
    isAliasMatchPolicy(value.matchPolicy) &&
    typeof value.requiresContext === "boolean" &&
    isAliasConfidence(value.confidence) &&
    typeof value.isActive === "boolean"
  );
}

function isGetCanonicalCatalogResponse(
  value: unknown,
): value is GetCanonicalCatalogResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.systems) ||
    !Array.isArray(value.frames) ||
    !Array.isArray(value.finishes) ||
    !Array.isArray(value.aliases)
  ) {
    return false;
  }

  return (
    value.systems.every(isCanonicalCatalogSystem) &&
    value.frames.every(isCanonicalCatalogFrame) &&
    value.finishes.every(isCanonicalCatalogFinish) &&
    value.aliases.every(isCanonicalCatalogAlias)
  );
}

export async function getCanonicalCatalog(): Promise<GetCanonicalCatalogResponse> {
  const response = await apiRequest("/api/v1/catalogs/canonical", {
    authenticated: true,
  });

  if (!isGetCanonicalCatalogResponse(response)) {
    throw new InvalidCanonicalCatalogResponseError();
  }

  return response;
}
