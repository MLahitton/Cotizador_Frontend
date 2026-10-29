import { getSupportedDocumentFormat, MAX_DOCUMENT_SIZE_BYTES } from "./prequote-document-formatters";

export function validateRequirementDocumentFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Selecciona al menos un archivo.";
  }

  if (files.length > 10) {
    return "Puedes seleccionar hasta 10 archivos.";
  }

  if (
    files.some(
      (file) =>
        !getSupportedDocumentFormat(
          file.name,
          file.type,
        ),
    )
  ) {
    return "Solo se permiten archivos PDF, XLSX, JPG o PNG.";
  }

  if (files.some((file) => file.size === 0)) {
    return "Los archivos no pueden estar vacíos.";
  }

  if (
    files.some(
      (file) =>
        file.size > MAX_DOCUMENT_SIZE_BYTES,
    )
  ) {
    return "Cada archivo debe pesar como máximo 20 MiB.";
  }

  if (
    files.reduce(
      (total, file) => total + file.size,
      0,
    ) >
    100 * 1024 * 1024
  ) {
    return "El conjunto de archivos debe pesar como máximo 100 MiB.";
  }

  return null;
}

