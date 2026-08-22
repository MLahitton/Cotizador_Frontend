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
