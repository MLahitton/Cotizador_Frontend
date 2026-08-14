import type { HistoricalDocumentPricingStatus } from "@/features/prequotes/historical-document-estimate-types";

const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 0 });

export function formatEstimateMoney(value: number | null, currency: string | null): string {
  if (value === null) return "—";
  if (!currency) return numberFormatter.format(value);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${numberFormatter.format(value)}`;
  }
}

export function formatEstimateNumber(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${numberFormatter.format(value)}${suffix}`;
}

export function formatEstimateConfidence(level: string | null, score: number | null): string {
  const levelLabel = level === "HIGH" ? "Alta" : level === "GOOD" ? "Buena" : level === "MEDIUM" ? "Media" : level === "LOW" ? "Baja" : level;
  if (score === null) return levelLabel || "—";
  const normalizedScore = score > 1 ? score / 100 : score;
  return `${levelLabel || "Confianza"} · ${percentFormatter.format(normalizedScore)}`;
}

export function formatEstimateStatus(status: HistoricalDocumentPricingStatus): string {
  if (status === "PRICEABLE") return "Estimado";
  if (status === "NOT_PRICEABLE") return "Sin precio";
  return "Requiere revisión";
}

export function formatEstimateWarning(code: string): string {
  const messages: Record<string, string> = {
    SYSTEM_UNKNOWN: "Sistema no especificado",
    FINISH_UNKNOWN: "Acabado no especificado",
    GLASS_CANONICAL_CODE_UNMAPPED: "Vidrio requiere revisión",
    MEASUREMENT_AREA_MISMATCH: "Las medidas y el área presentan una inconsistencia",
    NOT_PRICEABLE: "No fue posible estimar automáticamente este elemento",
    TRANSPORT_NOT_INCLUDED: "Transporte no incluido",
    TRANSPORT_NOT_CONFIRMED: "Transporte pendiente de confirmación",
  };
  return messages[code] ?? code;
}
