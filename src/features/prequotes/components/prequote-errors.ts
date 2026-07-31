import {
  isInvalidCreatePreQuoteResponseError,
  isPreQuoteProjectMismatchError,
} from "@/features/prequotes/prequotes-api";
import { ApiError } from "@/lib/http/api-error";

export function getProjectContextErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible consultar el proyecto. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible consultar el proyecto porque la solicitud no es válida.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes acceso para consultar este proyecto.";
    case 404:
      return "El proyecto ya no está disponible.";
    case 500:
      return "No fue posible consultar el proyecto. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar el proyecto. Inténtalo nuevamente.";
  }
}

export function getProjectPreQuotesErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible consultar las precotizaciones. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible consultar las precotizaciones porque la solicitud no es válida.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes acceso para consultar las precotizaciones.";
    case 404:
      return "El proyecto ya no está disponible.";
    case 500:
      return "No fue posible consultar las precotizaciones. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar las precotizaciones. Inténtalo nuevamente.";
  }
}

export function getCreatePreQuoteErrorMessage(error: unknown): string {
  if (isInvalidCreatePreQuoteResponseError(error)) {
    return "El servidor devolvió una respuesta inesperada al crear la precotización.";
  }

  if (!(error instanceof ApiError)) {
    return "No fue posible crear la precotización. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible crear la precotización porque la solicitud no es válida.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes acceso para crear precotizaciones.";
    case 404:
      return "El proyecto o su cliente ya no está disponible.";
    case 409:
      return "El proyecto o su cliente no permite crear precotizaciones en su estado actual.";
    case 500:
      return "No fue posible crear la precotización. Inténtalo nuevamente.";
    default:
      return "No fue posible crear la precotización. Inténtalo nuevamente.";
  }
}

export function getPreQuoteDetailsErrorMessage(error: unknown): string {
  if (isPreQuoteProjectMismatchError(error)) {
    return "La precotización solicitada no pertenece a este proyecto.";
  }

  if (!(error instanceof ApiError)) {
    return "No fue posible consultar la precotización. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible consultar la precotización porque la solicitud no es válida.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes acceso para consultar esta precotización.";
    case 404:
      return "La precotización ya no está disponible.";
    case 500:
      return "No fue posible consultar la precotización. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar la precotización. Inténtalo nuevamente.";
  }
}

export function getPreQuoteDocumentsErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible consultar los documentos. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible consultar los documentos porque la solicitud no es válida.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes acceso para consultar los documentos.";
    case 404:
      return "La precotización ya no está disponible.";
    case 500:
      return "No fue posible consultar los documentos. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar los documentos. Inténtalo nuevamente.";
  }
}
