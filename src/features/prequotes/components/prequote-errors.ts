import {
  isInvalidCreatePreQuoteResponseError,
  isPreQuoteProjectMismatchError,
} from "@/features/prequotes/prequotes-api";
import {
  isInvalidCreatePreQuoteDraftResponseError,
  isInvalidPreQuoteDraftResponseError,
} from "@/features/prequotes/prequote-draft-api";
import {
  isInvalidStartDocumentProcessingResponseError,
  isInvalidUploadPreQuoteDocumentResponseError,
} from "@/features/prequotes/prequote-documents-api";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import { API_ERROR_CODES, getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

export type PreQuoteDraftErrorKind =
  | "not-found"
  | "already-exists"
  | "project-inactive"
  | "client-inactive"
  | "query-error"
  | "persistence-error"
  | "unknown";

export interface PreQuoteDraftErrorContent {
  kind: PreQuoteDraftErrorKind;
  message: string;
}

function getStatusFallbackMessage(
  error: ApiError,
  messages: Partial<Record<number, string>>,
  fallbackMessage: string,
): string {
  return messages[error.status] ?? fallbackMessage;
}

export function isStartDocumentProcessingAlreadyActiveError(
  error: unknown,
): boolean {
  return getApiErrorCode(error) === PREQUOTE_ERROR_CODES.processingAlreadyActive;
}

export function getProjectContextErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible consultar el proyecto. Inténtalo nuevamente.";

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case "PROJECT_INVALID_REQUEST":
      return "No fue posible consultar el proyecto porque la solicitud no es válida.";
    case "PROJECT_NOT_FOUND":
      return "El proyecto ya no está disponible.";
    case "PROJECT_QUERY_ERROR":
      return fallbackMessage;
    case API_ERROR_CODES.unauthorized:
      return "Tu sesión no es válida o expiró.";
    case API_ERROR_CODES.inactiveUser:
      return "No tienes acceso para consultar este proyecto.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible consultar el proyecto porque la solicitud no es válida.",
      401: "Tu sesión no es válida o expiró.",
      403: "No tienes acceso para consultar este proyecto.",
      404: "El proyecto ya no está disponible.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getProjectPreQuotesErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible consultar las precotizaciones. Inténtalo nuevamente.";

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.listInvalidRequest:
      return "No fue posible consultar las precotizaciones porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no es válida o expiró.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "No tienes acceso para consultar las precotizaciones.";
    case PREQUOTE_ERROR_CODES.projectNotFound:
      return "El proyecto ya no está disponible.";
    case PREQUOTE_ERROR_CODES.listQueryError:
      return fallbackMessage;
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible consultar las precotizaciones porque la solicitud no es válida.",
      401: "Tu sesión no es válida o expiró.",
      403: "No tienes acceso para consultar las precotizaciones.",
      404: "El proyecto ya no está disponible.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getCreatePreQuoteErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible crear la precotización. Inténtalo nuevamente.";

  if (isInvalidCreatePreQuoteResponseError(error)) {
    return "El servidor devolvió una respuesta inesperada al crear la precotización.";
  }

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.invalidRequest:
      return "No fue posible crear la precotización porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no permite crear precotizaciones. Inicia sesión nuevamente.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "Tu usuario no tiene acceso para crear precotizaciones.";
    case PREQUOTE_ERROR_CODES.projectNotFound:
      return "El proyecto ya no está disponible.";
    case PREQUOTE_ERROR_CODES.projectInactive:
      return "No se pueden crear precotizaciones para un proyecto inactivo.";
    case PREQUOTE_ERROR_CODES.clientNotFound:
      return "El cliente del proyecto ya no está disponible.";
    case PREQUOTE_ERROR_CODES.clientInactive:
      return "No se pueden crear precotizaciones porque el cliente está inactivo.";
    case PREQUOTE_ERROR_CODES.queryError:
      return "No fue posible consultar el proyecto antes de crear la precotización.";
    case PREQUOTE_ERROR_CODES.persistenceError:
      return "No fue posible registrar la precotización.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible crear la precotización porque la solicitud no es válida.",
      401: "Tu sesión no permite crear precotizaciones. Inicia sesión nuevamente.",
      403: "No tienes acceso para crear precotizaciones.",
      404: "El proyecto o su cliente ya no está disponible.",
      409: "El proyecto o su cliente no permite crear precotizaciones en su estado actual.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getPreQuoteDetailsErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible consultar la precotización. Inténtalo nuevamente.";

  if (isPreQuoteProjectMismatchError(error)) {
    return "La precotización solicitada no pertenece a este proyecto.";
  }

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.invalidRequest:
      return "No fue posible consultar la precotización porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no es válida o expiró.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "No tienes acceso para consultar esta precotización.";
    case PREQUOTE_ERROR_CODES.notFound:
      return "La precotización ya no está disponible.";
    case PREQUOTE_ERROR_CODES.queryError:
      return fallbackMessage;
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible consultar la precotización porque la solicitud no es válida.",
      401: "Tu sesión no es válida o expiró.",
      403: "No tienes acceso para consultar esta precotización.",
      404: "La precotización ya no está disponible.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getPreQuoteDocumentsErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible consultar los documentos. Inténtalo nuevamente.";

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.documentsInvalidRequest:
      return "No fue posible consultar los documentos porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no es válida o expiró.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "No tienes acceso para consultar los documentos.";
    case PREQUOTE_ERROR_CODES.notFound:
      return "La precotización ya no está disponible.";
    case PREQUOTE_ERROR_CODES.documentsQueryError:
      return fallbackMessage;
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible consultar los documentos porque la solicitud no es válida.",
      401: "Tu sesión no es válida o expiró.",
      403: "No tienes acceso para consultar los documentos.",
      404: "La precotización ya no está disponible.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getUploadPreQuoteDocumentErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible registrar el documento. Inténtalo nuevamente.";

  if (isInvalidUploadPreQuoteDocumentResponseError(error)) {
    return "El servidor devolvió una respuesta inesperada al registrar el documento.";
  }

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.documentInvalidRequest:
      return "No fue posible registrar el documento porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.documentUnsupportedFileType:
      return "El Backend rechazó el tipo de archivo. Verifica que admita PDF, XLSX, JPG o PNG.";
    case PREQUOTE_ERROR_CODES.documentEmptyFile:
      return "El documento está vacío o no contiene información válida.";
    case PREQUOTE_ERROR_CODES.documentFileTooLarge:
      return "El documento no puede superar 20 MiB.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no permite agregar documentos. Inicia sesión nuevamente.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "Tu usuario no tiene acceso para agregar documentos.";
    case PREQUOTE_ERROR_CODES.documentPreQuoteNotFound:
      return "La precotización, el proyecto o el cliente ya no está disponible.";
    case PREQUOTE_ERROR_CODES.documentProjectInactive:
      return "No se pueden agregar documentos a un proyecto inactivo.";
    case PREQUOTE_ERROR_CODES.documentClientInactive:
      return "No se pueden agregar documentos porque el cliente está inactivo.";
    case PREQUOTE_ERROR_CODES.documentStorageError:
      return "No fue posible almacenar el documento.";
    case PREQUOTE_ERROR_CODES.documentPersistenceError:
      return "No fue posible registrar el documento.";
    case API_ERROR_CODES.unsupportedMediaType:
      return "El Backend no admite todavía este formato de documento.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "El documento no puede superar 20 MiB.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible registrar el documento porque la solicitud no es válida.",
      401: "Tu sesión no es válida o expiró.",
      403: "No tienes acceso para agregar documentos.",
      404: "La precotización, el proyecto o el cliente ya no está disponible.",
      409: "El proyecto o su cliente no permite agregar documentos en su estado actual.",
      413: "El documento no puede superar 20 MiB.",
      415: "El Backend no admite todavía este formato de documento.",
      422: "El documento está vacío o no contiene información válida.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getStartDocumentProcessingErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible iniciar el procesamiento. Inténtalo nuevamente.";

  if (isInvalidStartDocumentProcessingResponseError(error)) {
    return "El servidor devolvió una respuesta inesperada al iniciar el procesamiento.";
  }

  if (!(error instanceof ApiError)) {
    return fallbackMessage;
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.processingInvalidRequest:
      return "No fue posible iniciar el procesamiento porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no permite iniciar el procesamiento. Inicia sesión nuevamente.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "Tu usuario no tiene acceso para procesar documentos.";
    case PREQUOTE_ERROR_CODES.processingDocumentNotFound:
      return "El documento ya no está disponible o no tienes acceso a él.";
    case PREQUOTE_ERROR_CODES.processingProjectInactive:
      return "No se pueden procesar documentos de un proyecto inactivo.";
    case PREQUOTE_ERROR_CODES.processingClientInactive:
      return "No se pueden procesar documentos porque el cliente está inactivo.";
    case PREQUOTE_ERROR_CODES.processingAlreadyActive:
      return "El documento ya tiene un procesamiento en curso. Actualiza los documentos para consultar su estado.";
    case PREQUOTE_ERROR_CODES.processingQueryError:
      return "No fue posible consultar el documento antes de iniciar el procesamiento.";
    case PREQUOTE_ERROR_CODES.processingPersistenceError:
      return "No fue posible registrar el intento de procesamiento.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  return getStatusFallbackMessage(
    error,
    {
      0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
      400: "No fue posible iniciar el procesamiento porque la solicitud no es válida.",
      401: "Tu sesión no permite iniciar el procesamiento. Inicia sesión nuevamente.",
      403: "No tienes acceso para procesar este documento.",
      404: "El documento ya no está disponible o no tienes acceso a él.",
      409: "No fue posible iniciar el procesamiento por el estado actual del documento, proyecto o cliente.",
      500: fallbackMessage,
    },
    fallbackMessage,
  );
}

export function getPreQuoteDraftErrorContent(
  error: unknown,
): PreQuoteDraftErrorContent {
  const fallbackMessage =
    "No fue posible consultar el borrador. Inténtalo nuevamente.";

  if (isInvalidPreQuoteDraftResponseError(error)) {
    return {
      kind: "unknown",
      message:
        "El servidor devolvió una respuesta inesperada al consultar el borrador.",
    };
  }

  if (!(error instanceof ApiError)) {
    return { kind: "unknown", message: fallbackMessage };
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.draftInvalidRequest:
      return {
        kind: "unknown",
        message: "No fue posible consultar el borrador solicitado.",
      };
    case PREQUOTE_ERROR_CODES.unauthorized:
      return {
        kind: "unknown",
        message: "Tu sesión no es válida o expiró.",
      };
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return {
        kind: "unknown",
        message: "No tienes acceso para consultar este borrador.",
      };
    case PREQUOTE_ERROR_CODES.draftNotFound:
      return {
        kind: "not-found",
        message: "El borrador no está disponible.",
      };
    case PREQUOTE_ERROR_CODES.draftQueryError:
      return {
        kind: "query-error",
        message: "No fue posible consultar el borrador.",
      };
    case API_ERROR_CODES.methodNotAllowed:
      return {
        kind: "unknown",
        message: "La operación solicitada no está disponible.",
      };
    case API_ERROR_CODES.payloadTooLarge:
      return {
        kind: "unknown",
        message: "La solicitud supera el tamaño permitido por el servidor.",
      };
    case API_ERROR_CODES.internalServerError:
      return { kind: "unknown", message: fallbackMessage };
  }

  return {
    kind: error.status === 404 ? "not-found" : "unknown",
    message: getStatusFallbackMessage(
      error,
      {
        0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
        400: "No fue posible consultar el borrador solicitado.",
        401: "Tu sesión no es válida o expiró.",
        403: "No tienes acceso para consultar este borrador.",
        404: "El borrador no está disponible.",
        500: fallbackMessage,
      },
      fallbackMessage,
    ),
  };
}

export function getCreatePreQuoteDraftErrorContent(
  error: unknown,
): PreQuoteDraftErrorContent {
  const fallbackMessage =
    "No fue posible crear el borrador. Inténtalo nuevamente.";

  if (isInvalidCreatePreQuoteDraftResponseError(error)) {
    return {
      kind: "unknown",
      message:
        "El servidor devolvió una respuesta inesperada al crear el borrador.",
    };
  }

  if (!(error instanceof ApiError)) {
    return { kind: "unknown", message: fallbackMessage };
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.draftInvalidRequest:
      return {
        kind: "unknown",
        message: "No fue posible crear el borrador porque la solicitud no es válida.",
      };
    case PREQUOTE_ERROR_CODES.unauthorized:
      return {
        kind: "unknown",
        message: "Tu sesión no permite crear el borrador. Inicia sesión nuevamente.",
      };
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return {
        kind: "unknown",
        message: "Tu usuario no tiene acceso para crear borradores.",
      };
    case PREQUOTE_ERROR_CODES.draftNotFound:
      return {
        kind: "not-found",
        message: "No fue posible preparar el borrador solicitado.",
      };
    case PREQUOTE_ERROR_CODES.draftProjectInactive:
      return {
        kind: "project-inactive",
        message: "No se puede crear el borrador porque el proyecto está inactivo.",
      };
    case PREQUOTE_ERROR_CODES.draftClientInactive:
      return {
        kind: "client-inactive",
        message: "No se puede crear el borrador porque el cliente está inactivo.",
      };
    case PREQUOTE_ERROR_CODES.draftAlreadyExists:
      return {
        kind: "already-exists",
        message: "El borrador ya existe.",
      };
    case PREQUOTE_ERROR_CODES.draftQueryError:
      return {
        kind: "query-error",
        message: "No fue posible consultar la información para crear el borrador.",
      };
    case PREQUOTE_ERROR_CODES.draftPersistenceError:
      return {
        kind: "persistence-error",
        message: "No fue posible guardar el borrador.",
      };
    case API_ERROR_CODES.methodNotAllowed:
      return {
        kind: "unknown",
        message: "La operación solicitada no está disponible.",
      };
    case API_ERROR_CODES.payloadTooLarge:
      return {
        kind: "unknown",
        message: "La solicitud supera el tamaño permitido por el servidor.",
      };
    case API_ERROR_CODES.internalServerError:
      return { kind: "unknown", message: fallbackMessage };
  }

  return {
    kind: "unknown",
    message: getStatusFallbackMessage(
      error,
      {
        0: "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
        400: "No fue posible crear el borrador porque la solicitud no es válida.",
        401: "Tu sesión no permite crear el borrador. Inicia sesión nuevamente.",
        403: "No tienes acceso para crear borradores.",
        404: "No fue posible preparar el borrador solicitado.",
        409: "No fue posible crear el borrador por el estado actual de la información.",
        500: fallbackMessage,
      },
      fallbackMessage,
    ),
  };
}
