const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export function formatProposalNumber(value: number | null, suffix = ""): string {
  return value === null ? "Por definir" : `${numberFormatter.format(value)}${suffix}`;
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
    SLIDING_WINDOW_THRESHOLD_REVIEW: "Conviene revisar el sistema sugerido para estas dimensiones.",
    SPECIAL_GEOMETRY_WITHOUT_CONSTRAINTS: "La geometría especial requiere validación técnica.",
    MissingOrInvalidMeasurements: "Las medidas requieren validación.",
  };
  return messages[reason] ?? "Este elemento requiere revisión técnica.";
}
