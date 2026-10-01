import {
  isDateTime,
  isNonEmptyString,
  isNonNegativeInteger,
  isNullableString,
  isRecord,
} from "@/features/prequotes/newpipe-guards";
import type {
  RequirementExperienceCatalog,
  RequirementExperienceDraftsResponse,
  RequirementExperienceItemDraft,
  UpdateRequirementExperienceDraftRequest,
} from "@/features/prequotes/prequote-experience-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isPriorityMap(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number" && Number.isFinite(item));
}

function isCatalogOption(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.optionCode) &&
    isNonEmptyString(value.optionLabel) && isNullableString(value.shortLabel) &&
    Array.isArray(value.conditions);
}

function isCatalogQuestion(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.benefitCode) &&
    isNonEmptyString(value.label) && isNonEmptyString(value.question) &&
    Array.isArray(value.options) && value.options.every(isCatalogOption);
}

function isCatalogSpace(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.code) &&
    isNonEmptyString(value.label) && isPriorityMap(value.priorities);
}

function isRequirementExperienceCatalog(value: unknown): value is RequirementExperienceCatalog {
  return isRecord(value) && isNonEmptyString(value.version) &&
    Array.isArray(value.questions) && value.questions.every(isCatalogQuestion) &&
    Array.isArray(value.spaces) && value.spaces.every(isCatalogSpace);
}

function isAnswer(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.benefitCode) && isNonEmptyString(value.optionCode);
}

function isItemDraft(value: unknown): value is RequirementExperienceItemDraft {
  return isRecord(value) && isNonEmptyString(value.technicalProposalItemId) &&
    isNullableString(value.catalogVersion) && isNullableString(value.spaceTypeCode) &&
    isNonEmptyString(value.resolutionState) && isNonNegativeInteger(value.revision) &&
    (value.updatedAtUtc === null || isDateTime(value.updatedAtUtc)) &&
    isNullableString(value.updatedByUserId) && Array.isArray(value.answers) &&
    value.answers.every(isAnswer);
}

function isDraftsResponse(value: unknown): value is RequirementExperienceDraftsResponse {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    Array.isArray(value.items) && value.items.every(isItemDraft);
}

export async function getRequirementExperienceCatalog(): Promise<RequirementExperienceCatalog> {
  const response = await apiRequest("/api/v2/requirements/experience-catalog", { authenticated: true });
  if (!isRequirementExperienceCatalog(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio el catalogo de experiencia con un formato inesperado.",
    });
  }
  return response;
}

export async function getRequirementExperienceDrafts(
  technicalProposalId: string,
): Promise<RequirementExperienceDraftsResponse> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/experience-drafts`,
    { authenticated: true },
  );
  if (!isDraftsResponse(response) || response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio los borradores de experiencia con un formato inesperado.",
    });
  }
  return response;
}

export async function updateRequirementExperienceDraft(
  technicalProposalId: string,
  technicalProposalItemId: string,
  request: UpdateRequirementExperienceDraftRequest,
): Promise<RequirementExperienceItemDraft> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/items/${encodeURIComponent(technicalProposalItemId)}/experience-draft`,
    { method: "PUT", authenticated: true, body: request },
  );
  if (!isItemDraft(response) || response.technicalProposalItemId.toLowerCase() !== technicalProposalItemId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio el borrador de experiencia con un formato inesperado.",
    });
  }
  return response;
}

export function getRequirementExperienceErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible guardar las preferencias de experiencia.";
  const code = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  if (code === "REQUIREMENT_EXPERIENCE_CONFLICT") {
    return "Hay una version mas reciente de estas preferencias. Recarga el item antes de guardar de nuevo.";
  }
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "El servidor rechazo estas preferencias. Revisa espacio y respuestas seleccionadas.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    404: "La propuesta o el item ya no esta disponible.",
    409: "Hay una version mas reciente de estas preferencias. Recarga el item antes de guardar de nuevo.",
    500: "No fue posible guardar las preferencias de experiencia.",
  };
  return messages[error.status] ?? "No fue posible guardar las preferencias de experiencia.";
}
