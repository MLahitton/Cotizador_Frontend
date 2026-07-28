import type {
  ClientDocumentTypeValue,
  ClientFormErrors,
  ClientPayload,
  ClientTypeValue,
  CreateClientFormValues,
} from "@/features/clients/clients-types";

const CLIENT_TYPES: ClientTypeValue[] = ["Person", "Company"];
const DOCUMENT_TYPES: ClientDocumentTypeValue[] = [
  "Nit",
  "CitizenshipCard",
  "ForeignerId",
  "Passport",
  "Other",
];

export const INITIAL_CREATE_CLIENT_FORM_VALUES: CreateClientFormValues = {
  clientType: "",
  legalName: "",
  tradeName: "",
  documentType: "",
  documentNumber: "",
  email: "",
  phone: "",
  address: "",
  city: "",
};

function isClientType(value: string): value is ClientTypeValue {
  return CLIENT_TYPES.includes(value as ClientTypeValue);
}

function isDocumentType(value: string): value is ClientDocumentTypeValue {
  return DOCUMENT_TYPES.includes(value as ClientDocumentTypeValue);
}

function optionalTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateClientForm(
  values: CreateClientFormValues,
): ClientFormErrors {
  const errors: ClientFormErrors = {};
  const clientType = values.clientType.trim();
  const legalName = values.legalName.trim();
  const tradeName = values.tradeName.trim();
  const documentType = values.documentType.trim();
  const documentNumber = values.documentNumber.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const address = values.address.trim();
  const city = values.city.trim();

  if (!isClientType(clientType)) {
    errors.clientType = "Selecciona el tipo de cliente.";
  }

  if (!legalName) {
    errors.legalName = "Ingresa el nombre legal o nombre completo.";
  } else if (legalName.length > 200) {
    errors.legalName = "El nombre no puede superar 200 caracteres.";
  }

  if (tradeName.length > 200) {
    errors.tradeName = "El nombre comercial no puede superar 200 caracteres.";
  }

  if (documentType && !isDocumentType(documentType)) {
    errors.documentType = "Selecciona un tipo de documento válido.";
  }

  if (documentNumber.length > 50) {
    errors.documentNumber =
      "El número de documento no puede superar 50 caracteres.";
  }

  if (
    ((documentType && !documentNumber) || (!documentType && documentNumber)) &&
    !errors.documentType &&
    !errors.documentNumber
  ) {
    errors.documentType =
      "Selecciona el tipo y escribe el número de documento.";
    errors.documentNumber =
      "Selecciona el tipo y escribe el número de documento.";
  }

  if (email.length > 320) {
    errors.email = "El correo no puede superar 320 caracteres.";
  } else if (email && !isValidEmail(email)) {
    errors.email = "Escribe un correo electrónico válido.";
  }

  if (phone.length > 50) {
    errors.phone = "El teléfono no puede superar 50 caracteres.";
  }

  if (address.length > 300) {
    errors.address = "La dirección no puede superar 300 caracteres.";
  }

  if (city.length > 100) {
    errors.city = "La ciudad no puede superar 100 caracteres.";
  }

  return errors;
}

export function toClientPayload(
  values: CreateClientFormValues,
): ClientPayload {
  const documentType = values.documentType.trim();

  return {
    clientType: values.clientType.trim() as ClientTypeValue,
    legalName: values.legalName.trim(),
    tradeName: optionalTrimmed(values.tradeName),
    documentType: documentType
      ? (documentType as ClientDocumentTypeValue)
      : null,
    documentNumber: optionalTrimmed(values.documentNumber),
    email: optionalTrimmed(values.email),
    phone: optionalTrimmed(values.phone),
    address: optionalTrimmed(values.address),
    city: optionalTrimmed(values.city),
  };
}

export const validateCreateClientForm = validateClientForm;

export const toCreateClientRequest = toClientPayload;
