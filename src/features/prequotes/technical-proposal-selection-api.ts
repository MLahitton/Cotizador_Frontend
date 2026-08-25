import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

export interface TechnicalProposalSelectionRequest {
  confirmSuggested?: true;
  systemId?: string | null;
  glassId?: string | null;
  finishId?: string | null;
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
