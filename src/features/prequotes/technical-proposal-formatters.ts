import type { HistoricalEvidenceStatus } from "@/features/prequotes/technical-proposal-types";

const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const areaFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface EffectiveProposalPhysicalValues {
  effectiveQuantity: number | null;
  effectiveWidthMm: number | null;
  effectiveHeightMm: number | null;
}

function isPositiveFinite(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function formatProposalNumber(value: number | null, suffix = ""): string {
  return value === null ? "Por definir" : `${numberFormatter.format(value)}${suffix}`;
}

export function formatProposalQuantity(value: number | null): string {
  if (value === null) return "Cantidad: Por definir";
  return `${numberFormatter.format(value)} ${value === 1 ? "unidad" : "unidades"}`;
}

export function deriveGeometricAreaM2(widthMm: number | null, heightMm: number | null): number | null {
  return isPositiveFinite(widthMm) && isPositiveFinite(heightMm)
    ? (widthMm * heightMm) / 1_000_000
    : null;
}

export function deriveDisplayAreaM2(
  areaM2: number | null,
  widthMm: number | null,
  heightMm: number | null,
): number | null {
  return isPositiveFinite(areaM2) ? areaM2 : deriveGeometricAreaM2(widthMm, heightMm);
}

export function deriveDisplayTotalAreaM2(
  areaM2: number | null,
  widthMm: number | null,
  heightMm: number | null,
  quantity: number | null,
): number | null {
  if (!isPositiveFinite(quantity)) return null;
  const unitAreaM2 = deriveDisplayAreaM2(areaM2, widthMm, heightMm);
  return unitAreaM2 === null ? null : unitAreaM2 * quantity;
}

export function formatProposalAreaM2(value: number | null): string {
  return value === null ? "Por definir" : `${areaFormatter.format(value)} m²`;
}

export function calculateProposalPhysicalTotals(items: EffectiveProposalPhysicalValues[]): {
  structureCount: number;
  totalAreaM2: number;
} {
  return items.reduce((totals, item) => {
    if (!isPositiveFinite(item.effectiveQuantity)) return totals;
    totals.structureCount += item.effectiveQuantity;
    const unitAreaM2 = deriveGeometricAreaM2(item.effectiveWidthMm, item.effectiveHeightMm);
    if (unitAreaM2 !== null) totals.totalAreaM2 += unitAreaM2 * item.effectiveQuantity;
    return totals;
  }, { structureCount: 0, totalAreaM2: 0 });
}

interface HistoricalEvidenceValues {
  status: HistoricalEvidenceStatus | string;
  supportCount: number;
  bestSimilarity: number | null;
}

function formatHistoricalReferenceCount(value: number): string {
  return `${numberFormatter.format(value)} ${value === 1 ? "referencia historica" : "referencias historicas"}`;
}

export function formatHistoricalEvidenceSummary(evidence: HistoricalEvidenceValues): string {
  if (evidence.status === "AVAILABLE") {
    if (evidence.supportCount > 0 && evidence.bestSimilarity !== null) {
      return `${formatHistoricalReferenceCount(evidence.supportCount)} · Mejor similitud ${Math.round(evidence.bestSimilarity * 100)}%`;
    }

    return "Evidencia historica disponible";
  }

  if (evidence.status === "NO_COMPARABLES") {
    return "Varias referencias historicas comparables";
  }

  if (evidence.status === "SIMILARITY_UNAVAILABLE") {
    if (evidence.supportCount > 0) {
      return `${formatHistoricalReferenceCount(evidence.supportCount)} · Similitud no disponible`;
    }

    return "Similitud historica no disponible";
  }

  return "Evidencia historica no determinada";
}
export function formatProposalConfidence(value: number): string {
  if (value >= 0.85) return "Confianza alta";
  if (value >= 0.65) return "Confianza media";
  return "Confianza baja";
}

export function formatReviewReason(reason: string): string {
  const messages: Record<string, string> = {
    FINISH_NOT_RESOLVED: "No fue posible determinar el acabado.",
    FINISH_NOT_SPECIFIED: "El requerimiento no especifica un acabado.",
    HISTORICAL_DEFAULT_GLASS: "Vidrio sugerido por historico; requiere validacion.",
    HISTORICAL_DEFAULT_FINISH: "Acabado predeterminado historico.",
    GLASS_NOT_RESOLVED: "No fue posible resolver el vidrio en catalogo.",
    GLASS_NOT_SPECIFIED: "El requerimiento no especifica vidrio.",
    SYSTEM_NOT_RESOLVED: "No fue posible determinar el sistema S&G.",
    TECHNICAL_SELECTION_CATALOG_METADATA_INCOMPLETE: "El sistema requiere validacion tecnica.",
    INVALID_EVIDENCE_LOCATION: "La evidencia de origen requiere validacion.",
    UnknownElementType: "No fue posible clasificar el tipo de elemento.",
    SLIDING_WINDOW_THRESHOLD_REVIEW: "Conviene revisar el sistema sugerido para estas dimensiones.",
    SPECIAL_GEOMETRY_WITHOUT_CONSTRAINTS: "La geometria especial requiere validacion tecnica.",
    MissingOrInvalidMeasurements: "Las medidas requieren validacion.",
  };
  return messages[reason] ?? "Este elemento requiere revision tecnica.";
}
