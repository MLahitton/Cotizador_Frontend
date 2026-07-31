import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  formatContentType,
  formatFileSize,
  formatProcessingAvailability,
  formatProcessingOutcome,
  formatProcessingState,
} from "@/features/prequotes/prequote-document-formatters";
import { ProcessingAvailabilityBadge } from "@/features/prequotes/components/prequote-document-status";
import {
  SourcePages,
  StructuredEvidenceList,
} from "@/features/prequotes/components/structured-evidence-list";
import { StructuredExtractionStatusBadge } from "@/features/prequotes/components/structured-extraction-status";
import { formatPreQuoteDateTime } from "@/features/prequotes/prequote-formatters";
import {
  formatConflictCode,
  formatElementType,
  formatExtractionDuration,
  formatIssueCode,
  formatMissingExtractionDetail,
  formatNullableText,
  formatProcessingMethod,
  formatRequirementCategory,
} from "@/features/prequotes/structured-extraction-formatters";
import type {
  StructuredDocumentExtractionDetailsResponse,
  StructuredExtractionDetails,
} from "@/features/prequotes/structured-extraction-types";
import type { ProjectDetails } from "@/features/projects/projects-types";
import type { PreQuoteDetails } from "@/features/prequotes/prequotes-types";
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

export function StructuredExtractionHeader({
  project,
  preQuote,
}: {
  project: ProjectDetails;
  preQuote: PreQuoteDetails;
}) {
  return (
    <header className="min-w-0 space-y-4">
      <nav className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/projects/${encodeURIComponent(project.id)}/prequotes/${encodeURIComponent(preQuote.id)}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-start px-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver a la precotización
        </Link>
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
      </nav>
      <div>
        <Badge tone="brand">Extracción estructurada</Badge>
        <h1 className="mt-4 break-words text-2xl font-semibold text-foreground sm:text-3xl">
          Extracción del documento
        </h1>
        <p className="mt-2 break-words text-sm text-foreground-secondary">
          Proyecto {project.code} · Precotización {preQuote.id}
        </p>
      </div>
    </header>
  );
}

function DocumentOverview({
  details,
}: {
  details: StructuredDocumentExtractionDetailsResponse;
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="document-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id="document-title" className="text-lg font-semibold text-foreground">
              Documento
            </h2>
            <p className="mt-1 break-words text-sm text-foreground-secondary">
              {details.document.originalFileName}
            </p>
          </div>
          <ProcessingAvailabilityBadge value={details.processingAvailability} />
        </div>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField
            label="Tipo"
            value={formatContentType(details.document.contentType)}
          />
          <DetailField label="Tamaño" value={formatFileSize(details.document.sizeBytes)} />
          <DetailField
            label="Cargado"
            value={formatPreQuoteDateTime(details.document.createdAtUtc)}
          />
          <DetailField label="Documento" value={details.document.documentId} />
        </dl>
      </section>
    </Surface>
  );
}

function LatestAttempt({
  details,
}: {
  details: StructuredDocumentExtractionDetailsResponse;
}) {
  const attempt = details.latestAttempt;

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="processing-title">
        <h2 id="processing-title" className="text-lg font-semibold text-foreground">
          Estado de procesamiento
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          {formatProcessingAvailability(details.processingAvailability)}
        </p>
        {attempt ? (
          <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DetailField
              label="Intento"
              value={attempt.processingAttemptId}
            />
            <DetailField
              label="Estado"
              value={formatProcessingState(attempt.processingState)}
            />
            <DetailField
              label="Resultado"
              value={formatProcessingOutcome(attempt.outcome)}
            />
            <DetailField
              label="Creado"
              value={formatPreQuoteDateTime(attempt.createdAtUtc)}
            />
            {attempt.completedAtUtc ? (
              <DetailField
                label="Finalizado"
                value={formatPreQuoteDateTime(attempt.completedAtUtc)}
              />
            ) : null}
            {attempt.resultMetadata ? (
              <>
                <DetailField
                  label="Páginas"
                  value={String(attempt.resultMetadata.pageCount)}
                />
                <DetailField
                  label="Duración"
                  value={formatExtractionDuration(
                    attempt.resultMetadata.durationMs,
                  )}
                />
              </>
            ) : null}
          </dl>
        ) : (
          <p className="mt-5 text-sm text-foreground-secondary">
            Sin intento registrado.
          </p>
        )}
      </section>
    </Surface>
  );
}

function SummarySection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  const metrics = [
    ["Ítems", extraction.summary.itemCount],
    ["Referencias documentales", extraction.summary.documentReferenceCount],
    ["Requieren revisión", extraction.summary.itemsRequiringReview],
    ["Unidades conocidas", extraction.summary.knownQuoteableUnitCount],
    ["Observaciones", extraction.summary.issueCount],
    ["Conflictos", extraction.summary.conflictCount],
  ] as const;

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="summary-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="summary-title" className="text-lg font-semibold text-foreground">
            Resumen general
          </h2>
          <div className="flex flex-wrap gap-2">
            <StructuredExtractionStatusBadge value={extraction.status} />
            <Badge tone={extraction.isFromLatestAttempt ? "success" : "info"} size="sm">
              {extraction.isFromLatestAttempt
                ? "Extracción actual"
                : "Extracción anterior"}
            </Badge>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-sm bg-surface-subtle p-3">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Surface>
  );
}

function DetectedProjectSection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="detected-project-title">
        <h2
          id="detected-project-title"
          className="text-lg font-semibold text-foreground"
        >
          Proyecto detectado
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Información detectada en el documento.
        </p>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Nombre" value={formatNullableText(extraction.project.name)} />
          <DetailField
            label="Cliente"
            value={formatNullableText(extraction.project.clientName)}
          />
          <DetailField
            label="Ubicación"
            value={formatNullableText(extraction.project.location)}
          />
          <div>
            <dt className="text-xs font-semibold uppercase text-foreground-secondary">
              Páginas fuente
            </dt>
            <dd className="mt-1">
              <SourcePages pages={extraction.project.sourcePages} />
            </dd>
          </div>
        </dl>
        <div className="mt-5">
          <StructuredEvidenceList evidence={extraction.project.evidence} />
        </div>
      </section>
    </Surface>
  );
}

function RequirementsSection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  return (
    <section aria-labelledby="requirements-title" className="space-y-3">
      <h2 id="requirements-title" className="text-lg font-semibold text-foreground">
        Requisitos
      </h2>
      {extraction.requirements.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No se identificaron requisitos.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {extraction.requirements.map((requirement) => (
            <li key={requirement.sequence}>
              <Surface>
                <article className="space-y-3">
                  <Badge tone="neutral" size="sm">
                    {formatRequirementCategory(requirement.category)}
                  </Badge>
                  <p className="break-words text-sm leading-6 text-foreground">
                    {requirement.value}
                  </p>
                  <StructuredEvidenceList evidence={requirement.evidence} />
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemsSection({ extraction }: { extraction: StructuredExtractionDetails }) {
  return (
    <section aria-labelledby="items-title" className="space-y-3">
      <h2 id="items-title" className="text-lg font-semibold text-foreground">
        Ítems
      </h2>
      {extraction.items.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No se identificaron ítems cotizables.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-4">
          {extraction.items.map((item) => (
            <li key={item.sequence}>
              <Surface padding="none" className="min-w-0 overflow-hidden">
                <article className="p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold text-foreground">
                        {item.reference ?? `Ítem ${item.sequence}`}
                      </h3>
                      <p className="mt-1 break-words text-sm text-foreground-secondary">
                        {item.description}
                      </p>
                    </div>
                    {item.requiresReview ? (
                      <Badge tone="warning" size="sm">
                        Requiere revisión
                      </Badge>
                    ) : null}
                  </div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField label="Tipo" value={formatElementType(item.elementType)} />
                    <DetailField
                      label="Medidas originales"
                      value={formatNullableText(item.rawMeasurements)}
                    />
                    <DetailField
                      label="Ancho"
                      value={item.widthMillimeters === null ? "—" : `${item.widthMillimeters} mm`}
                    />
                    <DetailField
                      label="Alto"
                      value={item.heightMillimeters === null ? "—" : `${item.heightMillimeters} mm`}
                    />
                    <DetailField
                      label="Cantidad"
                      value={item.quantity === null ? "—" : String(item.quantity)}
                    />
                    <div>
                      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                        Páginas fuente
                      </dt>
                      <dd className="mt-1">
                        <SourcePages pages={item.sourcePages} />
                      </dd>
                    </div>
                  </dl>
                  {item.reviewReasons.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {item.reviewReasons.map((reason) => (
                        <li key={reason}>
                          <Badge tone="warning" size="sm">
                            {reason}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4">
                    <StructuredEvidenceList evidence={item.evidence} />
                  </div>
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReferencesSection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  return (
    <section aria-labelledby="references-title" className="space-y-3">
      <h2 id="references-title" className="text-lg font-semibold text-foreground">
        Referencias adicionales del documento
      </h2>
      {extraction.documentReferences.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No se identificaron referencias documentales adicionales.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {extraction.documentReferences.map((reference) => (
            <li key={reference.sequence}>
              <Surface>
                <article className="space-y-4">
                  <div>
                    <h3 className="break-words font-semibold text-foreground">
                      {reference.reference ?? `Referencia ${reference.sequence}`}
                    </h3>
                    <p className="mt-1 break-words text-sm text-foreground-secondary">
                      {reference.description}
                    </p>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <DetailField
                      label="Detalle"
                      value={formatNullableText(reference.detail)}
                    />
                    <DetailField
                      label="Cantidad"
                      value={reference.quantity === null ? "—" : String(reference.quantity)}
                    />
                    <div>
                      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                        Páginas
                      </dt>
                      <dd className="mt-1">
                        <SourcePages pages={reference.sourcePages} />
                      </dd>
                    </div>
                  </dl>
                  <StructuredEvidenceList evidence={reference.evidence} />
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IssuesSection({ extraction }: { extraction: StructuredExtractionDetails }) {
  return (
    <section aria-labelledby="issues-title" className="space-y-3">
      <h2 id="issues-title" className="text-lg font-semibold text-foreground">
        Observaciones
      </h2>
      {extraction.issues.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No se registraron observaciones.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {extraction.issues.map((issue) => (
            <li key={issue.sequence}>
              <Surface>
                <article className="space-y-3">
                  <Badge tone="warning" size="sm">
                    {formatIssueCode(issue.code)}
                  </Badge>
                  <p className="break-words text-sm leading-6 text-foreground">
                    {issue.message}
                  </p>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <DetailField label="Código" value={issue.code} />
                    <DetailField
                      label="Ítem relacionado"
                      value={issue.itemSequence === null ? "—" : String(issue.itemSequence)}
                    />
                    <div>
                      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                        Páginas
                      </dt>
                      <dd className="mt-1">
                        <SourcePages pages={issue.pageNumbers} />
                      </dd>
                    </div>
                  </dl>
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConflictsSection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  return (
    <section aria-labelledby="conflicts-title" className="space-y-3">
      <h2 id="conflicts-title" className="text-lg font-semibold text-foreground">
        Conflictos
      </h2>
      {extraction.conflicts.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No se registraron conflictos.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {extraction.conflicts.map((conflict) => (
            <li key={conflict.sequence}>
              <Surface>
                <article className="space-y-3">
                  <Badge tone="danger" size="sm">
                    {formatConflictCode(conflict.code)}
                  </Badge>
                  <p className="break-words text-sm leading-6 text-foreground">
                    {conflict.message}
                  </p>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <DetailField label="Código" value={conflict.code} />
                    <DetailField
                      label="Ítems relacionados"
                      value={
                        conflict.itemSequences.length === 0
                          ? "—"
                          : conflict.itemSequences.join(", ")
                      }
                    />
                    <div>
                      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                        Páginas
                      </dt>
                      <dd className="mt-1">
                        <SourcePages pages={conflict.pageNumbers} />
                      </dd>
                    </div>
                  </dl>
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MetadataSection({
  extraction,
}: {
  extraction: StructuredExtractionDetails;
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="metadata-title">
        <h2 id="metadata-title" className="text-lg font-semibold text-foreground">
          Metadatos del análisis
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField
            label="Creado"
            value={formatPreQuoteDateTime(extraction.createdAtUtc)}
          />
          <DetailField
            label="Método"
            value={formatProcessingMethod(extraction.processingMetadata.method)}
          />
          <DetailField
            label="Duración"
            value={formatExtractionDuration(extraction.processingMetadata.durationMs)}
          />
        </dl>
      </section>
    </Surface>
  );
}

function EmptyExtractionState({
  details,
}: {
  details: StructuredDocumentExtractionDetailsResponse;
}) {
  return (
    <Surface>
      <div role="status" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Documento sin extracción disponible
        </h2>
        <p className="text-sm leading-6 text-foreground-secondary">
          {formatMissingExtractionDetail(details.processingAvailability)}
        </p>
      </div>
    </Surface>
  );
}

export function StructuredExtractionView({
  project,
  preQuote,
  details,
}: {
  project: ProjectDetails;
  preQuote: PreQuoteDetails;
  details: StructuredDocumentExtractionDetailsResponse;
}) {
  const extraction = details.structuredExtraction;

  return (
    <div className="min-w-0 space-y-6">
      <StructuredExtractionHeader project={project} preQuote={preQuote} />
      <DocumentOverview details={details} />
      <LatestAttempt details={details} />

      {extraction ? (
        <>
          <SummarySection extraction={extraction} />
          <DetectedProjectSection extraction={extraction} />
          <RequirementsSection extraction={extraction} />
          <ItemsSection extraction={extraction} />
          <ReferencesSection extraction={extraction} />
          <IssuesSection extraction={extraction} />
          <ConflictsSection extraction={extraction} />
          <MetadataSection extraction={extraction} />
        </>
      ) : (
        <EmptyExtractionState details={details} />
      )}
    </div>
  );
}
