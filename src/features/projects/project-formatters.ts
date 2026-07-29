import type { ClientListItem } from "@/features/clients/clients-types";

const EMPTY_VALUE = "—";

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

export function getClientDisplayName(client: ClientListItem): string {
  return client.legalName.trim() || EMPTY_VALUE;
}

export function getClientDocumentLabel(client: ClientListItem): string {
  if (!client.documentType && !client.documentNumber) {
    return EMPTY_VALUE;
  }

  return `${formatDocumentType(client.documentType)} ${
    client.documentNumber ?? EMPTY_VALUE
  }`;
}

export function getClientSecondaryLabel(client: ClientListItem): string {
  return `${formatClientType(client.clientType)} · ${getClientDocumentLabel(
    client,
  )}`;
}

export function getClientLocationLabel(client: ClientListItem): string | null {
  const city = client.city?.trim();
  return city || null;
}
