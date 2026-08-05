"use client";

import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  getPreQuoteDetailsErrorMessage,
  getPreQuoteDraftErrorContent,
  getProjectContextErrorMessage,
} from "@/features/prequotes/components/prequote-errors";
import {
  InvalidIdentifierFeedback,
  PreQuotesError,
  PreQuotesLoading,
} from "@/features/prequotes/components/prequotes-status";
import {
  formatEconomicCompleteness,
  formatNullableDraftText,
  formatPreQuoteDraftArea,
  formatPreQuoteDraftDateTime,
  formatPreQuoteDraftMoney,
  formatPreQuoteDraftNumber,
  formatPreQuoteDraftStatus,
} from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftDetails } from "@/features/prequotes/prequote-draft-types";
import { usePreQuoteDetails } from "@/features/prequotes/use-prequote-details";
import { usePreQuoteDraft } from "@/features/prequotes/use-prequote-draft";
import { isValidProjectId } from "@/features/projects/project-identifiers";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";
import { cn } from "@/lib/utils/cn";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-subtle p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function DraftNotFoundState({
  projectId,
  preQuoteId,
  onRetry,
}: {
  projectId: string;
  preQuoteId: string;
  onRetry: () => void;
}) {
  return (
    <Surface>
      <div role="status" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-warning"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            Borrador no disponible
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            No fue posible encontrar un borrador para esta precotización.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}`}
              className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}
            >
              Volver a la precotización
            </Link>
            <Link
              href={`/projects/${encodeURIComponent(projectId)}/prequotes`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
              Volver a precotizaciones
            </Link>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function DraftHeader({
  projectId,
  preQuoteId,
  draft,
}: {
  projectId: string;
  preQuoteId: string;
  draft: PreQuoteDraftDetails;
}) {
  return (
    <header className="min-w-0 space-y-4">
      <nav className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-start px-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver a la precotización
        </Link>
        <Link
          href={`/projects/${encodeURIComponent(projectId)}/prequotes`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-start px-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver a precotizaciones
        </Link>
      </nav>
      <div className="min-w-0">
        <Badge tone="brand">Borrador de revisión</Badge>
        <h1 className="mt-4 break-words text-2xl font-semibold text-foreground sm:text-3xl">
          Borrador de precotización
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="info" size="sm">
            {formatPreQuoteDraftStatus(draft.status)}
          </Badge>
          <Badge tone="neutral" size="sm">
            Versión {formatPreQuoteDraftNumber(draft.version)}
          </Badge>
        </div>
      </div>
    </header>
  );
}

function GeneralInformation({ draft }: { draft: PreQuoteDraftDetails }) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-general-title">
        <h2 id="draft-general-title" className="text-lg font-semibold text-foreground">
          Información general
        </h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Proyecto detectado" value={formatNullableDraftText(draft.projectName)} />
          <DetailField label="Cliente detectado" value={formatNullableDraftText(draft.clientName)} />
          <DetailField label="Ubicación" value={formatNullableDraftText(draft.location)} />
          <DetailField label="Creado" value={formatPreQuoteDraftDateTime(draft.createdAtUtc)} />
          <DetailField label="Actualizado" value={formatPreQuoteDraftDateTime(draft.updatedAtUtc)} />
          {draft.approvedAtUtc ? (
            <DetailField
              label="Aprobado"
              value={formatPreQuoteDraftDateTime(draft.approvedAtUtc)}
            />
          ) : null}
        </dl>
      </section>
    </Surface>
  );
}

function OriginInformation({ draft }: { draft: PreQuoteDraftDetails }) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-origin-title">
        <h2 id="draft-origin-title" className="text-lg font-semibold text-foreground">
          Origen
        </h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          <DetailField label="Documento fuente" value={draft.sourceDocumentId} />
          <DetailField
            label="Extracción estructurada"
            value={draft.sourceStructuredExtractionId}
          />
        </dl>
      </section>
    </Surface>
  );
}

function OperationalSummary({ draft }: { draft: PreQuoteDraftDetails }) {
  const summary = draft.summary;
  const values = summary
    ? [
        ["Total de ítems", summary.totalItemCount],
        ["Incluidos", summary.includedItemCount],
        ["Excluidos", summary.excludedItemCount],
        ["Manuales", summary.manualItemCount],
        ["Requieren completar", summary.itemsRequiringCompletion],
        ["Issues pendientes", summary.pendingIssueCount],
        ["Conflicts pendientes", summary.pendingConflictCount],
      ]
    : [
        ["Total de ítems", draft.items.length],
        ["Incluidos", draft.items.filter((item) => item.isIncluded).length],
        ["Excluidos", draft.items.filter((item) => !item.isIncluded).length],
        ["Manuales", draft.items.filter((item) => item.origin === "MANUAL").length],
        ["Requieren completar", 0],
        ["Issues pendientes", draft.issues.filter((issue) => issue.resolutionStatus === "PENDING").length],
        ["Conflicts pendientes", draft.conflicts.filter((conflict) => conflict.resolutionStatus === "PENDING").length],
      ];

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-operational-title">
        <h2
          id="draft-operational-title"
          className="text-lg font-semibold text-foreground"
        >
          Resumen operativo
        </h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {values.map(([label, value]) => (
            <Metric key={label} label={String(label)} value={formatPreQuoteDraftNumber(Number(value))} />
          ))}
        </dl>
      </section>
    </Surface>
  );
}

function EconomicSummary({ draft }: { draft: PreQuoteDraftDetails }) {
  const summary = draft.economicSummary;
  const metrics = [
    ["Ítems incluidos", summary.includedItemCount],
    ["Unidades conocidas", summary.includedKnownQuoteableUnitCount],
    ["Valorados", summary.valuedItemCount],
    ["Pendientes", summary.pendingValuationItemCount],
    ["Desactualizados", summary.staleValuationItemCount],
    ["Requieren revisión", summary.itemsRequiringReviewCount],
  ] as const;

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-economic-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="draft-economic-title" className="text-lg font-semibold text-foreground">
            Resumen económico read-only
          </h2>
          <Badge tone={summary.isEconomicallyComplete ? "success" : "warning"} size="sm">
            {formatEconomicCompleteness(summary.isEconomicallyComplete)}
          </Badge>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <Metric key={label} label={label} value={formatPreQuoteDraftNumber(value)} />
          ))}
          <Metric
            label="Área total"
            value={formatPreQuoteDraftArea(summary.totalAreaSquareMeters)}
          />
          <Metric
            label="Subtotal registrado en el borrador"
            value={formatPreQuoteDraftMoney(summary.glassSubtotal, summary.currency)}
          />
          <Metric
            label="Moneda"
            value={formatNullableDraftText(summary.currency)}
          />
        </dl>
      </section>
    </Surface>
  );
}

function PreQuoteDraftView({
  projectId,
  preQuoteId,
  draft,
}: {
  projectId: string;
  preQuoteId: string;
  draft: PreQuoteDraftDetails;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <DraftHeader projectId={projectId} preQuoteId={preQuoteId} draft={draft} />
      <GeneralInformation draft={draft} />
      <OriginInformation draft={draft} />
      <OperationalSummary draft={draft} />
      <EconomicSummary draft={draft} />
    </div>
  );
}

export function PreQuoteDraftPageContent({
  projectId,
  preQuoteId,
}: {
  projectId: string;
  preQuoteId: string;
}) {
  const isProjectIdValid = isValidProjectId(projectId);
  const isPreQuoteIdValid = isValidPreQuoteId(preQuoteId);
  const {
    project,
    preQuote,
    projectError,
    preQuoteError,
    isProjectLoading,
    isPreQuoteLoading,
    retryProject,
    retryPreQuote,
  } = usePreQuoteDetails(projectId, preQuoteId);
  const draft = usePreQuoteDraft(
    preQuoteId,
    Boolean(project && preQuote && !projectError && !preQuoteError),
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

  if (isPreQuoteLoading) {
    return <PreQuotesLoading message="Cargando precotización..." />;
  }

  if (preQuoteError) {
    return (
      <PreQuotesError
        title="No fue posible consultar la precotización"
        message={getPreQuoteDetailsErrorMessage(preQuoteError.cause)}
        onRetry={retryPreQuote}
      />
    );
  }

  if (!preQuote) {
    return (
      <PreQuotesError
        title="Precotización no disponible"
        message="No fue posible cargar el contexto de la precotización."
        onRetry={retryPreQuote}
      />
    );
  }

  if (draft.isLoading) {
    return <PreQuotesLoading message="Cargando borrador..." />;
  }

  if (draft.isNotFound) {
    return (
      <DraftNotFoundState
        projectId={project.id}
        preQuoteId={preQuote.id}
        onRetry={draft.retry}
      />
    );
  }

  if (draft.error) {
    return (
      <PreQuotesError
        title="No fue posible consultar el borrador"
        message={getPreQuoteDraftErrorContent(draft.error.cause).message}
        onRetry={draft.retry}
      />
    );
  }

  if (!draft.draft) {
    return (
      <PreQuotesError
        title="Borrador no disponible"
        message="No fue posible cargar el borrador solicitado."
        onRetry={draft.retry}
      />
    );
  }

  return (
    <PreQuoteDraftView
      projectId={project.id}
      preQuoteId={preQuote.id}
      draft={draft.draft}
    />
  );
}
