import type {
  CanonicalCatalogAlias,
  CanonicalCatalogAliasCategory,
  CanonicalCatalogAliasMatchPolicy,
  CanonicalCatalogFinish,
  CanonicalCatalogFrame,
  CanonicalCatalogSystem,
} from "./canonical-catalog-types";

export type CanonicalCatalogSectionFilter =
  | "ALL"
  | "SYSTEMS"
  | "FRAMES"
  | "FINISHES"
  | "ALIASES";

const confidenceFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 4,
});

export function formatCanonicalAliasCategory(
  value: CanonicalCatalogAliasCategory,
): string {
  switch (value) {
    case "SYSTEM":
      return "Sistema";
    case "FRAME":
      return "Marco";
    case "FINISH":
      return "Acabado";
  }
}

export function formatCanonicalAliasMatchPolicy(
  value: CanonicalCatalogAliasMatchPolicy,
): string {
  switch (value) {
    case "EXACT_NORMALIZED":
      return "Coincidencia exacta normalizada";
    case "TECHNICAL_PHRASE":
      return "Frase técnica";
  }
}

export function formatCanonicalConfidence(value: number): string {
  return confidenceFormatter.format(value);
}

export function formatCanonicalBoolean(
  value: boolean,
  enabledLabel: string,
  disabledLabel: string,
): string {
  return value ? enabledLabel : disabledLabel;
}

export function normalizeCanonicalCatalogSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");
}

function includesSearch(values: string[], search: string): boolean {
  const normalizedSearch = normalizeCanonicalCatalogSearch(search);
  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) =>
    normalizeCanonicalCatalogSearch(value).includes(normalizedSearch),
  );
}

export function matchesCanonicalSystemSearch(
  item: CanonicalCatalogSystem,
  search: string,
): boolean {
  return includesSearch([item.code, item.name], search);
}

export function matchesCanonicalFrameSearch(
  item: CanonicalCatalogFrame,
  search: string,
): boolean {
  return includesSearch([item.code, item.name], search);
}

export function matchesCanonicalFinishSearch(
  item: CanonicalCatalogFinish,
  search: string,
): boolean {
  return includesSearch([item.code, item.name], search);
}

export function matchesCanonicalAliasSearch(
  item: CanonicalCatalogAlias,
  search: string,
): boolean {
  return includesSearch(
    [item.alias, item.normalizedAlias, item.canonicalCode],
    search,
  );
}
