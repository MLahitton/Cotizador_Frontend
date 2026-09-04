import { isDateTime, isNonEmptyString, isNullableString, isRecord } from "@/features/prequotes/newpipe-guards";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

export interface TechnicalProposalSelectionConfirmationResponse {
  technicalProposalId: string;
  state: "PENDING_CONFIRMATION" | "CONFIRMED";
  confirmedAtUtc: string | null;
  confirmedByUserId: string | null;
}

export interface TechnicalProposalItemInclusionRequest {
  isIncluded: boolean;
  reason?: string | null;
}

export interface TechnicalProposalItemInclusionResponse {
  technicalProposalId: string;
  itemId: string;
  isIncluded: boolean;
  excludedAtUtc: string | null;
  excludedByUserId: string | null;
  exclusionReason: string | null;
  commercialRevision: number;
}

export interface TechnicalProposalSelectionRequest {
  confirmSuggested?: true;
  systemId?: string | null;
  glassId?: string | null;
  finishId?: string | null;
  quantity?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
}

function isInclusionResponse(value: unknown): value is TechnicalProposalItemInclusionResponse {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    isNonEmptyString(value.itemId) && typeof value.isIncluded === "boolean" &&
    (value.excludedAtUtc === null || isDateTime(value.excludedAtUtc)) &&
    isNullableString(value.excludedByUserId) && isNullableString(value.exclusionReason) &&
    typeof value.commercialRevision === "number";
}

function isConfirmationResponse(value: unknown): value is TechnicalProposalSelectionConfirmationResponse {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    (value.state === "PENDING_CONFIRMATION" || value.state === "CONFIRMED") &&
    (value.confirmedAtUtc === null || isDateTime(value.confirmedAtUtc)) &&
    isNullableString(value.confirmedByUserId);
}

export async function updateTechnicalProposalItemInclusion(
  requirementId: string,
  itemId: string,
  request: TechnicalProposalItemInclusionRequest,
): Promise<TechnicalProposalItemInclusionResponse> {
  const response = await apiRequest(
    `/api/v2/requirements/${encodeURIComponent(requirementId)}/technical-proposal/items/${encodeURIComponent(itemId)}/inclusion`,
    { method: "PATCH", authenticated: true, body: request },
  );
  if (!isInclusionResponse(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio un cambio de inclusion con un formato inesperado.",
    });
  }
  return response;
}

export async function updateTechnicalProposalItemSelection(
  technicalProposalId: string,
  itemId: string,
  request: TechnicalProposalSelectionRequest,
): Promise<void> {
  await apiRequest(
    `/api/v2/technical-proposals/${encodeURIComponent(technicalProposalId)}/items/${encodeURIComponent(itemId)}/selection`,
    { method: "PUT", authenticated: true, body: request },
  );
}

export async function confirmTechnicalProposalSelection(technicalProposalId: string): Promise<TechnicalProposalSelectionConfirmationResponse> {
  const response = await apiRequest(
    `/api/v2/technical-proposals/${encodeURIComponent(technicalProposalId)}/confirm-selection`,
    { method: "POST", authenticated: true },
  );
  if (!isConfirmationResponse(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: "El servidor devolvio una confirmacion con un formato inesperado.",
    });
  }
  return response;
}

function technicalProposalSelectionProblemCode(error: ApiError): string | null {
  const value = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getTechnicalProposalSelectionConfirmationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible confirmar las configuraciones.";
  if (technicalProposalSelectionProblemCode(error) === "TECHNICAL_PROPOSAL_NO_INCLUDED_ITEMS") return "No hay elementos incluidos en la propuesta.";
  if (technicalProposalSelectionProblemCode(error) === "TECHNICAL_PROPOSAL_FUNCTIONAL_TYPE_MISMATCH") {
    return "Has seleccionado un sistema que no pertenece a la funcion del requerimiento. Por favor escoge un sistema coherente.";
  }
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "La propuesta tecnica no es valida.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    403: "No tienes acceso para confirmar esta propuesta.",
    404: "La propuesta tecnica ya no esta disponible.",
    409: "Completa las configuraciones antes de confirmar.",
    500: "No fue posible confirmar las configuraciones.",
  };
  return messages[error.status] ?? "No fue posible confirmar las configuraciones.";
}

export function getTechnicalProposalSelectionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible guardar la configuracion seleccionada.";
  if (technicalProposalSelectionProblemCode(error) === "TECHNICAL_PROPOSAL_FUNCTIONAL_TYPE_MISMATCH") {
    return "Has seleccionado un sistema que no pertenece a la funcion del requerimiento. Por favor escoge un sistema coherente.";
  }
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor.",
    400: "La configuracion seleccionada no es valida.",
    401: "Tu sesion expiro. Inicia sesion nuevamente.",
    403: "No tienes acceso para modificar esta configuracion.",
    404: "La propuesta o el elemento ya no esta disponible.",
    409: "La configuracion no se puede modificar en el estado actual.",
    500: "No fue posible guardar la configuracion seleccionada.",
  };
  return messages[error.status] ?? "No fue posible guardar la configuracion seleccionada.";
}
