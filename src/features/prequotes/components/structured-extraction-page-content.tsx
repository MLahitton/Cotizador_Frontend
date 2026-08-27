"use client";

import {
  getPreQuoteDetailsErrorMessage,
  getProjectContextErrorMessage,
} from "@/features/prequotes/components/prequote-errors";
import {
  InvalidIdentifierFeedback,
  PreQuotesError,
  PreQuotesLoading,
} from "@/features/prequotes/components/prequotes-status";
import { StructuredExtractionErrorState } from "@/features/prequotes/components/structured-extraction-error-state";
import { StructuredExtractionInvalidDocumentState } from "@/features/prequotes/components/structured-extraction-invalid-document-state";
import {
  StructuredExtractionHeader,
  StructuredExtractionView,
} from "@/features/prequotes/components/structured-extraction-view";
import { isValidProjectId } from "@/features/projects/project-identifiers";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { isPreQuoteProjectMismatchError } from "@/features/prequotes/prequotes-api";
import { useStructuredExtractionDetails } from "@/features/prequotes/use-structured-extraction-details";

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
  const isProjectIdValid = isValidProjectId(projectId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);
  const isDocumentIdValid = isValidPreQuoteId(documentId);

  if (!isProjectIdValid) {
    return (
      <InvalidIdentifierFeedback message="Identificador de proyecto inválido." />
    );
  }

  if (!isPreQuoteIdValid) {
    return (
      <InvalidIdentifierFeedback message="Identificador de precotización inválido." />
    );
  }

  if (!isDocumentIdValid) {
    return (
      <StructuredExtractionInvalidDocumentState
        projectId={projectId}
        preQuoteId={preQuoteId}
      />
    );
  }

  return (
    <StructuredExtractionLoadedPageContent
      projectId={projectId}
      preQuoteId={preQuoteId}
      documentId={documentId}
    />
  );
}

function StructuredExtractionLoadedPageContent({
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
  } = useStructuredExtractionDetails(projectId, preQuoteId, documentId);

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
          <StructuredExtractionHeader project={project} preQuote={preQuote} />

          {isExtractionLoading ? (
            <PreQuotesLoading message="Cargando extracción..." />
          ) : null}

          {extractionError ? (
            <StructuredExtractionErrorState
              project={project}
              preQuote={preQuote}
              documentId={documentId}
              error={extractionError.cause}
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
