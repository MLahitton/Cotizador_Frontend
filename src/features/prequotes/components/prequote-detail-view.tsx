import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  formatDateTime,
  formatProjectStatus,
} from "@/features/projects/project-detail-formatters";
import {
  formatDocumentCount,
  formatPreQuoteDateTime,
  formatPreQuoteIdentifier,
} from "@/features/prequotes/prequote-formatters";
import type {
  PreQuoteDetails,
  ProjectContext,
} from "@/features/prequotes/prequotes-types";
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

export function PreQuoteDetailHeader({
  project,
  preQuoteId,
}: {
  project: ProjectContext;
  preQuoteId?: string;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/projects/${encodeURIComponent(project.id)}/prequotes`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a precotizaciones
          </Link>
          <Link
            href={`/projects/${encodeURIComponent(project.id)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver al proyecto
          </Link>
        </div>
        <Badge tone="brand">Precotizaciones</Badge>
        <h1 className="mt-4 break-words text-2xl font-semibold text-foreground sm:text-3xl">
          Detalle de precotización
        </h1>
        {preQuoteId ? (
          <>
            <p className="mt-2 break-all text-sm text-foreground-secondary">
              <span className="sr-only">Identificador completo: </span>
              {preQuoteId}
            </p>
            <p
              aria-hidden="true"
              className="mt-1 text-xs font-semibold uppercase text-muted"
            >
              {formatPreQuoteIdentifier(preQuoteId)}
            </p>
          </>
        ) : null}
      </div>
    </header>
  );
}

export function PreQuoteDetailView({
  project,
  preQuote,
}: {
  project: ProjectContext;
  preQuote: PreQuoteDetails;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <section className="p-5 sm:p-6" aria-labelledby="prequote-project-title">
          <h2
            id="prequote-project-title"
            className="text-lg font-semibold text-foreground"
          >
            Proyecto
          </h2>
          <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Código" value={project.code} />
            <DetailField label="Nombre" value={project.name} />
            <DetailField
              label="Estado"
              value={formatProjectStatus(project.isActive)}
            />
            <DetailField
              label="Última actualización"
              value={formatDateTime(project.updatedAtUtc)}
            />
          </dl>
        </section>
      </Surface>

      <Surface padding="none" className="min-w-0 overflow-hidden">
        <section className="p-5 sm:p-6" aria-labelledby="prequote-detail-title">
          <h2
            id="prequote-detail-title"
            className="text-lg font-semibold text-foreground"
          >
            Información disponible
          </h2>
          <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Identificador" value={preQuote.id} />
            <DetailField label="Proyecto" value={preQuote.projectId} />
            <DetailField
              label="Documentos"
              value={formatDocumentCount(preQuote.documentCount)}
            />
            <DetailField
              label="Fecha de creación"
              value={formatPreQuoteDateTime(preQuote.createdAtUtc)}
            />
            <DetailField
              label="Última actualización"
              value={formatPreQuoteDateTime(preQuote.updatedAtUtc)}
            />
          </dl>
        </section>
      </Surface>
    </div>
  );
}
