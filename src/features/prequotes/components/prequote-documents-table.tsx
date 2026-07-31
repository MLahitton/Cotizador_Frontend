import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  availabilityNeedsManualRefresh,
  formatContentType,
  formatDuration,
  formatFileSize,
  formatPdfClassification,
  formatProcessingOutcome,
  formatProcessingState,
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
    <div className="space-y-2 text-sm text-foreground-secondary">
      <p>
        Último intento:{" "}
        <span className="font-medium text-foreground">
          {formatProcessingState(latestAttempt.processingState)}
        </span>
      </p>
      <p>
        Resultado:{" "}
        <span className="font-medium text-foreground">
          {formatProcessingOutcome(latestAttempt.outcome)}
        </span>
      </p>
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
            {latestAttempt.resultMetadata.requiresOcr
              ? "Requirió OCR"
              : "Sin OCR"}
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
  summary,
}: {
  summary: StructuredExtractionSummary | null;
}) {
  if (!summary) {
    return (
      <p className="text-sm text-foreground-secondary">
        Sin resumen de extracción estructurada.
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
          <dt className="font-medium text-foreground">Issues</dt>
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

function AvailabilityNote({
  document,
}: {
  document: PreQuoteDocumentListItem;
}) {
  if (document.processingAvailability === "AVAILABLE_PREVIOUS") {
    return <p>Existe una extracción anterior disponible.</p>;
  }

  if (document.processingAvailability === "LEGACY_ONLY") {
    return (
      <p>Existe un resultado anterior sin extracción estructurada disponible.</p>
    );
  }

  if (availabilityNeedsManualRefresh(document.processingAvailability)) {
    return <p>Usa Actualizar documentos para consultar el estado más reciente.</p>;
  }

  return null;
}

export function PreQuoteDocumentsTable({
  items,
}: {
  items: PreQuoteDocumentListItem[];
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[76rem] border-collapse text-left">
          <caption className="sr-only">
            Listado de documentos asociados a la precotización
          </caption>
          <thead className="bg-surface-subtle">
            <tr>
              {[
                "Documento",
                "Archivo",
                "Procesamiento",
                "Último intento",
                "Extracción",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-border-subtle px-5 py-3 text-xs font-semibold text-foreground-secondary"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {items.map((document) => (
              <tr key={document.documentId} className="bg-surface">
                <td className="px-5 py-4 align-top">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                      <FileText
                        aria-hidden="true"
                        size={18}
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-foreground">
                        {document.originalFileName}
                      </p>
                      <p className="mt-1 break-all text-sm text-foreground-secondary">
                        <span className="sr-only">
                          Identificador completo:
                        </span>
                        {document.documentId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                  <p className="font-medium text-foreground">
                    {formatContentType(document.contentType)}
                  </p>
                  <p className="mt-1">{formatFileSize(document.sizeBytes)}</p>
                  <p className="mt-1">
                    Cargado: {formatPreQuoteDateTime(document.createdAtUtc)}
                  </p>
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="space-y-2 text-sm text-foreground-secondary">
                    <ProcessingAvailabilityBadge
                      value={document.processingAvailability}
                    />
                    <AvailabilityNote document={document} />
                  </div>
                </td>
                <td className="px-5 py-4 align-top">
                  <LatestAttemptSummary latestAttempt={document.latestAttempt} />
                </td>
                <td className="px-5 py-4 align-top">
                  <StructuredSummary
                    summary={document.structuredExtractionSummary}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
