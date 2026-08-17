"use client";

import { Calculator, FilePlus2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  getPreQuoteDocumentsErrorMessage,
  isStartDocumentProcessingAlreadyActiveError,
} from "@/features/prequotes/components/prequote-errors";
import { PreQuotesError, PreQuotesLoading } from "@/features/prequotes/components/prequotes-status";
import { PreQuoteDocumentsPagination } from "@/features/prequotes/components/prequote-documents-pagination";
import { PreQuoteDocumentsTable } from "@/features/prequotes/components/prequote-documents-table";
import { UploadPreQuoteDocumentPanel } from "@/features/prequotes/components/upload-prequote-document-panel";
import { HistoricalDocumentEstimateResult } from "@/features/prequotes/components/historical-document-estimate-result";
import { getEstimateDocumentsErrorMessage } from "@/features/prequotes/historical-document-estimate-api";
import {
  getDocumentProcessingAction,
  type DocumentProcessingActionKind,
} from "@/features/prequotes/prequote-document-formatters";
import type { PreQuoteDocumentsPage } from "@/features/prequotes/prequote-documents-types";
import type { PreQuoteLoadError } from "@/features/prequotes/prequotes-types";
import { useStartDocumentProcessing } from "@/features/prequotes/use-start-document-processing";
import { useHistoricalDocumentEstimate } from "@/features/prequotes/use-historical-document-estimate";
import { useUploadPreQuoteDocument } from "@/features/prequotes/use-upload-prequote-document";
import { cn } from "@/lib/utils/cn";

const STALE_PROCESSING_STATE_MESSAGE =
  "El estado del documento cambió. Actualiza los documentos para consultar el estado más reciente.";

export function PreQuoteDocumentsSection({
  projectId,
  preQuoteId,
  projectIsActive,
  documentsPage,
  error,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  projectId: string;
  preQuoteId: string;
  projectIsActive: boolean;
  documentsPage: PreQuoteDocumentsPage | null;
  error: PreQuoteLoadError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [activeProcessingDocumentId, setActiveProcessingDocumentId] = useState<
    string | null
  >(null);
  const [activeProcessingActionKind, setActiveProcessingActionKind] = useState<
    DocumentProcessingActionKind | null
  >(null);
  const [
    localProcessingErrorMessage,
    setLocalProcessingErrorMessage,
  ] = useState<string | null>(null);
  const upload = useUploadPreQuoteDocument(preQuoteId);
  const documentEstimate = useHistoricalDocumentEstimate(preQuoteId);
  const processing = useStartDocumentProcessing(preQuoteId);
  const isDocumentOperationRunning = upload.isUploading || documentEstimate.isEstimating;
  const hasDocuments = Boolean(documentsPage && documentsPage.totalCount > 0);
  const isProcessingSubmitting = processing.isSubmitting;
  const activeProcessingDocument = documentsPage?.items.find(
    (document) => document.documentId === activeProcessingDocumentId,
  );
  const activeProcessingAction = activeProcessingDocument
    ? getDocumentProcessingAction(activeProcessingDocument)
    : null;
  const isActiveProcessingConfirmationCurrent =
    activeProcessingDocumentId !== null &&
    activeProcessingAction !== null &&
    activeProcessingAction.kind === activeProcessingActionKind;
  const visibleActiveProcessingDocumentId =
    isActiveProcessingConfirmationCurrent ? activeProcessingDocumentId : null;
  const visibleLocalProcessingErrorMessage =
    isActiveProcessingConfirmationCurrent ? localProcessingErrorMessage : null;
  const hasActiveProcessingConflict =
    visibleActiveProcessingDocumentId !== null &&
    processing.targetDocumentId === visibleActiveProcessingDocumentId &&
    isStartDocumentProcessingAlreadyActiveError(processing.error?.cause);
  const blockedProcessingDocumentId =
    visibleActiveProcessingDocumentId !== null &&
    (visibleLocalProcessingErrorMessage || hasActiveProcessingConflict)
      ? visibleActiveProcessingDocumentId
      : null;

  function openUploadPanel() {
    if (!projectIsActive || isDocumentOperationRunning || isProcessingSubmitting) {
      return;
    }

    upload.clearSelection();
    setIsUploadPanelOpen(true);
  }

  function closeUploadPanel() {
    if (isDocumentOperationRunning) {
      return;
    }

    upload.clearSelection();
    setIsUploadPanelOpen(false);
  }

  async function handleUpload() {
    const result = await upload.upload();

    if (result.status === "uploaded") {
      setIsUploadPanelOpen(false);
      onRefresh();
    } else if (result.status === "partial") {
      onRefresh();
    }
  }

  async function handleEstimate() {
    if (!hasDocuments || documentEstimate.isEstimating || isUploadPanelOpen) return;
    await documentEstimate.estimate();
  }

  function openProcessingConfirmation(
    documentId: string,
    actionKind: DocumentProcessingActionKind,
  ) {
    if (!projectIsActive || isProcessingSubmitting) {
      return;
    }

    const document = documentsPage?.items.find(
      (item) => item.documentId === documentId,
    );
    const action = document ? getDocumentProcessingAction(document) : null;

    if (!action || action.kind !== actionKind) {
      return;
    }

    processing.reset(documentId);
    setLocalProcessingErrorMessage(null);
    setActiveProcessingDocumentId(documentId);
    setActiveProcessingActionKind(action.kind);
  }

  function closeProcessingConfirmation() {
    if (isProcessingSubmitting) {
      return;
    }

    processing.reset();
    setActiveProcessingDocumentId(null);
    setActiveProcessingActionKind(null);
    setLocalProcessingErrorMessage(null);
  }

  async function handleStartProcessing(documentId: string) {
    const document = documentsPage?.items.find(
      (item) => item.documentId === documentId,
    );
    const action = document ? getDocumentProcessingAction(document) : null;

    if (!document) {
      processing.reset();
      setActiveProcessingDocumentId(null);
      setActiveProcessingActionKind(null);
      setLocalProcessingErrorMessage(null);
      return;
    }

    if (!action || action.kind !== activeProcessingActionKind) {
      setLocalProcessingErrorMessage(STALE_PROCESSING_STATE_MESSAGE);
      return;
    }

    setLocalProcessingErrorMessage(null);
    const result = await processing.start(documentId);

    if (result.status === "started") {
      setActiveProcessingDocumentId(null);
      setActiveProcessingActionKind(null);
      setLocalProcessingErrorMessage(null);
      onRefresh();
    }
  }

  return (
    <section aria-labelledby="prequote-documents-title" className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="prequote-documents-title"
            className="text-lg font-semibold text-foreground"
          >
            Documentos
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            {documentsPage
              ? `Documentos del mismo requerimiento (${documentsPage.totalCount}).`
              : "Documentos asociados al mismo requerimiento de precotización."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={
              !hasDocuments ||
              documentEstimate.isEstimating ||
              upload.isUploading ||
              isUploadPanelOpen
            }
            onClick={handleEstimate}
          >
            <Calculator aria-hidden="true" size={17} strokeWidth={1.75} />
            {documentEstimate.isEstimating
              ? "Generando precotización..."
              : "Generar precotización"}
          </Button>
          {hasDocuments ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={
                !projectIsActive || isDocumentOperationRunning || isProcessingSubmitting
              }
              onClick={openUploadPanel}
            >
              <FilePlus2 aria-hidden="true" size={17} strokeWidth={1.75} />
              Agregar documento
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={
              isLoading ||
              isRefreshing ||
              isDocumentOperationRunning ||
              isProcessingSubmitting
            }
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden="true" size={17} strokeWidth={1.75} />
            Actualizar documentos
          </Button>
        </div>
      </div>

      {!projectIsActive ? (
        <p className="text-sm text-foreground-secondary">
          Activa el proyecto para agregar documentos.
        </p>
      ) : null}

      {!hasDocuments && documentsPage ? (
        <p className="text-sm text-foreground-secondary">
          Agrega al menos un documento para generar la precotización.
        </p>
      ) : null}

      {documentEstimate.isEstimating ? (
        <p
          className="text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          Estamos analizando los documentos y calculando la precotización.
        </p>
      ) : null}

      {documentEstimate.error ? (
        <PreQuotesError
          title="No fue posible generar la precotización"
          message={getEstimateDocumentsErrorMessage(documentEstimate.error)}
          onRetry={handleEstimate}
        />
      ) : null}

      {isUploadPanelOpen ? (
        <UploadPreQuoteDocumentPanel
          selectedFiles={upload.selectedFiles}
          validationError={upload.validationError}
          uploadError={upload.uploadError}
          isUploading={upload.isUploading}
          uploadedCount={upload.uploadedCount}
          uploadTotal={upload.uploadTotal}
          onFilesSelect={upload.selectFiles}
          onFileRemove={upload.removeFile}
          onCancel={closeUploadPanel}
          onUpload={handleUpload}
        />
      ) : null}

      {documentEstimate.result ? (
        <HistoricalDocumentEstimateResult estimate={documentEstimate.result} />
      ) : null}

      {error ? (
        <PreQuotesError
          title="No fue posible consultar los documentos"
          message={getPreQuoteDocumentsErrorMessage(error.cause)}
          onRetry={onRefresh}
        />
      ) : null}

      {isLoading ? (
        <PreQuotesLoading message="Cargando documentos..." />
      ) : null}

      {isRefreshing ? (
        <p
          className="text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          Actualizando documentos...
        </p>
      ) : null}

      {documentsPage && !isLoading ? (
        documentsPage.items.length === 0 ? (
          <Surface>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {documentsPage.totalCount === 0
                  ? "Aún no hay documentos asociados a esta precotización."
                  : "No hay documentos en esta página"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                {documentsPage.totalCount === 0
                  ? "Agrega documentos PDF, XLSX, JPG o PNG para comenzar a preparar la precotización."
                  : "La página solicitada no tiene resultados disponibles."}
              </p>
              {documentsPage.totalCount === 0 && projectIsActive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  disabled={isDocumentOperationRunning || isProcessingSubmitting}
                  onClick={openUploadPanel}
                >
                  <FilePlus2 aria-hidden="true" size={17} strokeWidth={1.75} />
                  Agregar primer documento
                </Button>
              ) : null}
              {documentsPage.totalCount === 0 && !projectIsActive ? (
                <p className="mt-4 text-sm text-foreground-secondary">
                  Activa el proyecto para agregar documentos.
                </p>
              ) : null}
              {documentsPage.totalCount > 0 ? (
                <Link
                  href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}?documentsPage=1`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-5",
                  )}
                >
                  Volver a la primera página
                </Link>
              ) : null}
            </div>
          </Surface>
        ) : (
          <>
            <PreQuoteDocumentsTable
              items={documentsPage.items}
              projectId={projectId}
              preQuoteId={preQuoteId}
              projectIsActive={projectIsActive}
              activeProcessingDocumentId={visibleActiveProcessingDocumentId}
              submittingProcessingDocumentId={
                processing.isSubmitting ? processing.targetDocumentId : null
              }
              processingError={
                processing.targetDocumentId === visibleActiveProcessingDocumentId
                  ? processing.error
                  : null
              }
              localProcessingErrorMessage={visibleLocalProcessingErrorMessage}
              blockedProcessingDocumentId={blockedProcessingDocumentId}
              onOpenProcessingConfirmation={openProcessingConfirmation}
              onCancelProcessingConfirmation={closeProcessingConfirmation}
              onConfirmProcessing={handleStartProcessing}
            />
            <PreQuoteDocumentsPagination
              projectId={projectId}
              preQuoteId={preQuoteId}
              page={documentsPage.page}
              pageSize={documentsPage.pageSize}
              totalCount={documentsPage.totalCount}
              totalPages={documentsPage.totalPages}
            />
          </>
        )
      ) : null}
    </section>
  );
}
