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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(13rem,0.7fr)] lg:items-start">
        <div className="min-w-0 space-y-2">
          <h4 id={titleId} className="text-sm font-semibold text-foreground">
            Confirmar procesamiento
          </h4>
          <dl className="grid gap-2 text-sm text-foreground-secondary">
            <div>
              <dt className="font-medium text-foreground">Archivo</dt>
              <dd className="break-words">{document.originalFileName}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Estado actual</dt>
              <dd>
                {formatProcessingAvailability(document.processingAvailability)}
              </dd>
            </div>
            <div>
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

        <div className="min-w-0 space-y-3 lg:text-right">
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
              <p>{errorMessage}</p>
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

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:flex-col-reverse">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Cancelar
            </Button>
            <Button
              type="button"
              className="w-full"
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
