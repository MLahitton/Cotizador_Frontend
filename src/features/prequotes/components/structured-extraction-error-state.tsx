"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import type { PreQuoteDetails } from "@/features/prequotes/prequotes-types";
import {
  isInvalidStructuredExtractionResponseError,
  isStructuredDocumentMismatchError,
} from "@/features/prequotes/structured-extraction-api";
import { API_ERROR_CODES, getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";
import { cn } from "@/lib/utils/cn";

function getStructuredExtractionErrorMessage(error: unknown): string {
  if (isInvalidStructuredExtractionResponseError(error)) {
    return "El servidor devolvió información que esta versión de la aplicación no pudo interpretar. Revisa el estado del documento desde la precotización o reintenta.";
  }

  if (isStructuredDocumentMismatchError(error)) {
    return "El documento solicitado no pertenece a esta precotización.";
  }

  if (!(error instanceof ApiError)) {
    return "No fue posible consultar la extracción. Inténtalo nuevamente.";
  }

  switch (getApiErrorCode(error)) {
    case PREQUOTE_ERROR_CODES.structuredExtractionInvalidRequest:
      return "No fue posible consultar la extracción porque la solicitud no es válida.";
    case PREQUOTE_ERROR_CODES.unauthorized:
      return "Tu sesión no es válida o expiró.";
    case PREQUOTE_ERROR_CODES.inactiveUser:
      return "No tienes acceso para consultar esta extracción.";
    case PREQUOTE_ERROR_CODES.processingDocumentNotFound:
    case PREQUOTE_ERROR_CODES.structuredExtractionNotFound:
      return "No se encontró una extracción disponible para este documento o el documento ya no está accesible.";
    case PREQUOTE_ERROR_CODES.structuredExtractionQueryError:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 403:
      return "No tienes acceso para consultar esta extracción.";
    case 404:
      return "No se encontró una extracción disponible para este documento o el documento ya no está accesible.";
    case 500:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
  }
}

export function StructuredExtractionErrorState({
  project,
  preQuote,
  documentId,
  error,
  onRetry,
}: {
  project: ProjectDetails;
  preQuote: PreQuoteDetails;
  documentId: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Surface>
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-w-0 items-start gap-3"
      >
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              No fue posible mostrar la extracción
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {getStructuredExtractionErrorMessage(error)}
            </p>
          </div>

          <dl className="grid gap-3 text-sm text-foreground-secondary sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0">
              <dt className="font-medium text-foreground">Proyecto</dt>
              <dd className="break-words">
                {project.code} · {project.name}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-medium text-foreground">Precotización</dt>
              <dd className="break-all">{preQuote.id}</dd>
            </div>
            <div className="min-w-0 sm:col-span-2">
              <dt className="font-medium text-foreground">Documento</dt>
              <dd className="break-all">{documentId}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/projects/${encodeURIComponent(project.id)}/prequotes/${encodeURIComponent(preQuote.id)}`}
              className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}
            >
              Volver a la precotización
            </Link>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onRetry}
            >
              <RotateCw aria-hidden="true" size={17} strokeWidth={1.75} />
              Reintentar
            </Button>
            <Link
              href={`/projects/${encodeURIComponent(project.id)}/prequotes`}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
            >
              Volver a precotizaciones
            </Link>
            <Link
              href={`/projects/${encodeURIComponent(project.id)}`}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
            >
              Volver al proyecto
            </Link>
          </div>
        </div>
      </div>
    </Surface>
  );
}
