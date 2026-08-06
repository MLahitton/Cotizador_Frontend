import type { BadgeProps } from "@/components/ui/badge";
import { formatPreQuoteDateTime } from "@/features/prequotes/prequote-formatters";
import { formatPricePerSquareMeterRange } from "@/features/prequotes/structured-extraction-formatters";

import type {
  GlassCatalogItem,
  GlassPriceRange,
  GlassPriceRangeStatus,
} from "./glass-catalog-types";

export type GlassCatalogStatusFilter =
  | GlassPriceRangeStatus
  | "ALL"
  | "NO_CURRENT_RANGE";

export function formatGlassPriceRange(
  priceRange: GlassPriceRange,
): string {
  return formatPricePerSquareMeterRange(
    priceRange.minimumPricePerSquareMeter,
    priceRange.expectedAmountPerM2,
    priceRange.maximumPricePerSquareMeter,
    priceRange.currency,
  );
}

export function formatGlassCurrency(value: string): string {
  return value.trim().toUpperCase();
}

export function formatGlassPriceRangeStatus(
  value: GlassPriceRangeStatus,
): string {
  switch (value) {
    case "PRELIMINARY":
      return "Preliminar";
    case "ACTIVE":
      return "Activo";
    case "RETIRED":
      return "Retirado";
  }
}

export function getGlassPriceRangeStatusTone(
  value: GlassPriceRangeStatus,
): BadgeProps["tone"] {
  switch (value) {
    case "PRELIMINARY":
      return "warning";
    case "ACTIVE":
      return "success";
    case "RETIRED":
      return "neutral";
  }
}

export function formatGlassPriceRangeVersion(version: number): string {
  return `Versión ${version}`;
}

export function formatGlassValidity(priceRange: GlassPriceRange): string {
  const startsAt = `Vigente desde ${formatPreQuoteDateTime(
    priceRange.validFromUtc,
  )}`;

  if (priceRange.validToUtc === null) {
    return `${startsAt}. Rango actual`;
  }

  return `${startsAt}. Vigente hasta ${formatPreQuoteDateTime(
    priceRange.validToUtc,
  )}`;
}

export function normalizeGlassCatalogSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");
}

export function matchesGlassCatalogSearch(
  item: GlassCatalogItem,
  search: string,
): boolean {
  const normalizedSearch = normalizeGlassCatalogSearch(search);
  if (!normalizedSearch) {
    return true;
  }

  return [item.code, item.name, item.description ?? ""].some((value) =>
    normalizeGlassCatalogSearch(value).includes(normalizedSearch),
  );
}
