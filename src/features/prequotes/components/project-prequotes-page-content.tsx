"use client";

import {
  getProjectContextErrorMessage,
  getProjectPreQuotesErrorMessage,
} from "@/features/prequotes/components/prequote-errors";
import {
  InvalidIdentifierFeedback,
  PreQuotesError,
  PreQuotesLoading,
} from "@/features/prequotes/components/prequotes-status";
import { ProjectPreQuotesHeader } from "@/features/prequotes/components/project-prequotes-header";
import { ProjectPreQuotesPagination } from "@/features/prequotes/components/project-prequotes-pagination";
import { ProjectPreQuotesTable } from "@/features/prequotes/components/project-prequotes-table";
import { useProjectPreQuotes } from "@/features/prequotes/use-project-prequotes";

export function ProjectPreQuotesPageContent({
  projectId,
  page,
}: {
  projectId: string;
  page: number;
}) {
  const {
    project,
    projectError,
    isProjectLoading,
    retryProject,
    preQuotesPage,
    preQuotesError,
    isPreQuotesLoading,
    isPreQuotesRefreshing,
    retryPreQuotes,
    pageSize,
    isProjectIdValid,
  } = useProjectPreQuotes(projectId, page);

  if (!isProjectIdValid) {
    return <InvalidIdentifierFeedback message="Identificador de proyecto inválido." />;
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
      <ProjectPreQuotesHeader project={project} />

      {preQuotesError ? (
        <PreQuotesError
          title="No fue posible consultar las precotizaciones"
          message={getProjectPreQuotesErrorMessage(preQuotesError.cause)}
          onRetry={retryPreQuotes}
        />
      ) : null}

      {isPreQuotesLoading ? (
        <PreQuotesLoading message="Cargando precotizaciones..." />
      ) : null}

      {isPreQuotesRefreshing ? (
        <p
          className="text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          Actualizando precotizaciones...
        </p>
      ) : null}

      {preQuotesPage && !isPreQuotesLoading ? (
        <>
          <ProjectPreQuotesTable
            projectId={project.id}
            items={preQuotesPage.items}
            onRetry={retryPreQuotes}
          />
          <ProjectPreQuotesPagination
            projectId={project.id}
            page={preQuotesPage.page}
            pageSize={preQuotesPage.pageSize || pageSize}
            totalCount={preQuotesPage.totalCount}
            totalPages={preQuotesPage.totalPages}
          />
        </>
      ) : null}
    </div>
  );
}
