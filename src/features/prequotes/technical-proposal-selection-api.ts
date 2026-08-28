import { isDateTime, isNonEmptyString, isNullableString, isRecord } from "@/features/prequotes/newpipe-guards";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

export interface TechnicalProposalSelectionConfirmationResponse {
  technicalProposalId: string;
  state: "PENDING_CONFIRMATION" | "CONFIRMED";
  confirmedAtUtc: string | null;
  confirmedByUserId: string | null;
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

function isConfirmationResponse(value: unknown): value is TechnicalProposalSelectionConfirmationResponse {
  return isRecord(value) && isNonEmptyString(value.technicalProposalId) &&
    (value.state === "PENDING_CONFIRMATION" || value.state === "CONFIRMED") &&
    (value.confirmedAtUtc === null || isDateTime(value.confirmedAtUtc)) &&
    isNullableString(value.confirmedByUserId);
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

export function getTechnicalProposalSelectionConfirmationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "No fue posible confirmar las configuraciones.";
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