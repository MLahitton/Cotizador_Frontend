import type {
  PreQuoteDraftElementType,
  PreQuoteDraftEvidenceSourceType,
  PreQuoteDraftGlassAssignmentScope,
  PreQuoteDraftGlassReviewReason,
  PreQuoteDraftOrigin,
  PreQuoteDraftRequirementCategory,
  PreQuoteDraftResolutionStatus,
  PreQuoteDraftStatus,
  PreQuoteDraftValuationInvalidationReason,
  PreQuoteDraftValuationReason,
  PreQuoteDraftValuationStatus,
} from "@/features/prequotes/prequote-draft-types";
import type {
  PreQuotePricingConfidenceLevel,
  TechnicalClassificationSource,
} from "@/features/prequotes/prequote-technical-types";

const EMPTY_VALUE = "-";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

export function formatPreQuoteDraftStatus(
  status: PreQuoteDraftStatus,
): string {
  switch (status) {
    case "PENDING_REVIEW":
      return "Pendiente de revisión";
    case "IN_REVIEW":
      return "En revisión";
    case "APPROVED":
      return "Aprobado";
  }
}

export function formatPreQuoteDraftDateTime(value: string | null): string {
  if (!value) {
    return EMPTY_VALUE;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

export function formatPreQuoteDraftNumber(value: number | null): string {
  return value === null ? EMPTY_VALUE : numberFormatter.format(value);
}

export function formatPreQuoteDraftArea(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${numberFormatter.format(value)} m²`;
}

export function formatPreQuoteDraftMoney(
  amount: number | null,
  currency: string | null,
): string {
  if (amount === null || !currency) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEconomicCompleteness(value: boolean): string {
  return value ? "Valoración completa" : "Valoración incompleta";
}

export function formatNullableDraftText(value: string | null): string {
  return value && value.trim().length > 0 ? value : EMPTY_VALUE;
}

export function formatPreQuoteDraftOrigin(value: PreQuoteDraftOrigin): string {
  return value === "AI" ? "Detectado automáticamente" : "Agregado manualmente";
}

export function formatPreQuoteDraftInclusion(value: boolean): string {
  return value ? "Incluido" : "Excluido";
}

export function formatPreQuoteDraftElementType(
  value: PreQuoteDraftElementType,
): string {
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
      return "Tragaluces";
    case "SHOWER_DIVISION":
      return "División de baño";
    case "OTHER":
      return "Otro";
  }
}

export function formatPreQuoteDraftAssignmentScope(
  value: PreQuoteDraftGlassAssignmentScope,
): string {
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

export function formatPreQuoteDraftReviewReason(
  value: PreQuoteDraftGlassReviewReason,
): string {
  switch (value) {
    case "GLASS_TYPE_NOT_IDENTIFIED":
      return "No se pudo identificar el tipo de vidrio.";
    case "GLASS_TYPE_AMBIGUOUS":
      return "Existen varias opciones posibles de vidrio.";
    case "GLASS_TYPE_CONFLICT":
      return "La información del documento sobre el vidrio es contradictoria.";
  }
}

export function formatPreQuoteDraftEvidenceSource(
  value: PreQuoteDraftEvidenceSourceType,
): string {
  return value === "NATIVE" ? "Texto del documento" : "Reconocimiento OCR";
}

export function formatPreQuoteDraftValuationStatus(
  value: PreQuoteDraftValuationStatus,
): string {
  switch (value) {
    case "PENDING":
      return "Pendiente de valoración";
    case "VALUED":
      return "Valoración vigente";
    case "STALE":
      return "Valoración desactualizada";
    case "NOT_PRICEABLE":
      return "No cotizable";
    case "REQUIRES_REVIEW":
      return "Requiere revisión";
  }
}

export function formatPreQuoteTechnicalSource(
  value: TechnicalClassificationSource | null,
): string {
  switch (value) {
    case "EXPLICIT":
      return "Explícito";
    case "ALIAS":
      return "Alias";
    case "INFERRED":
      return "Inferido";
    case "UNRESOLVED":
      return "No resuelto";
    case null:
      return EMPTY_VALUE;
  }
}

export function formatPreQuotePricingConfidenceLevel(
  value: PreQuotePricingConfidenceLevel | null,
): string {
  switch (value) {
    case "LOW":
      return "Baja";
    case "MEDIUM":
      return "Media";
    case "GOOD":
      return "Buena";
    case "HIGH":
      return "Alta";
    case null:
      return EMPTY_VALUE;
  }
}

export function formatPreQuoteDraftValuationReason(
  value: PreQuoteDraftValuationReason | string | null,
): string {
  switch (value) {
    case "MISSING_MEASUREMENTS":
      return "Faltan medidas válidas para valorar el ítem.";
    case "MISSING_QUANTITY":
      return "Falta la cantidad del ítem.";
    case "GLASS_NOT_NORMALIZED":
      return "El vidrio no tiene un código normalizado.";
    case "GLASS_TYPE_NOT_RESOLVED":
      return "No se pudo resolver el tipo de vidrio.";
    case "PRICE_RANGE_NOT_AVAILABLE":
      return "No hay precio registrado para este vidrio.";
    case "CURRENCY_MISMATCH":
      return "Los valores registrados usan monedas incompatibles.";
    case null:
      return EMPTY_VALUE;
    default:
      return "Motivo no reconocido por esta versión de la aplicación.";
  }
}

export function formatPreQuoteDraftInvalidationReason(
  value: PreQuoteDraftValuationInvalidationReason | null,
): string {
  switch (value) {
    case "WIDTH_CHANGED":
      return "Cambió el ancho.";
    case "HEIGHT_CHANGED":
      return "Cambió el alto.";
    case "QUANTITY_CHANGED":
      return "Cambió la cantidad.";
    case "MULTIPLE_INPUTS_CHANGED":
      return "Cambiaron varias entradas utilizadas en la valoración.";
    case null:
      return EMPTY_VALUE;
  }
}

export function formatPreQuoteDraftRequirementCategory(
  value: PreQuoteDraftRequirementCategory,
): string {
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

export function formatPreQuoteDraftResolutionStatus(
  value: PreQuoteDraftResolutionStatus,
): string {
  switch (value) {
    case "PENDING":
      return "Pendiente";
    case "RESOLVED":
      return "Resuelto";
    case "DISMISSED":
      return "Descartado";
  }
}

export function formatPreQuoteDraftIssueCode(value: string): string {
  switch (value) {
    case "PROJECT_NAME_NOT_FOUND":
      return "No se identificó el nombre del proyecto";
    case "NO_QUOTEABLE_ITEMS_FOUND":
      return "No se identificaron ítems cotizables";
    case "INCOMPLETE_TABLE_ROW":
      return "Fila incompleta";
    case "MISSING_ITEM_REFERENCE":
      return "Referencia de ítem faltante";
    case "MISSING_OR_INVALID_MEASUREMENTS":
      return "Medidas faltantes o inválidas";
    case "MISSING_OR_INVALID_QUANTITY":
    case "GLMISSING_OR_INVALID_QUANTITY":
      return "Cantidad faltante o inválida";
    case "UNKNOWN_ELEMENT_TYPE":
      return "Tipo de elemento no reconocido";
    case "OCR_REVIEW_REQUIRED":
      return "Revisión OCR requerida";
    case "GLASS_TYPE_NOT_IDENTIFIED":
      return "Vidrio no identificado";
    case "GLASS_TYPE_AMBIGUOUS":
      return "Vidrio ambiguo";
    case "GLASS_TYPE_CONFLICT":
      return "Conflicto de vidrio";
    default:
      return "Código no reconocido por esta versión de la aplicación.";
  }
}

export function formatPreQuoteDraftConflictCode(value: string): string {
  switch (value) {
    case "CONFLICTING_PROJECT_NAME":
      return "Nombres de proyecto diferentes";
    case "CONFLICTING_CLIENT_NAME":
      return "Nombres de cliente diferentes";
    case "CONFLICTING_LOCATION":
      return "Ubicaciones diferentes";
    case "DUPLICATE_ITEM_REFERENCE":
      return "Referencia de ítem duplicada";
    default:
      return "Conflicto no reconocido por esta versión de la aplicación.";
  }
}

export function formatPreQuoteDraftDimension(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${numberFormatter.format(value)} mm`;
}

export function formatPreQuoteDraftQuantity(value: number | null): string {
  return value === null ? EMPTY_VALUE : numberFormatter.format(value);
}

export function formatPreQuoteDraftPages(pages: number[]): string {
  if (pages.length === 0) {
    return EMPTY_VALUE;
  }

  if (pages.length === 1) {
    return `Página ${pages[0]}`;
  }

  const lastPage = pages[pages.length - 1];
  return `Páginas ${pages.slice(0, -1).join(", ")} y ${lastPage}`;
}
