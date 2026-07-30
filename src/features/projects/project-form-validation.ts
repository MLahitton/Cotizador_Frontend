import type {
  CreateProjectRequest,
  ProjectFormErrors,
  ProjectFormValues,
  UpdateProjectRequest,
} from "@/features/projects/projects-types";

const PROJECT_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

export const INITIAL_PROJECT_FORM_VALUES: ProjectFormValues = {
  code: "",
  name: "",
  location: "",
  description: "",
};

function optionalTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeProjectCode(value: string): string {
  return value.trim().toUpperCase();
}

export function validateProjectEditableFields(
  values: ProjectFormValues,
): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const code = values.code.trim();
  const name = values.name.trim();
  const location = values.location.trim();
  const description = values.description.trim();

  if (!code) {
    errors.code = "Ingresa el código del proyecto.";
  } else if (code.length > 30) {
    errors.code = "El código no puede superar 30 caracteres.";
  } else if (!PROJECT_CODE_PATTERN.test(code)) {
    errors.code = "Usa solo letras, números, guion o guion bajo.";
  }

  if (!name) {
    errors.name = "Ingresa el nombre del proyecto.";
  } else if (name.length > 200) {
    errors.name = "El nombre no puede superar 200 caracteres.";
  }

  if (location.length > 250) {
    errors.location = "La ubicación no puede superar 250 caracteres.";
  }

  if (description.length > 1000) {
    errors.description = "La descripción no puede superar 1000 caracteres.";
  }

  return errors;
}

export function validateProjectForm(
  values: ProjectFormValues,
  clientId: string | null,
): ProjectFormErrors {
  const errors = validateProjectEditableFields(values);

  if (!clientId) {
    errors.client = "Selecciona un cliente activo.";
  }

  return errors;
}

export function toCreateProjectRequest(
  values: ProjectFormValues,
  clientId: string,
): CreateProjectRequest {
  return {
    clientId,
    code: normalizeProjectCode(values.code),
    name: values.name.trim(),
    description: optionalTrimmed(values.description),
    location: optionalTrimmed(values.location),
  };
}

export function toUpdateProjectRequest(
  values: ProjectFormValues,
): UpdateProjectRequest {
  return {
    code: normalizeProjectCode(values.code),
    name: values.name.trim(),
    description: optionalTrimmed(values.description),
    location: optionalTrimmed(values.location),
  };
}
