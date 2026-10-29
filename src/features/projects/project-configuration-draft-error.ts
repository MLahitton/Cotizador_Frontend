import { getRequirementExperienceConfigurationErrorCode } from "@/features/prequotes/requirement-experience-api";
import { ApiError } from "@/lib/http/api-error";

export function getConfigurationDraftFailure(error: unknown): {
  status: "conflict" | "error";
  message: string;
} {
  // Keep conflict handling independent of translated copy and HTTP status alone.
  if (getRequirementExperienceConfigurationErrorCode(error) === "REQUIREMENT_EXPERIENCE_CONFLICT") {
    return {
      status: "conflict",
      message: "Estas prioridades cambiaron. Vuelve a cargarlas antes de guardar de nuevo.",
    };
  }

  const fallback = "No fue posible guardar las prioridades.";
  const messages: Record<number, string> = {
    0: "No fue posible conectar con el servidor para guardar las prioridades.",
    400: "No fue posible guardar las prioridades. Revisa las respuestas seleccionadas.",
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes permiso para guardar las prioridades.",
    404: "El elemento ya no está disponible.",
    409: "No fue posible guardar las prioridades en el estado actual. Vuelve a cargar los datos.",
    500: fallback,
  };
  return {
    status: "error",
    message: error instanceof ApiError ? messages[error.status] ?? fallback : fallback,
  };
}
