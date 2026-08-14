import {
  formatDuration,
  formatProcessingAvailability,
} from "@/features/prequotes/prequote-document-formatters";
export { formatTechnicalClassificationSource } from "@/features/prequotes/prequote-technical-formatters";
import type {
  EvidenceSourceType,
  GlassAssignmentScope,
  GlassReviewReason,
  GlassValuationReason,
  GlassValuationStatus,
  RequirementCategory,
  StructuredConflictCode,
  StructuredElementType,
  StructuredEvidence,
  StructuredExtractionStatus,
  StructuredIssueCode,
} from "@/features/prequotes/structured-extraction-types";

const AREA_FORMATTER = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 4,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

export function formatNullableText(value: string | null): string {
  return value?.trim() ? value : "—";
}

export function formatSourcePages(pages: number[]): string {
  if (pages.length === 0) {
    return "—";
  }

  if (pages.length === 1) {
    return `Página ${pages[0]}`;
  }

  if (pages.length === 2) {
    return `Páginas ${pages[0]} y ${pages[1]}`;
  }

  const lastPage = pages[pages.length - 1];
  return `Páginas ${pages.slice(0, -1).join(", ")} y ${lastPage}`;
}

export function formatEvidenceSource(value: EvidenceSourceType): string {
  switch (value) {
    case "NATIVE":
      return "Texto nativo";
    case "OCR":
      return "OCR";
    case "XLSX":
      return "XLSX";
    case "PDF":
      return "PDF";
    case "IMAGE":
      return "Imagen";
    case "DOCUMENT":
      return "Documento";
  }
}

export function formatEvidenceLocation(value: StructuredEvidence): string {
  if (value.sourceType === "XLSX") {
    return `Hoja ${value.sheetName} Â· ${value.cellRange}`;
  }

  return value.pageNumber === null
    ? "Ubicación no especificada"
    : `Página ${value.pageNumber}`;
}

export function formatRequirementCategory(value: RequirementCategory): string {
  switch (value) {
    case "GLASS_SPECIFICATION":
      return "Especificación de vidrio";
    case "PROFILE_SPECIFICATION":
      return "Especificación de perfil";
    case "FINISH":
      return "Acabado";
    case "ACCESSORIES_AND_SEALANTS":
      return "Accesorios y sellantes";
    case "GENERAL_NOTE":
      return "Nota general";
  }
}

export function formatElementType(value: StructuredElementType): string {
  switch (value) {
    case "WINDOW":
      return "Ventana";
    case "DOOR":
      return "Puerta";
    case "FACADE":
      return "Fachada";
    case "PARTITION":
      return "División";
    case "RAILING":
      return "Baranda";
    case "SKYLIGHT":
      return "Lucernario";
    case "SHOWER_DIVISION":
      return "División de baño";
    case "OTHER":
      return "Otro";
  }
}

export function formatStructuredStatus(value: StructuredExtractionStatus): string {
  switch (value) {
    case "COMPLETED":
      return "Extracción completa";
    case "REQUIRES_REVIEW":
      return "Requiere revisión";
  }
}

export function formatIssueCode(value: StructuredIssueCode): string {
  switch (value) {
    case "PROJECT_NAME_NOT_FOUND":
      return "No se identificó el nombre del proyecto";
    case "NO_QUOTEABLE_ITEMS_FOUND":
      return "No se identificaron ítems cotizables";
    case "INCOMPLETE_TABLE_ROW":
      return "Fila incompleta";
    case "MISSING_ITEM_REFERENCE":
      return "Referencia faltante";
    case "MISSING_OR_INVALID_MEASUREMENTS":
      return "Medidas faltantes o inválidas";
    case "MISSING_OR_INVALID_QUANTITY":
      return "Cantidad faltante o inválida";
    case "UNKNOWN_ELEMENT_TYPE":
      return "Tipo de elemento no reconocido";
    case "OCR_REVIEW_REQUIRED":
      return "El texto obtenido por OCR requiere revisión";
    case "GLASS_TYPE_NOT_IDENTIFIED":
      return "No se pudo identificar el tipo exacto de vidrio.";
    case "GLASS_TYPE_AMBIGUOUS":
      return "Se encontraron varias interpretaciones posibles para el vidrio.";
    case "GLASS_TYPE_CONFLICT":
      return "Se detectaron especificaciones de vidrio contradictorias.";
  }
}

export function formatReviewReason(value: string): string {
  switch (value) {
    case "PROJECT_NAME_NOT_FOUND":
    case "NO_QUOTEABLE_ITEMS_FOUND":
    case "INCOMPLETE_TABLE_ROW":
    case "MISSING_ITEM_REFERENCE":
    case "MISSING_OR_INVALID_MEASUREMENTS":
    case "MISSING_OR_INVALID_QUANTITY":
    case "UNKNOWN_ELEMENT_TYPE":
    case "OCR_REVIEW_REQUIRED":
    case "GLASS_TYPE_NOT_IDENTIFIED":
    case "GLASS_TYPE_AMBIGUOUS":
    case "GLASS_TYPE_CONFLICT":
      return formatIssueCode(value);
    default:
      return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
  }
}

export function formatGlassAssignmentScope(value: GlassAssignmentScope): string {
  switch (value) {
    case "ITEM":
      return "Ítem";
    case "SECTION":
      return "Sección";
    case "GENERAL":
      return "General";
    case "UNASSIGNED":
      return "Sin asignar";
  }
}

export function formatGlassAssignmentScopeDescription(
  value: GlassAssignmentScope,
): string {
  switch (value) {
    case "ITEM":
      return "Especificación asociada directamente al ítem.";
    case "SECTION":
      return "Especificación heredada de la sección del documento.";
    case "GENERAL":
      return "Especificación general detectada en el documento.";
    case "UNASSIGNED":
      return "No fue posible asociar la especificación a un alcance concreto.";
  }
}

export function formatGlassReviewReason(value: GlassReviewReason): string {
  return formatIssueCode(value);
}

export function formatGlassValuationStatus(value: GlassValuationStatus): string {
  switch (value) {
    case "VALUED":
      return "Valorado";
    case "NOT_VALUED":
      return "No valorado";
  }
}

export function formatGlassValuationReason(
  value: GlassValuationReason,
): string {
  switch (value) {
    case "MISSING_MEASUREMENTS":
      return "Faltan medidas válidas para calcular el área.";
    case "MISSING_QUANTITY":
      return "Falta la cantidad del ítem.";
    case "GLASS_NOT_NORMALIZED":
      return "El vidrio no tiene un código normalizado.";
    case "GLASS_TYPE_NOT_RESOLVED":
      return "No se pudo resolver el tipo de vidrio en el catálogo.";
    case "PRICE_RANGE_NOT_AVAILABLE":
      return "No existe un rango de precio disponible para este vidrio.";
    case "CURRENCY_MISMATCH":
      return "Los precios disponibles utilizan monedas incompatibles.";
  }
}

export function formatPriceRangeStatus(value: string): string {
  switch (value) {
    case "PRELIMINARY":
      return "Preliminar";
    case "ACTIVE":
      return "Activo";
    case "RETIRED":
      return "Retirado";
    default:
      return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
  }
}

export function formatAggregationIssue(value: string | null): string {
  switch (value) {
    case "CURRENCY_MISMATCH":
      return "Los valores disponibles utilizan monedas diferentes.";
    case null:
      return "No fue posible consolidar un único rango económico con la información disponible.";
    default:
      return "No fue posible consolidar un único rango económico con la información disponible.";
  }
}

export function formatAreaSquareMeters(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${AREA_FORMATTER.format(value)} m²`;
}

function sanitizeCurrencyCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export function formatMoneyAmount(
  value: number | null,
  currency: string | null,
): string {
  if (value === null) {
    return "—";
  }

  const sanitizedCurrency = sanitizeCurrencyCode(currency);
  if (!sanitizedCurrency) {
    return currency?.trim()
      ? `${DECIMAL_FORMATTER.format(value)} ${currency.trim()}`
      : DECIMAL_FORMATTER.format(value);
  }

  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: sanitizedCurrency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${DECIMAL_FORMATTER.format(value)} ${sanitizedCurrency}`;
  }
}

export function formatMoneyRange(
  minimum: number | null,
  expected: number | null,
  maximum: number | null,
  currency: string | null,
): string {
  if (minimum !== null && expected !== null && maximum !== null) {
    if (minimum === expected && expected === maximum) {
      return formatMoneyAmount(expected, currency);
    }

    return `${formatMoneyAmount(minimum, currency)} / ${formatMoneyAmount(
      expected,
      currency,
    )} / ${formatMoneyAmount(maximum, currency)}`;
  }

  if (minimum !== null && maximum !== null) {
    if (minimum === maximum) {
      return formatMoneyAmount(minimum, currency);
    }

    return `${formatMoneyAmount(minimum, currency)} – ${formatMoneyAmount(
      maximum,
      currency,
    )}`;
  }

  if (expected !== null) {
    return `Esperado ${formatMoneyAmount(expected, currency)}`;
  }

  if (minimum !== null) {
    return `Desde ${formatMoneyAmount(minimum, currency)}`;
  }

  if (maximum !== null) {
    return `Hasta ${formatMoneyAmount(maximum, currency)}`;
  }

  return "Sin rango económico disponible.";
}

export function formatPricePerSquareMeterRange(
  minimum: number | null,
  expected: number | null,
  maximum: number | null,
  currency: string | null,
): string {
  const range = formatMoneyRange(minimum, expected, maximum, currency);
  return range === "Sin rango económico disponible." ? range : `${range} por m²`;
}

export function formatConflictCode(value: StructuredConflictCode): string {
  switch (value) {
    case "CONFLICTING_PROJECT_NAME":
      return "Nombres de proyecto diferentes";
    case "CONFLICTING_CLIENT_NAME":
      return "Nombres de cliente diferentes";
    case "CONFLICTING_LOCATION":
      return "Ubicaciones diferentes";
    case "DUPLICATE_ITEM_REFERENCE":
      return "Referencia de ítem duplicada";
  }
}

export function formatProcessingMethod(value: string): string {
  return value === "rule_based_v1"
    ? "Análisis estructurado por reglas"
    : "Proceso de extracción estructurada";
}

export function formatExtractionDuration(durationMs: number): string {
  return formatDuration(durationMs);
}

export function formatMissingExtractionDetail(
  value: Parameters<typeof formatProcessingAvailability>[0],
): string {
  switch (value) {
    case "NOT_PROCESSED":
      return "El documento aún no ha sido procesado.";
    case "PENDING":
      return "El documento está pendiente de procesamiento.";
    case "PROCESSING":
      return "El documento se está procesando.";
    case "FAILED":
      return "No fue posible generar una extracción para este documento.";
    case "LEGACY_ONLY":
      return "El procesamiento anterior no generó una extracción estructurada.";
    case "AVAILABLE_CURRENT":
    case "AVAILABLE_PREVIOUS":
      return "El detalle de la extracción no está disponible.";
  }
}
