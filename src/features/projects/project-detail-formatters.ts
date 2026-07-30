const EMPTY_VALUE = "—";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatNullableValue(value: string | null): string {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : EMPTY_VALUE;
}

export function formatProjectStatus(isActive: boolean): string {
  return isActive ? "Activo" : "Inactivo";
}

export function formatClientType(clientType: string): string {
  if (clientType === "Company") return "Empresa";
  if (clientType === "Person") return "Persona";
  return clientType || EMPTY_VALUE;
}

export function formatDocumentType(documentType: string | null): string {
  if (documentType === "Nit") return "NIT";
  if (documentType === "CitizenshipCard") return "Cédula de ciudadanía";
  if (documentType === "ForeignerId") return "Cédula de extranjería";
  if (documentType === "Passport") return "Pasaporte";
  if (documentType === "Other") return "Otro";
  return EMPTY_VALUE;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

export function formatDocumentLabel(
  documentType: string | null,
  documentNumber: string | null,
): string {
  if (!documentType && !documentNumber) {
    return EMPTY_VALUE;
  }

  return `${formatDocumentType(documentType)} ${formatNullableValue(
    documentNumber,
  )}`;
}
