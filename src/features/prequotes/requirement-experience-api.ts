import { isQuantityExtractionStatus } from "./quantity-provenance";
import {
  isDateTime,
  isNonEmptyString,
  isNullableNumber,
  isNonNegativeInteger,
  isNullableString,
  isRecord,
  isStringArray,
} from "@/features/prequotes/newpipe-guards";
import type {
  RequirementExperienceCatalog,
  RequirementExperienceConfigurationItemStatus,
  RequirementExperienceConfigurationStatus,
  RequirementExperienceConfigurationStatusResponse,
  RequirementExperienceDraftsResponse,
  RequirementExperienceItemDraft,
  RequirementExperienceLevel2Response,
  UpdateRequirementExperienceDraftRequest,
  UpdateRequirementExperienceLevel2GlassRequest,
  UpdateRequirementExperienceLevel2SystemRequest,
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

function isLevel1Resolution(value: unknown): boolean {
  return isRecord(value) &&
    isNullableString(value.systemTier) && isNullableString(value.glassFamily) &&
    typeof value.isComplete === "boolean" &&
    isNonNegativeInteger(value.answeredBenefits) && isNonNegativeInteger(value.requiredBenefits);
}

function isItemDraft(value: unknown): value is RequirementExperienceItemDraft {
  return isRecord(value) && isNonEmptyString(value.technicalProposalItemId) &&
    isNullableString(value.catalogVersion) && isNullableString(value.spaceTypeCode) &&
    isNonEmptyString(value.resolutionState) && isNonNegativeInteger(value.revision) &&
    (value.updatedAtUtc === null || isDateTime(value.updatedAtUtc)) &&
    isNullableString(value.updatedByUserId) &&
    (value.level1Resolution === null || isLevel1Resolution(value.level1Resolution)) &&
    Array.isArray(value.answers) &&
    value.answers.every(isAnswer);
}

function isDraftsResponse(value: unknown): value is RequirementExperienceDraftsResponse {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    Array.isArray(value.items) && value.items.every(isItemDraft);
}

function isLevel2State(value: unknown): boolean {
  return value === "RESOLVED" || value === "REQUIRES_REVIEW" || value === "PENDING" ||
    value === "BLOCKED" || value === "PENDING_EXTERNAL_SOURCE";
}

function isConfigurationStatus(value: unknown): value is RequirementExperienceConfigurationStatus {
  return value === "DRAFT" || value === "CONFIRMED" || value === "STALE";
}

function isLevel2CandidateState(value: unknown): boolean {
  return value === "COMPATIBLE" || value === "REQUIRES_REVIEW" || value === "INCOMPATIBLE";
}

function isLevel2OverrideState(value: unknown): boolean {
  return value === "NONE" || value === "VALID" || value === "REQUIRES_REVIEW" || value === "STALE";
}

function isLevel2SystemCandidate(value: unknown): boolean {
  return isRecord(value) &&
    isNonEmptyString(value.id) && isNonEmptyString(value.code) && isNonEmptyString(value.name) &&
    isNullableString(value.technicalName) && isNullableString(value.commercialName) &&
    isNullableString(value.functionalType) && isNullableString(value.family) &&
    isNullableString(value.series) && isLevel2CandidateState(value.compatibilityState) &&
    isNonNegativeInteger(value.rank) && isStringArray(value.reviewReasons) &&
    isStringArray(value.blockingReasons);
}

function isLevel2GlassCandidate(value: unknown): boolean {
  return isRecord(value) &&
    isNonEmptyString(value.id) && isNonEmptyString(value.code) && isNonEmptyString(value.name) &&
    isNullableString(value.family) && isNullableString(value.composition) &&
    isNullableString(value.treatment) && isNullableNumber(value.outerThicknessMm) &&
    isNullableNumber(value.innerThicknessMm) && isLevel2CandidateState(value.compatibilityState) &&
    isNonNegativeInteger(value.rank) && isStringArray(value.reviewReasons) &&
    isStringArray(value.blockingReasons);
}

function isLevel2System(value: unknown): boolean {
  return isRecord(value) && isLevel2State(value.state) &&
    (value.suggested === null || isLevel2SystemCandidate(value.suggested)) &&
    (value.override === null || isLevel2SystemCandidate(value.override)) &&
    (value.effective === null || isLevel2SystemCandidate(value.effective)) &&
    isLevel2OverrideState(value.overrideState) &&
    Array.isArray(value.candidates) && value.candidates.every(isLevel2SystemCandidate) &&
    isStringArray(value.reviewReasons) && isStringArray(value.blockingReasons);
}

function isLevel2Glass(value: unknown): boolean {
  return isRecord(value) && isLevel2State(value.state) &&
    isNullableString(value.glassFamily) &&
    (value.suggested === null || isLevel2GlassCandidate(value.suggested)) &&
    (value.override === null || isLevel2GlassCandidate(value.override)) &&
    (value.effective === null || isLevel2GlassCandidate(value.effective)) &&
    isLevel2OverrideState(value.overrideState) &&
    Array.isArray(value.candidates) && value.candidates.every(isLevel2GlassCandidate) &&
    isStringArray(value.reviewReasons) && isStringArray(value.blockingReasons);
}

function isLevel2Finish(value: unknown): boolean {
  return isRecord(value) && isLevel2State(value.state) &&
    isStringArray(value.reviewReasons) && isStringArray(value.blockingReasons);
}

function isLevel2Response(value: unknown): value is RequirementExperienceLevel2Response {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    isNonEmptyString(value.technicalProposalItemId) && isNullableNumber(value.technicalSelectionRevision) &&
    isNullableString(value.effectiveFunctionalType) && isLevel2System(value.system) && isLevel2Glass(value.glass) &&
    isLevel2Finish(value.finish) && isLevel2State(value.overallState);
}

function isConfigurationItemStatus(value: unknown): value is RequirementExperienceConfigurationItemStatus {
  return isRecord(value) &&
    isNonEmptyString(value.technicalProposalItemId) &&
    isNullableString(value.reference) &&
    isNullableNumber(value.sequence) &&
    typeof value.isIncluded === "boolean" &&
    isNullableNumber(value.quantity) &&
    (value.quantitySource === null || ["EXTRACTED", "MANUAL", "ASSUMED_DEFAULT"].includes(String(value.quantitySource))) &&
    isQuantityExtractionStatus(value.quantityExtractionStatus) &&
    isNullableNumber(value.quantityExtractionConfidence) &&
    isNullableNumber(value.widthMm) &&
    isNullableNumber(value.heightMm) &&
    isNullableNumber(value.areaM2) &&
    isNullableString(value.location) &&
    isNullableString(value.systemId) &&
    isNullableString(value.glassTypeId) &&
    isNullableString(value.finishTypeId) &&
    (value.systemState === null || isLevel2State(value.systemState)) &&
    (value.glassState === null || isLevel2State(value.glassState)) &&
    (value.finishState === null || isLevel2State(value.finishState)) &&
    (value.systemOverrideState === null || isLevel2OverrideState(value.systemOverrideState)) &&
    (value.glassOverrideState === null || isLevel2OverrideState(value.glassOverrideState)) &&
    (value.readinessState === "READY" || value.readinessState === "WARNING" || value.readinessState === "BLOCKED") &&
    isStringArray(value.reviewReasons) &&
    isStringArray(value.blockingReasons);
}

function isConfigurationStatusResponse(value: unknown): value is RequirementExperienceConfigurationStatusResponse {
  return isRecord(value) &&
    isNonEmptyString(value.technicalProposalId) &&
    isConfigurationStatus(value.status) &&
    typeof value.canConfirm === "boolean" &&
    isNullableNumber(value.latestConfirmationRevision) &&
    (value.confirmedAtUtc === null || isDateTime(value.confirmedAtUtc)) &&
    isNullableString(value.confirmedByUserId) &&
    isStringArray(value.reviewReasons) &&
    isStringArray(value.blockingReasons) &&
    Array.isArray(value.items) &&
    value.items.every(isConfigurationItemStatus);
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

export async function getRequirementExperienceLevel2(
  technicalProposalId: string,
  technicalProposalItemId: string,
): Promise<RequirementExperienceLevel2Response> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/items/${encodeURIComponent(technicalProposalItemId)}/experience-level2`,
    { authenticated: true },
  );
  if (!isLevel2Response(response) ||
    response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase() ||
    response.technicalProposalItemId.toLowerCase() !== technicalProposalItemId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio la configuracion tecnica con un formato inesperado.",
    });
  }
  return response;
}


export async function updateRequirementExperienceLevel2System(
  technicalProposalId: string,
  technicalProposalItemId: string,
  request: UpdateRequirementExperienceLevel2SystemRequest,
): Promise<RequirementExperienceLevel2Response> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/items/${encodeURIComponent(technicalProposalItemId)}/experience-level2/system`,
    { method: "PUT", authenticated: true, body: request },
  );
  if (!isLevel2Response(response) ||
    response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase() ||
    response.technicalProposalItemId.toLowerCase() !== technicalProposalItemId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio la seleccion de sistema con un formato inesperado.",
    });
  }
  return response;
}

export async function updateRequirementExperienceLevel2Glass(
  technicalProposalId: string,
  technicalProposalItemId: string,
  request: UpdateRequirementExperienceLevel2GlassRequest,
): Promise<RequirementExperienceLevel2Response> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/items/${encodeURIComponent(technicalProposalItemId)}/experience-level2/glass`,
    { method: "PUT", authenticated: true, body: request },
  );
  if (!isLevel2Response(response) ||
    response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase() ||
    response.technicalProposalItemId.toLowerCase() !== technicalProposalItemId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio la seleccion de vidrio con un formato inesperado.",
    });
  }
  return response;
}

export async function getRequirementExperienceConfiguration(
  technicalProposalId: string,
): Promise<RequirementExperienceConfigurationStatusResponse> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/experience-configuration`,
    { authenticated: true },
  );
  if (!isConfigurationStatusResponse(response) ||
    response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio el estado de configuracion con un formato inesperado.",
    });
  }
  return response;
}

export async function confirmRequirementExperienceConfiguration(
  technicalProposalId: string,
): Promise<RequirementExperienceConfigurationStatusResponse> {
  const response = await apiRequest(
    `/api/v2/requirements/technical-proposals/${encodeURIComponent(technicalProposalId)}/experience-configuration/confirm`,
    { method: "POST", authenticated: true },
  );
  if (!isConfigurationStatusResponse(response) ||
    response.technicalProposalId.toLowerCase() !== technicalProposalId.toLowerCase()) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio la confirmacion de configuracion con un formato inesperado.",
    });
  }
  return response;
}

export function getRequirementExperienceLevel2ErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const code = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof code === "string" ? code : null;
}

export function getRequirementExperienceConfigurationErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const code = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof code === "string" ? code : null;
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
