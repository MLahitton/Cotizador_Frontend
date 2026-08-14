import type { TechnicalClassificationSource } from "@/features/prequotes/prequote-technical-types";

const EMPTY_VALUE = "-";

const TECHNICAL_CONFIDENCE_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatTechnicalClassificationSource(
  value: TechnicalClassificationSource | null,
): string {
  switch (value) {
    case "EXPLICIT":
      return "Explícita";
    case "ALIAS":
      return "Alias";
    case "INFERRED":
      return "Inferida";
    case "UNKNOWN":
      return "No especificado";
    case "AMBIGUOUS":
      return "Ambiguo";
    case "UNRESOLVED":
      return "Sin resolver";
    case null:
      return EMPTY_VALUE;
  }
}

export function formatTechnicalConfidence(value: number | null): string {
  return value === null
    ? EMPTY_VALUE
    : TECHNICAL_CONFIDENCE_FORMATTER.format(value);
}

export function formatTechnicalReviewReason(reason: string): string {
  switch (reason) {
    case "SYSTEM_NOT_CURRENTLY_PRICEABLE":
      return "El sistema identificado no es cotizable actualmente.";
    case "FINISH_REQUIRES_REVIEW":
      return "El acabado identificado requiere revisión técnica.";
    default:
      return "Motivo técnico pendiente de interpretación.";
  }
}
