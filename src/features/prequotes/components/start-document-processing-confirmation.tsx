"use client";

import { AlertCircle, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getStartDocumentProcessingErrorMessage } from "@/features/prequotes/components/prequote-errors";
import {
  formatProcessingAvailability,
  getDocumentProcessingActionLabel,
} from "@/features/prequotes/prequote-document-formatters";
import type { PreQuoteDocumentListItem } from "@/features/prequotes/prequote-documents-types";

export function StartDocumentProcessingConfirmation({
  document,
  isSubmitting,
  error,
  localErrorMessage,
  isPrimaryBlocked,
  onCancel,
  onConfirm,
}: {
  document: PreQuoteDocumentListItem;
  isSubmitting: boolean;
  error: { cause: unknown } | null;
  localErrorMessage: string | null;
  isPrimaryBlocked: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = `start-processing-${document.documentId}-title`;
  const descriptionId = `start-processing-${document.documentId}-description`;
  const errorId = `start-processing-${document.documentId}-error`;
  const errorMessage =
    localErrorMessage ??
    (error ? getStartDocumentProcessingErrorMessage(error.cause) : null);
  const actionLabel =
    getDocumentProcessingActionLabel(document.processingAvailability) ??
    "Iniciar procesamiento";
  const isRetry = document.processingAvailability !== "NOT_PROCESSED";

  return (
    <Surface
      variant="subtle"
      aria-labelledby={titleId}
      aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
      aria-busy={isSubmitting}
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
        <div className="min-w-0 space-y-2">
          <h4 id={titleId} className="text-sm font-semibold text-foreground">
            Confirmar procesamiento
          </h4>
          <dl className="grid min-w-0 gap-2 text-sm text-foreground-secondary">
            <div className="min-w-0">
              <dt className="font-medium text-foreground">Archivo</dt>
              <dd className="break-words [overflow-wrap:anywhere]">
                {document.originalFileName}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-medium text-foreground">Estado actual</dt>
              <dd>
                {formatProcessingAvailability(document.processingAvailability)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-medium text-foreground">Acción</dt>
              <dd>{actionLabel}</dd>
            </div>
          </dl>
        </div>

        <div
          id={descriptionId}
          className="min-w-0 space-y-2 text-sm leading-6 text-foreground-secondary"
        >
          <p>
            Se iniciará el procesamiento de este documento. La operación puede
            tardar varios minutos.
          </p>
          <p>
            Esta pantalla no se actualizará automáticamente. Usa Actualizar
            documentos para consultar el estado más reciente.
          </p>
          {isRetry ? (
            <p>
              Se creará un nuevo intento. Una extracción anterior, cuando
              exista, no será eliminada durante el procesamiento.
            </p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3 xl:col-span-2">
          {errorMessage ? (
            <div
              id={errorId}
              className="flex items-start gap-2 text-left text-sm font-medium text-danger"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle
                aria-hidden="true"
                size={17}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0"
              />
              <p className="min-w-0 break-words [overflow-wrap:anywhere]">
                {errorMessage}
              </p>
            </div>
          ) : null}

          {isSubmitting ? (
            <p
              className="text-sm text-foreground-secondary"
              role="status"
              aria-live="polite"
            >
              Iniciando...
            </p>
          ) : null}

          <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Cancelar
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting || isPrimaryBlocked}
              onClick={onConfirm}
            >
              <Play aria-hidden="true" size={17} strokeWidth={1.75} />
              {isSubmitting ? "Iniciando..." : "Iniciar procesamiento"}
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
