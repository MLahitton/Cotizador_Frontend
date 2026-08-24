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
import { RequirementWorkspace } from "@/features/prequotes/components/requirement-workspace";
import { usePreQuoteDetails } from "@/features/prequotes/use-prequote-details";

export function PreQuoteDetailPageContent({
  projectId,
  preQuoteId,
}: {
  projectId: string;
  preQuoteId: string;
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
          <RequirementWorkspace
            preQuoteId={preQuote.id}
            projectIsActive={project.isActive}
          />
        </>
      ) : null}
    </div>
  );
}
