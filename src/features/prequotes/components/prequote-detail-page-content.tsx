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
import {
  PreQuoteDetailHeader,
  PreQuoteDetailView,
} from "@/features/prequotes/components/prequote-detail-view";
import { PreQuoteDocumentsSection } from "@/features/prequotes/components/prequote-documents-section";
import { usePreQuoteDetails } from "@/features/prequotes/use-prequote-details";
import { usePreQuoteDocuments } from "@/features/prequotes/use-prequote-documents";

export function PreQuoteDetailPageContent({
  projectId,
  preQuoteId,
  documentsPage,
}: {
  projectId: string;
  preQuoteId: string;
  documentsPage: number;
}) {
  const {
    project,
    preQuote,
    projectError,
    preQuoteError,
    isProjectLoading,
    isPreQuoteLoading,
    retryProject,
    retryPreQuote,
    isProjectIdValid,
    isPreQuoteIdValid,
  } = usePreQuoteDetails(projectId, preQuoteId);
  const documents = usePreQuoteDocuments(
    preQuoteId,
    documentsPage,
    Boolean(preQuote && !preQuoteError && isPreQuoteIdValid),
  );

  if (!isProjectIdValid) {
    return <InvalidIdentifierFeedback message="Identificador de proyecto inválido." />;
  }

  if (!isPreQuoteIdValid) {
    return (
      <InvalidIdentifierFeedback message="Identificador de precotización inválido." />
    );
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
      <PreQuoteDetailHeader project={project} preQuoteId={preQuoteId} />

      {isPreQuoteLoading ? (
        <PreQuotesLoading message="Cargando precotización..." />
      ) : null}

      {preQuoteError ? (
        <PreQuotesError
          title="No fue posible consultar la precotización"
          message={getPreQuoteDetailsErrorMessage(preQuoteError.cause)}
          onRetry={retryPreQuote}
        />
      ) : null}

      {preQuote && !isPreQuoteLoading && !preQuoteError ? (
        <>
          <PreQuoteDetailView project={project} preQuote={preQuote} />
          <PreQuoteDocumentsSection
            projectId={project.id}
            preQuoteId={preQuote.id}
            projectIsActive={project.isActive}
            documentsPage={documents.documentsPage}
            error={documents.error}
            isLoading={documents.isLoading}
            isRefreshing={documents.isRefreshing}
            onRefresh={documents.refresh}
          />
        </>
      ) : null}
    </div>
  );
}
