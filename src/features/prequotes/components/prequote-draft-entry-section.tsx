"use client";

import { CircleAlert, FileText, LoaderCircle, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  getCreatePreQuoteDraftErrorContent,
  getPreQuoteDraftErrorContent,
} from "@/features/prequotes/components/prequote-errors";
import {
  formatPreQuoteDraftStatus,
  formatPreQuoteDraftNumber,
} from "@/features/prequotes/prequote-draft-formatters";
import { useCreatePreQuoteDraft } from "@/features/prequotes/use-create-prequote-draft";
import { usePreQuoteDraft } from "@/features/prequotes/use-prequote-draft";
import type { ProjectDetails } from "@/features/projects/projects-types";
import type { PreQuoteDetails } from "@/features/prequotes/prequotes-types";
import type { StructuredDocumentExtractionDetailsResponse } from "@/features/prequotes/structured-extraction-types";
import { cn } from "@/lib/utils/cn";

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function getDraftHref(projectId: string, preQuoteId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}/draft`;
}

function getIneligibleReason({
  project,
  preQuote,
  details,
}: {
  project: ProjectDetails;
  preQuote: PreQuoteDetails;
  details: StructuredDocumentExtractionDetailsResponse;
}): string | null {
  const extraction = details.structuredExtraction;

  if (!project.isActive) {
    return "El proyecto está inactivo. Actívalo antes de crear un borrador.";
  }

  if (!extraction) {
    return "El documento no tiene una extracción estructurada disponible.";
  }

  if (!extraction.isFromLatestAttempt) {
    return "Esta extracción no es la más reciente. Usa la extracción actual para crear el borrador.";
  }

  if (extraction.status !== "COMPLETED" && extraction.status !== "REQUIRES_REVIEW") {
    return "La extracción aún no está lista para crear un borrador.";
  }

  if (!idsMatch(details.document.preQuoteId, preQuote.id)) {
    return "El documento no pertenece a esta precotización.";
  }

  return null;
}

export function PreQuoteDraftEntrySection({
  project,
  preQuote,
  details,
}: {
  project: ProjectDetails;
  preQuote: PreQuoteDetails;
  details: StructuredDocumentExtractionDetailsResponse;
}) {
  const router = useRouter();
  const draftPath = getDraftHref(project.id, preQuote.id);
  const draft = usePreQuoteDraft(preQuote.id, Boolean(details.structuredExtraction));
  const createDraft = useCreatePreQuoteDraft(preQuote.id);
  const ineligibleReason = getIneligibleReason({ project, preQuote, details });
  const extraction = details.structuredExtraction;
  const createError = createDraft.error
    ? getCreatePreQuoteDraftErrorContent(createDraft.error.cause)
    : null;
  const getError = draft.error
    ? getPreQuoteDraftErrorContent(draft.error.cause)
    : null;
  const draftSourceMessage =
    draft.draft && extraction
      ? idsMatch(
          draft.draft.sourceStructuredExtractionId,
          extraction.structuredExtractionId,
        )
        ? "Este borrador fue creado desde esta extracción."
        : "Esta precotización ya tiene un borrador creado desde otra extracción."
      : null;

  const handleCreate = async () => {
    if (!extraction || ineligibleReason || createDraft.isSubmitting) {
      return;
    }

    const result = await createDraft.createDraft({
      sourceDocumentId: details.document.documentId,
      sourceStructuredExtractionId: extraction.structuredExtractionId,
    });

    if (result.status === "created") {
      router.push(draftPath);
    }
  };

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section
        className="p-5 sm:p-6"
        aria-labelledby="prequote-draft-entry-title"
        aria-live="polite"
      >
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText
                aria-hidden="true"
                className="shrink-0 text-brand"
                size={20}
                strokeWidth={1.75}
              />
              <h2
                id="prequote-draft-entry-title"
                className="text-lg font-semibold text-foreground"
              >
                {draft.draft
                  ? "Borrador de revisión disponible"
                  : "Crear borrador de revisión"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {draft.draft
                ? "El borrador ya está listo para consulta read-only."
                : "Genera un borrador inicial desde la extracción estructurada actual."}
            </p>
            {draftSourceMessage ? (
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                {draftSourceMessage}
              </p>
            ) : null}
          </div>

          {draft.draft ? (
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand" size="sm">
                {formatPreQuoteDraftStatus(draft.draft.status)}
              </Badge>
              <Badge tone="neutral" size="sm">
                Versión {formatPreQuoteDraftNumber(draft.draft.version)}
              </Badge>
            </div>
          ) : null}
        </div>

        {draft.isLoading ? (
          <div
            role="status"
            aria-busy="true"
            className="mt-5 flex items-center gap-3 text-sm text-foreground-secondary"
          >
            <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
            <p>Consultando borrador...</p>
          </div>
        ) : null}

        {getError ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-4 text-danger"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{getError.message}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={draft.retry}
              >
                <RotateCw aria-hidden="true" size={17} strokeWidth={1.75} />
                Reintentar
              </Button>
            </div>
          </div>
        ) : null}

        {createError ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-sm border border-warning bg-warning-soft p-4 text-warning"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{createError.message}</p>
              {createError.kind === "already-exists" ? (
                <Link
                  href={draftPath}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-4",
                  )}
                >
                  Abrir borrador
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {!draft.isLoading && !getError ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {draft.draft ? (
              <Link
                href={draftPath}
                className={cn(buttonVariants({ variant: "primary" }), "w-full sm:w-auto")}
              >
                Abrir borrador
              </Link>
            ) : (
              <>
                {ineligibleReason ? (
                  <p className="text-sm leading-6 text-foreground-secondary">
                    {ineligibleReason}
                  </p>
                ) : null}
                <Button
                  type="button"
                  disabled={
                    Boolean(ineligibleReason) ||
                    createDraft.isSubmitting ||
                    !draft.isNotFound
                  }
                  className="w-full sm:w-auto"
                  onClick={handleCreate}
                >
                  {createDraft.isSubmitting
                    ? "Creando borrador..."
                    : "Crear borrador"}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </section>
    </Surface>
  );
}
