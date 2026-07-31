import type {
  DocumentProcessingAvailability,
  DocumentProcessingOutcome,
  DocumentProcessingState,
  PdfClassification,
  StructuredExtractionStatus,
} from "@/features/prequotes/prequote-documents-types";

const BYTE_UNITS = ["B", "KB", "MB"] as const;

export function formatFileSize(sizeBytes: number): string {
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formattedValue =
    unitIndex === 0 ? String(value) : value.toFixed(value >= 10 ? 1 : 2);

  return `${formattedValue} ${BYTE_UNITS[unitIndex]}`;
}

export function formatContentType(contentType: string): string {
  return contentType === "application/pdf" ? "PDF" : contentType;
}

export function formatProcessingAvailability(
  value: DocumentProcessingAvailability,
): string {
  switch (value) {
    case "NOT_PROCESSED":
      return "Sin procesar";
    case "PENDING":
      return "En espera";
    case "PROCESSING":
      return "Procesando";
    case "FAILED":
      return "Procesamiento fallido";
    case "LEGACY_ONLY":
      return "Procesamiento anterior";
    case "AVAILABLE_CURRENT":
      return "Extracción actual disponible";
    case "AVAILABLE_PREVIOUS":
      return "Extracción anterior disponible";
  }
}

export function formatProcessingState(value: DocumentProcessingState): string {
  switch (value) {
    case "PENDING":
      return "En espera";
    case "PROCESSING":
      return "Procesando";
    case "FINISHED":
      return "Finalizado";
  }
}

export function formatProcessingOutcome(
  value: DocumentProcessingOutcome | null,
): string {
  switch (value) {
    case "COMPLETED":
      return "Completado";
    case "REQUIRES_REVIEW":
      return "Requiere revisión";
    case "FAILED":
      return "Fallido";
    case null:
      return "Sin resultado";
  }
}

export function formatPdfClassification(value: PdfClassification): string {
  switch (value) {
    case "PDF_TEXT":
      return "Texto nativo";
    case "PDF_SCANNED":
      return "Documento escaneado";
    case "PDF_MIXED":
      return "Documento mixto";
  }
}

export function formatStructuredExtractionStatus(
  value: StructuredExtractionStatus,
): string {
  switch (value) {
    case "COMPLETED":
      return "Extracción completa";
    case "REQUIRES_REVIEW":
      return "Requiere revisión";
  }
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function availabilityNeedsManualRefresh(
  value: DocumentProcessingAvailability,
): boolean {
  return value === "PENDING" || value === "PROCESSING";
}

export function formatMissingExtractionSummary(
  value: DocumentProcessingAvailability,
): string {
  switch (value) {
    case "NOT_PROCESSED":
      return "Aún no hay extracción disponible.";
    case "PENDING":
      return "La extracción estará disponible cuando termine el procesamiento.";
    case "PROCESSING":
      return "El documento se está procesando.";
    case "FAILED":
      return "No fue posible generar una extracción.";
    case "LEGACY_ONLY":
      return "Este procesamiento no generó un resumen estructurado.";
    case "AVAILABLE_CURRENT":
      return "El resumen de extracción no está disponible.";
    case "AVAILABLE_PREVIOUS":
      return "El resumen de la extracción anterior no está disponible.";
  }
}
