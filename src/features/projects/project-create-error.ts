import { PROJECT_ERROR_CODES } from "@/features/projects/project-error-codes";
import { getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

export type ProjectCreateErrorKind =
  | "invalid-request"
  | "unauthorized"
  | "inactive-user"
  | "client-not-found"
  | "client-inactive"
  | "duplicate-code"
  | "persistence-error"
  | "unknown";

export interface ProjectCreateErrorClassification {
  kind: ProjectCreateErrorKind;
  message: string;
  field?: "client" | "code";
  formMessage?: string;
  resetClientSelection?: boolean;
}

const FALLBACK_MESSAGE =
  "No fue posible crear el proyecto. Revisa la información e inténtalo nuevamente.";

function classifyByStatus(status: number): ProjectCreateErrorClassification {
  switch (status) {
    case 0:
      return {
        kind: "unknown",
        message:
          "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      };
    case 400:
      return {
        kind: "invalid-request",
        message:
          "No fue posible crear el proyecto porque algunos datos no son válidos.",
      };
    case 401:
      return {
        kind: "unauthorized",
        message: "La sesión no es válida. Inicia sesión nuevamente.",
      };
    case 403:
      return {
        kind: "inactive-user",
        message: "No tienes acceso para crear proyectos.",
      };
    case 404:
      return {
        kind: "unknown",
        message: "El recurso solicitado ya no está disponible.",
      };
    case 409:
      return {
        kind: "unknown",
        message:
          "No fue posible crear el proyecto por un conflicto con la información actual.",
      };
    case 500:
      return {
        kind: "persistence-error",
        message: "No fue posible guardar el proyecto. Inténtalo nuevamente.",
      };
    default:
      return {
        kind: "unknown",
        message: FALLBACK_MESSAGE,
      };
  }
}

export function classifyProjectCreateError(
  error: unknown,
): ProjectCreateErrorClassification {
  if (!(error instanceof ApiError)) {
    return {
      kind: "unknown",
      message: FALLBACK_MESSAGE,
    };
  }

  const code = getApiErrorCode(error);
  switch (code) {
    case PROJECT_ERROR_CODES.invalidRequest:
      return {
        kind: "invalid-request",
        message:
          "No fue posible crear el proyecto porque algunos datos no son válidos.",
      };
    case PROJECT_ERROR_CODES.unauthorized:
      return {
        kind: "unauthorized",
        message: "La sesión no es válida. Inicia sesión nuevamente.",
      };
    case PROJECT_ERROR_CODES.inactiveUser:
      return {
        kind: "inactive-user",
        message: "Tu usuario no tiene acceso para crear proyectos.",
      };
    case PROJECT_ERROR_CODES.clientNotFound:
      return {
        kind: "client-not-found",
        field: "client",
        message:
          "El cliente seleccionado ya no está disponible. Selecciona otro cliente.",
        formMessage: "Selecciona otro cliente activo antes de continuar.",
        resetClientSelection: true,
      };
    case PROJECT_ERROR_CODES.clientInactive:
      return {
        kind: "client-inactive",
        field: "client",
        message:
          "El cliente seleccionado está inactivo. Selecciona otro cliente activo.",
        formMessage: "Selecciona otro cliente activo antes de continuar.",
        resetClientSelection: true,
      };
    case PROJECT_ERROR_CODES.duplicateCode:
      return {
        kind: "duplicate-code",
        field: "code",
        message: "Ya existe un proyecto con este código.",
        formMessage: "Corrige el código del proyecto antes de continuar.",
      };
    case PROJECT_ERROR_CODES.persistenceError:
      return {
        kind: "persistence-error",
        message: "No fue posible guardar el proyecto. Inténtalo nuevamente.",
      };
    case PROJECT_ERROR_CODES.methodNotAllowed:
      return {
        kind: "unknown",
        message: "La operación solicitada no está disponible.",
      };
    case PROJECT_ERROR_CODES.payloadTooLarge:
      return {
        kind: "unknown",
        message: "La solicitud supera el tamaño permitido por el servidor.",
      };
    case PROJECT_ERROR_CODES.internalServerError:
      return {
        kind: "unknown",
        message: "No fue posible completar la operación. Inténtalo nuevamente.",
      };
    default:
      return classifyByStatus(error.status);
  }
}
