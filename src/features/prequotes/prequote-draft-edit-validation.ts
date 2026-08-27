import type {
  DraftEditErrors,
  DraftEditFindingModel,
  DraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-types";
import type {
  PreQuoteDraftDetails,
  PreQuoteDraftElementType,
  PreQuoteDraftRequirementCategory,
  PreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-types";
import { isValidPreQuoteDraftContractGuid } from "@/features/prequotes/prequote-draft-api";

const ELEMENT_TYPES = [
  "WINDOW",
  "DOOR",
  "FACADE",
  "PARTITION",
  "RAILING",
  "SKYLIGHT",
  "SHOWER_DIVISION",
  "OTHER",
] as const satisfies readonly PreQuoteDraftElementType[];

const REQUIREMENT_CATEGORIES = [
  "GLASS_SPECIFICATION",
  "PROFILE_SPECIFICATION",
  "FINISH",
  "ACCESSORIES_AND_SEALANTS",
  "GENERAL_NOTE",
] as const satisfies readonly PreQuoteDraftRequirementCategory[];

const RESOLUTION_STATUSES = [
  "PENDING",
  "RESOLVED",
  "DISMISSED",
] as const satisfies readonly PreQuoteDraftResolutionStatus[];

export type NullablePositiveIntegerInput =
  | { kind: "empty"; value: null }
  | { kind: "valid"; value: number }
  | { kind: "invalid"; value: null };

export function parseNullablePositiveIntegerInput(
  value: string,
): NullablePositiveIntegerInput {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { kind: "empty", value: null };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { kind: "invalid", value: null };
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? { kind: "valid", value: parsed }
    : { kind: "invalid", value: null };
}

function hasIntegerError(value: string): boolean {
  return parseNullablePositiveIntegerInput(value).kind === "invalid";
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values.map((value) => value.toLowerCase())).size !== values.length;
}

function addLengthError(
  errors: DraftEditErrors,
  key: string,
  value: string,
  maxLength: number,
): void {
  if (value.trim().length > maxLength) {
    errors[key] = `No puede superar ${maxLength} caracteres.`;
  }
}

function persistedIdsArePreserved(
  expectedIds: string[],
  currentIds: (string | null)[],
): boolean {
  const currentPersistedIds = currentIds.filter(
    (value): value is string => value !== null,
  );

  return (
    expectedIds.length === currentPersistedIds.length &&
    !hasDuplicates(currentPersistedIds) &&
    expectedIds
      .map((value) => value.toLowerCase())
      .sort()
      .join("|") ===
      currentPersistedIds
        .map((value) => value.toLowerCase())
        .sort()
        .join("|")
  );
}

function validateFindings(
  errors: DraftEditErrors,
  prefix: "issues" | "conflicts",
  findings: DraftEditFindingModel[],
  expectedIds: string[],
): void {
  if (!persistedIdsArePreserved(expectedIds, findings.map((finding) => finding.id))) {
    errors[`${prefix}.form`] =
      "La colección no conserva todos los identificadores existentes.";
  }

  findings.forEach((finding, index) => {
    if (!isValidPreQuoteDraftContractGuid(finding.id)) {
      errors[`${prefix}.${index}.id`] = "El identificador no es válido.";
    }

    if (!RESOLUTION_STATUSES.includes(finding.resolutionStatus)) {
      errors[`${prefix}.${index}.resolutionStatus`] =
        "Selecciona un estado válido.";
    }

    if (
      finding.resolutionStatus !== "PENDING" &&
      finding.resolutionNote.trim().length === 0
    ) {
      errors[`${prefix}.${index}.resolutionNote`] =
        "La nota es obligatoria para resolver o descartar.";
    }

    addLengthError(errors, `${prefix}.${index}.resolutionNote`, finding.resolutionNote, 2000);
  });
}

export function validateDraftEditModel(
  model: DraftEditModel,
  authoritativeDraft: PreQuoteDraftDetails,
): DraftEditErrors {
  const errors: DraftEditErrors = {};

  addLengthError(errors, "project.projectName", model.project.projectName, 500);
  addLengthError(errors, "project.clientName", model.project.clientName, 500);
  addLengthError(errors, "project.location", model.project.location, 500);

  if (
    !persistedIdsArePreserved(
      authoritativeDraft.items.map((item) => item.id),
      model.items.map((item) => item.draftItemId),
    )
  ) {
    errors["items.form"] = "Todos los ítems existentes deben conservarse.";
  }

  model.items.forEach((item, index) => {
    addLengthError(errors, `items.${index}.reference`, item.reference, 200);
    addLengthError(errors, `items.${index}.description`, item.description, 1000);
    addLengthError(errors, `items.${index}.rawMeasurements`, item.rawMeasurements, 500);

    if (item.description.trim().length === 0) {
      errors[`items.${index}.description`] = "La descripción es obligatoria.";
    }

    if (!ELEMENT_TYPES.includes(item.elementType as PreQuoteDraftElementType)) {
      errors[`items.${index}.elementType`] = "Selecciona un tipo de elemento.";
    }

    const hasWidth = item.widthMillimeters.trim().length > 0;
    const hasHeight = item.heightMillimeters.trim().length > 0;

    if (hasWidth !== hasHeight) {
      errors[`items.${index}.dimensions`] = "Ancho y alto deben informarse juntos.";
    }

    if (hasIntegerError(item.widthMillimeters)) {
      errors[`items.${index}.widthMillimeters`] = "Ingresa un entero positivo.";
    }

    if (hasIntegerError(item.heightMillimeters)) {
      errors[`items.${index}.heightMillimeters`] = "Ingresa un entero positivo.";
    }

    if (hasIntegerError(item.quantity)) {
      errors[`items.${index}.quantity`] = "Ingresa un entero positivo.";
    }
  });

  if (
    !persistedIdsArePreserved(
      authoritativeDraft.requirements.map((requirement) => requirement.draftRequirementId),
      model.requirements.map((requirement) => requirement.draftRequirementId),
    )
  ) {
    errors["requirements.form"] =
      "Todos los requisitos existentes deben conservarse.";
  }

  model.requirements.forEach((requirement, index) => {
    if (!REQUIREMENT_CATEGORIES.includes(requirement.category as PreQuoteDraftRequirementCategory)) {
      errors[`requirements.${index}.category`] = "Selecciona una categoría.";
    }

    if (requirement.isIncluded && requirement.value.trim().length === 0) {
      errors[`requirements.${index}.value`] =
        "El valor es obligatorio si está incluido.";
    }

    addLengthError(errors, `requirements.${index}.value`, requirement.value, 1000);
  });

  if (
    !persistedIdsArePreserved(
      authoritativeDraft.documentReferences.map(
        (reference) => reference.draftDocumentReferenceId,
      ),
      model.references.map((reference) => reference.draftDocumentReferenceId),
    )
  ) {
    errors["references.form"] =
      "Todas las referencias existentes deben conservarse.";
  }

  model.references.forEach((reference, index) => {
    addLengthError(errors, `references.${index}.reference`, reference.reference, 200);
    addLengthError(errors, `references.${index}.description`, reference.description, 1000);
    addLengthError(errors, `references.${index}.detail`, reference.detail, 2000);

    if (reference.description.trim().length === 0) {
      errors[`references.${index}.description`] =
        "La descripción es obligatoria.";
    }

    if (hasIntegerError(reference.quantity)) {
      errors[`references.${index}.quantity`] = "Ingresa un entero positivo.";
    }
  });

  validateFindings(
    errors,
    "issues",
    model.issues,
    authoritativeDraft.issues.map((issue) => issue.draftIssueId),
  );
  validateFindings(
    errors,
    "conflicts",
    model.conflicts,
    authoritativeDraft.conflicts.map((conflict) => conflict.draftConflictId),
  );

  return errors;
}
