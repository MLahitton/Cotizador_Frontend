"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { CreatePreQuoteConfirmation } from "@/features/prequotes/components/create-prequote-confirmation";
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
import { useCreatePreQuote } from "@/features/prequotes/use-create-prequote";
import { useProjectPreQuotes } from "@/features/prequotes/use-project-prequotes";

export function ProjectPreQuotesPageContent({
  projectId,
  page,
}: {
  projectId: string;
  page: number;
}) {
  const router = useRouter();
  const [createConfirmationProjectId, setCreateConfirmationProjectId] =
    useState<string | null>(null);
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
  const {
    create,
    isSubmitting: isCreateSubmitting,
    error: createError,
    reset: resetCreate,
  } = useCreatePreQuote(projectId);

  const canCreatePreQuote = Boolean(project?.isActive);
  const isCreateConfirmationOpen =
    createConfirmationProjectId === projectId;
  const createDisabledReason =
    project && !project.isActive
      ? "Activa el proyecto para crear precotizaciones."
      : null;

  const handleRequestCreate = useCallback(() => {
    if (!canCreatePreQuote || isCreateSubmitting) {
      return;
    }

    resetCreate();
    setCreateConfirmationProjectId(projectId);
  }, [canCreatePreQuote, isCreateSubmitting, projectId, resetCreate]);

  const handleCancelCreate = useCallback(() => {
    if (isCreateSubmitting) {
      return;
    }

    resetCreate();
    setCreateConfirmationProjectId(null);
  }, [isCreateSubmitting, resetCreate]);

  const handleConfirmCreate = useCallback(async () => {
    const result = await create();

    if (result.status !== "created") {
      return;
    }

    router.push(
      `/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(result.preQuote.id)}`,
    );
  }, [create, projectId, router]);

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
      <ProjectPreQuotesHeader
        project={project}
        onRequestCreate={handleRequestCreate}
        isCreateDisabled={!canCreatePreQuote || isCreateSubmitting}
        isCreating={isCreateSubmitting}
        createDisabledReason={createDisabledReason}
      />

      {isCreateConfirmationOpen ? (
        <CreatePreQuoteConfirmation
          projectCode={project.code}
          projectName={project.name}
          isSubmitting={isCreateSubmitting}
          error={createError}
          onConfirm={handleConfirmCreate}
          onCancel={handleCancelCreate}
        />
      ) : null}

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
            onRequestCreate={handleRequestCreate}
            canCreate={canCreatePreQuote}
            isCreating={isCreateSubmitting}
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
