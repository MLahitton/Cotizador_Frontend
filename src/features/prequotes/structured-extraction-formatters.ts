import {
  formatDuration,
  formatProcessingAvailability,
} from "@/features/prequotes/prequote-document-formatters";
import type {
  EvidenceSourceType,
  RequirementCategory,
  StructuredConflictCode,
  StructuredElementType,
  StructuredExtractionStatus,
  StructuredIssueCode,
} from "@/features/prequotes/structured-extraction-types";

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
  }
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
  }
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
