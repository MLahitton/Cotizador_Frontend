"use client";

import { useSearchParams } from "next/navigation";

import { Surface } from "@/components/ui/surface";
import { useAuth } from "@/features/auth/auth-context";
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
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user } = useAuth();

  const isAdminView =
    user?.role === "ADMIN" &&
    searchParams.get("adminView") === "1";

  const adminBackHref =
  returnTo || "/admin";

  const adminBackLabel =
  returnTo?.includes("/projects/") &&
  returnTo.endsWith("/prequotes")
    ? "Volver a precotizaciones"
    : returnTo?.includes("/projects/")
      ? "Volver al proyecto"
      : returnTo?.includes("/admin/prequotes")
        ? "Volver a precotizaciones"
        : "Volver al panel administrativo";

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
    return (
      <InvalidIdentifierFeedback message="Identificador de proyecto inválido." />
    );
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
      <PreQuoteDetailHeader
        project={project}
        preQuote={preQuote}
        adminView={isAdminView}
        adminBackHref={adminBackHref}
        adminBackLabel={adminBackLabel}
      />

      {isAdminView ? (
        <Surface variant="subtle">
          <p className="text-sm font-semibold text-foreground">
            Vista administrativa de solo lectura
          </p>

          <p className="mt-1 text-sm text-foreground-secondary">
            Puedes consultar la información de esta precotización, pero las
            acciones que modifican el trabajo del usuario están deshabilitadas.
          </p>
        </Surface>
      ) : null}

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
          <PreQuoteDetailView
            project={project}
            preQuote={preQuote}
            onNameUpdated={retryPreQuote}
            readOnly={isAdminView}
          />

          <RequirementWorkspace
            preQuoteId={preQuote.id}
            preQuoteName={preQuote.name}
            preQuoteSerial={preQuote.serial}
            projectIsActive={project.isActive}
            readOnly={isAdminView}
          />
        </>
      ) : null}
    </div>
  );
}