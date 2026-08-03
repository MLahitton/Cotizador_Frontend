import { FileText, Play } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { StartDocumentProcessingConfirmation } from "@/features/prequotes/components/start-document-processing-confirmation";
import {
  formatContentType,
  formatDuration,
  formatFileSize,
  formatMissingExtractionSummary,
  formatPdfClassification,
  formatProcessingOutcome,
  formatProcessingState,
  getDocumentProcessingAction,
  type DocumentProcessingActionKind,
} from "@/features/prequotes/prequote-document-formatters";
import type {
  DocumentProcessingAttemptSummary,
  PreQuoteDocumentListItem,
  StructuredExtractionSummary,
} from "@/features/prequotes/prequote-documents-types";
import { formatPreQuoteDateTime } from "@/features/prequotes/prequote-formatters";
import {
  ProcessingAvailabilityBadge,
  StructuredExtractionStatusBadge,
} from "@/features/prequotes/components/prequote-document-status";
import { cn } from "@/lib/utils/cn";

function LatestAttemptSummary({
  latestAttempt,
}: {
  latestAttempt: DocumentProcessingAttemptSummary | null;
}) {
  if (!latestAttempt) {
    return (
      <p className="text-sm text-foreground-secondary">
        Sin intento registrado.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm text-foreground-secondary">
      <dl className="grid gap-2">
        <div>
          <dt className="font-medium text-foreground">Estado</dt>
          <dd>{formatProcessingState(latestAttempt.processingState)}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Resultado</dt>
          <dd>{formatProcessingOutcome(latestAttempt.outcome)}</dd>
        </div>
      </dl>
      {latestAttempt.outcome === "FAILED" ? (
        <p>El último intento de procesamiento no pudo completarse.</p>
      ) : null}
      <p>Creado: {formatPreQuoteDateTime(latestAttempt.createdAtUtc)}</p>
      {latestAttempt.completedAtUtc ? (
        <p>Finalizado: {formatPreQuoteDateTime(latestAttempt.completedAtUtc)}</p>
      ) : null}
      {latestAttempt.resultMetadata ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge tone="neutral" size="sm">
            {formatPdfClassification(latestAttempt.resultMetadata.classification)}
          </Badge>
          <Badge tone="neutral" size="sm">
            {latestAttempt.resultMetadata.pageCount} páginas
          </Badge>
          <Badge
            tone={latestAttempt.resultMetadata.requiresOcr ? "warning" : "success"}
            size="sm"
          >
            {latestAttempt.resultMetadata.requiresOcr ? "Requirió OCR" : "Sin OCR"}
          </Badge>
          <Badge tone="neutral" size="sm">
            {formatDuration(latestAttempt.resultMetadata.durationMs)}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}

function StructuredSummary({
  document,
  summary,
}: {
  document: PreQuoteDocumentListItem;
  summary: StructuredExtractionSummary | null;
}) {
  if (!summary) {
    return (
      <p className="text-sm text-foreground-secondary">
        {formatMissingExtractionSummary(document.processingAvailability)}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StructuredExtractionStatusBadge value={summary.status} />
        {!summary.isFromLatestAttempt ? (
          <Badge tone="info" size="sm">
            Resultado anterior
          </Badge>
        ) : null}
      </div>
      <dl className="grid gap-2 text-sm text-foreground-secondary sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">Ítems</dt>
          <dd>{summary.itemCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Requieren revisión</dt>
          <dd>{summary.itemsRequiringReview}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Observaciones</dt>
          <dd>{summary.issueCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Conflictos</dt>
          <dd>{summary.conflictCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Unidades conocidas</dt>
          <dd>{summary.knownQuoteableUnitCount}</dd>
        </div>
      </dl>
      {[summary.projectName, summary.clientName, summary.location]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => (
          <p
            key={value}
            className="break-words text-sm text-foreground-secondary"
          >
            {value}
          </p>
        ))}
    </div>
  );
}

function ProcessingNote({
  document,
}: {
  document: PreQuoteDocumentListItem;
}) {
  if (document.processingAvailability === "AVAILABLE_PREVIOUS") {
    return <p>Existe una extracción anterior disponible.</p>;
  }

  if (document.processingAvailability === "LEGACY_ONLY") {
    return <p>Existe un procesamiento anterior sin extracción estructurada.</p>;
  }

  if (
    document.processingAvailability === "PENDING" ||
    document.processingAvailability === "PROCESSING"
  ) {
    return <p>Usa Actualizar documentos para consultar el estado más reciente.</p>;
  }

  return null;
}

export function PreQuoteDocumentsTable({
  items,
  projectId,
  preQuoteId,
  projectIsActive,
  activeProcessingDocumentId,
  submittingProcessingDocumentId,
  processingError,
  localProcessingErrorMessage,
  blockedProcessingDocumentId,
  onOpenProcessingConfirmation,
  onCancelProcessingConfirmation,
  onConfirmProcessing,
}: {
  items: PreQuoteDocumentListItem[];
  projectId: string;
  preQuoteId: string;
  projectIsActive: boolean;
  activeProcessingDocumentId: string | null;
  submittingProcessingDocumentId: string | null;
  processingError: { cause: unknown } | null;
  localProcessingErrorMessage: string | null;
  blockedProcessingDocumentId: string | null;
  onOpenProcessingConfirmation: (
    documentId: string,
    actionKind: DocumentProcessingActionKind,
  ) => void;
  onCancelProcessingConfirmation: () => void;
  onConfirmProcessing: (documentId: string) => void;
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <ul
        className="divide-y divide-border-subtle"
        aria-label="Listado de documentos asociados a la precotización"
      >
        {items.map((document) => {
          const headingId = `prequote-document-${document.documentId}`;
          const processingAction = getDocumentProcessingAction(document);
          const isConfirmationOpen =
            activeProcessingDocumentId === document.documentId;
          const isSubmitting =
            submittingProcessingDocumentId === document.documentId;
          const isPrimaryBlocked =
            blockedProcessingDocumentId === document.documentId;
          return (
            <li key={document.documentId}>
              <article
                aria-labelledby={headingId}
                className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <section className="min-w-0" aria-labelledby={`${headingId}-file`}>
                  <h3
                    id={`${headingId}-file`}
                    className="text-xs font-semibold uppercase text-foreground-secondary"
                  >
                    Archivo
                  </h3>
                  <div className="mt-3 flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                      <FileText
                        aria-hidden="true"
                        size={18}
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="min-w-0">
                      <p
                        id={headingId}
                        className="break-words font-semibold text-foreground"
                      >
                        {document.originalFileName}
                      </p>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {formatContentType(document.contentType)} ·{" "}
                        {formatFileSize(document.sizeBytes)}
                      </p>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        Cargado: {formatPreQuoteDateTime(document.createdAtUtc)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted">
                        <span className="sr-only">
                          Identificador completo:
                        </span>
                        {document.documentId}
                      </p>
                    </div>
                  </div>
                </section>

                <section
                  className="min-w-0 space-y-3"
                  aria-labelledby={`${headingId}-processing`}
                >
                  <h3
                    id={`${headingId}-processing`}
                    className="text-xs font-semibold uppercase text-foreground-secondary"
                  >
                    Procesamiento
                  </h3>
                  <ProcessingAvailabilityBadge
                    value={document.processingAvailability}
                  />
                  <ProcessingNote document={document} />
                  <LatestAttemptSummary latestAttempt={document.latestAttempt} />
                  {processingAction && projectIsActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full sm:w-auto"
                      disabled={
                        Boolean(submittingProcessingDocumentId) ||
                        isConfirmationOpen
                      }
                      onClick={() =>
                        onOpenProcessingConfirmation(
                          document.documentId,
                          processingAction.kind,
                        )
                      }
                    >
                      <Play aria-hidden="true" size={16} strokeWidth={1.75} />
                      {processingAction.label}
                    </Button>
                  ) : null}
                  {processingAction && !projectIsActive ? (
                    <p className="text-sm text-foreground-secondary">
                      Activa el proyecto para procesar documentos.
                    </p>
                  ) : null}
                </section>

                <section
                  className="min-w-0 space-y-3"
                  aria-labelledby={`${headingId}-extraction`}
                >
                  <h3
                    id={`${headingId}-extraction`}
                    className="text-xs font-semibold uppercase text-foreground-secondary"
                  >
                    Extracción
                  </h3>
                  <StructuredSummary
                    document={document}
                    summary={document.structuredExtractionSummary}
                  />
                  {document.structuredExtractionSummary ? (
                    <Link
                      href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}/documents/${encodeURIComponent(document.documentId)}/extraction`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "mt-4 w-full sm:w-auto",
                      )}
                    >
                      {document.structuredExtractionSummary.isFromLatestAttempt
                        ? "Ver extracción"
                        : "Ver extracción anterior"}
                    </Link>
                  ) : null}
                </section>

                {isConfirmationOpen ? (
                  <div className="min-w-0 lg:col-span-3">
                    <StartDocumentProcessingConfirmation
                      document={document}
                      isSubmitting={isSubmitting}
                      error={processingError}
                      localErrorMessage={localProcessingErrorMessage}
                      isPrimaryBlocked={isPrimaryBlocked}
                      onCancel={onCancelProcessingConfirmation}
                      onConfirm={() => onConfirmProcessing(document.documentId)}
                    />
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}
