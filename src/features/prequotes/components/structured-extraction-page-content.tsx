"use client";

import { ApiError } from "@/lib/http/api-error";
import {
  getPreQuoteDetailsErrorMessage,
  getProjectContextErrorMessage,
} from "@/features/prequotes/components/prequote-errors";
import {
  InvalidIdentifierFeedback,
  PreQuotesError,
  PreQuotesLoading,
} from "@/features/prequotes/components/prequotes-status";
import { StructuredExtractionView } from "@/features/prequotes/components/structured-extraction-view";
import { isPreQuoteProjectMismatchError } from "@/features/prequotes/prequotes-api";
import { isStructuredDocumentMismatchError } from "@/features/prequotes/structured-extraction-api";
import { useStructuredExtractionDetails } from "@/features/prequotes/use-structured-extraction-details";

function getExtractionErrorMessage(error: unknown): string {
  if (isStructuredDocumentMismatchError(error)) {
    return "El documento solicitado no pertenece a esta precotización.";
  }

  if (!(error instanceof ApiError)) {
    return "No fue posible consultar la extracción. Inténtalo nuevamente.";
  }

  switch (error.status) {
    case 0:
      return error.detail ===
        "El servidor devolvió una respuesta inesperada al consultar la extracción."
        ? error.detail
        : "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 400:
      return "No fue posible consultar la extracción porque la solicitud no es válida.";
    case 403:
      return "No tienes acceso para consultar esta extracción.";
    case 404:
      return "El documento ya no está disponible.";
    case 500:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
    default:
      return "No fue posible consultar la extracción. Inténtalo nuevamente.";
  }
}

function getPreQuoteContextErrorMessage(error: unknown): string {
  if (isPreQuoteProjectMismatchError(error)) {
    return "La precotización solicitada no pertenece a este proyecto.";
  }

  return getPreQuoteDetailsErrorMessage(error);
}

export function StructuredExtractionPageContent({
  projectId,
  preQuoteId,
  documentId,
}: {
  projectId: string;
  preQuoteId: string;
  documentId: string;
}) {
  const {
    project,
    preQuote,
    extraction,
    projectError,
    preQuoteError,
    extractionError,
    isProjectLoading,
    isPreQuoteLoading,
    isExtractionLoading,
    retryProject,
    retryPreQuote,
    retryExtraction,
    isProjectIdValid,
    isPreQuoteIdValid,
    isDocumentIdValid,
  } = useStructuredExtractionDetails(projectId, preQuoteId, documentId);

  if (!isProjectIdValid) {
    return <InvalidIdentifierFeedback message="Identificador de proyecto inválido." />;
  }

  if (!isPreQuoteIdValid) {
    return (
      <InvalidIdentifierFeedback message="Identificador de precotización inválido." />
    );
  }

  if (!isDocumentIdValid) {
    return <InvalidIdentifierFeedback message="Identificador de documento inválido." />;
  }

  if (isProjectLoading) {
    return <PreQuotesLoading message="Cargando proyecto..." />;
  }

  if (projectError) {
    return (
      <PreQuotesError
        title="No fue posible consultar el proyecto"
        message={getProjectContextErrorMessage(projectError.cause)}
        onRetry={retryProject}
      />
    );
  }

  if (!project) {
    return (
      <PreQuotesError
        title="Proyecto no disponible"
        message="No fue posible cargar el contexto del proyecto."
        onRetry={retryProject}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {isPreQuoteLoading ? (
        <PreQuotesLoading message="Cargando precotización..." />
      ) : null}

      {preQuoteError ? (
        <PreQuotesError
          title="No fue posible consultar la precotización"
          message={getPreQuoteContextErrorMessage(preQuoteError.cause)}
          onRetry={retryPreQuote}
        />
      ) : null}

      {preQuote && !isPreQuoteLoading && !preQuoteError ? (
        <>
          {isExtractionLoading ? (
            <PreQuotesLoading message="Cargando extracción..." />
          ) : null}

          {extractionError ? (
            <PreQuotesError
              title="No fue posible consultar la extracción"
              message={getExtractionErrorMessage(extractionError.cause)}
              onRetry={retryExtraction}
            />
          ) : null}

          {extraction && !isExtractionLoading && !extractionError ? (
            <StructuredExtractionView
              project={project}
              preQuote={preQuote}
              details={extraction}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
