"use client";

import {
  FileCheck2,
  Play,
  StopCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PreQuotesError, PreQuotesLoading } from "@/features/prequotes/components/prequotes-status";
import { PreQuoteExperienceFlow } from "@/features/prequotes/components/prequote-experience-flow";
import { RequirementAnalysisProgress } from "@/features/prequotes/components/requirement-analysis-progress";
import { RequirementDocumentsLifecycle } from "@/features/prequotes/components/requirement-documents-lifecycle";
import { RequirementChatPanel } from "@/features/prequotes/components/requirement-chat-panel";
import { RequirementUploadPanel } from "@/features/prequotes/components/requirement-upload-panel";
import { getRequirementErrorMessage } from "@/features/prequotes/requirement-api";
import { getTechnicalProposalErrorMessage } from "@/features/prequotes/technical-proposal-api";
import { getTechnicalProposalSelectionErrorMessage } from "@/features/prequotes/technical-proposal-selection-api";
import { useRequirementWorkspace } from "@/features/prequotes/use-requirement-workspace";

type InclusionMutationError = {
  kind: "inclusion";
  action: "exclude" | "reactivate";
  cause: unknown;
};

function isInclusionMutationError(
  error: unknown,
): error is InclusionMutationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    (error as { kind?: unknown }).kind === "inclusion" &&
    "action" in error &&
    ((error as { action?: unknown }).action === "exclude" ||
      (error as { action?: unknown }).action === "reactivate")
  );
}

function getWorkspaceSelectionErrorMessage(
  error: unknown,
): string {
  if (!isInclusionMutationError(error)) {
    return getTechnicalProposalSelectionErrorMessage(error);
  }

  return error.action === "exclude"
    ? "No fue posible excluir el elemento."
    : "No fue posible reactivar el elemento.";
}

export function RequirementWorkspace({
  preQuoteId,
  preQuoteName,
  preQuoteSerial,
  projectIsActive,
  readOnly = false,
}: {
  preQuoteId: string;
  preQuoteName: string | null;
  preQuoteSerial: string | null;
  projectIsActive: boolean;
  readOnly?: boolean;
}) {
  const workspace = useRequirementWorkspace(preQuoteId);

  const isUploading =
    workspace.phase === "uploading";

  const isProcessing =
    workspace.phase === "processing" ||
    workspace.phase === "processing-cancelling" ||
    workspace.phase === "completing";

  const hasAttentionState =
    workspace.phase.endsWith("error") ||
    workspace.phase === "processing-timeout";

  const fileCount =
    workspace.requirement &&
    "fileCount" in workspace.requirement
      ? workspace.requirement.fileCount
      : null;

  const fileNames = workspace.files
    .map((file) => file.name)
    .join(" · ");
return (
    <section
      aria-labelledby="requirement-workspace-title"
      className="space-y-4"
    >
      <div>
        <h2
          id="requirement-workspace-title"
          className="mt-1 text-lg font-semibold text-foreground"
        >
          Requerimiento y propuesta tecnica
        </h2>

        <p className="mt-1 text-sm leading-6 text-foreground-secondary">
          {readOnly
            ? "Consulta el requerimiento, su propuesta tecnica y la informacion comercial asociada."
            : "Adjunta los documentos del requerimiento, analizalos y revisa las configuraciones sugeridas por Steel & Glass."}
        </p>
      </div>

      {!projectIsActive && !readOnly ? (
        <Surface variant="subtle">
          <p className="text-sm text-foreground-secondary">
            Activa el proyecto para crear un requerimiento.
          </p>
        </Surface>
      ) : null}

      {workspace.phase === "hydrating" ? (
        <PreQuotesLoading message="Cargando analisis guardado..." />
      ) : null}

      {workspace.phase === "current-error" ? (
        <PreQuotesError
          title="No fue posible cargar el analisis guardado"
          message={getRequirementErrorMessage(
            workspace.error,
            "current",
          )}
          onRetry={workspace.retryCurrent}
        />
      ) : null}

      {!readOnly &&
      !workspace.requirement &&
      projectIsActive &&
      workspace.phase !== "hydrating" &&
      workspace.phase !== "current-error" ? (
        <RequirementUploadPanel
          files={workspace.files}
          commercialLine={workspace.commercialLine}
          validationError={workspace.validationError}
          isUploading={isUploading}
          onCommercialLineChange={
            workspace.setCommercialLine
          }
          onFilesSelect={workspace.selectFiles}
          onFileRemove={workspace.removeFile}
          onUpload={workspace.upload}
        />
      ) : null}

      {readOnly &&
      !workspace.requirement &&
      workspace.phase !== "hydrating" &&
      workspace.phase !== "current-error" ? (
        <Surface variant="subtle">
          <p className="text-sm text-foreground-secondary">
            Esta precotizacion no tiene un Requirement
            disponible.
          </p>
        </Surface>
      ) : null}

      {!readOnly &&
      workspace.phase === "upload-error" ? (
        <PreQuotesError
          title="No fue posible crear el requerimiento"
          message={getRequirementErrorMessage(
            workspace.error,
            "upload",
          )}
          onRetry={workspace.upload}
        />
      ) : null}

      {workspace.requirement ? (
        <Surface
          variant="subtle"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-3">
            <FileCheck2
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-brand"
              size={20}
            />

            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                Requerimiento guardado
              </p>

              {fileCount !== null ? (
                <p className="mt-1 text-sm text-foreground-secondary">
                  {fileCount}{" "}
                  {fileCount === 1
                    ? "archivo asociado"
                    : "archivos asociados"}
                </p>
              ) : (
                <p className="mt-1 text-sm text-foreground-secondary">
                  Analisis existente asociado a esta
                  precotizacion.
                </p>
              )}

              <p className="mt-1 text-sm text-foreground-secondary">
                Versión comercial:{" "}
                {workspace.requirement.commercialLine
                  ? workspace.requirement.commercialLine.charAt(
                      0,
                    ) +
                    workspace.requirement.commercialLine
                      .slice(1)
                      .toLowerCase()
                  : "Versión no disponible"}
              </p>

              {fileNames ? (
                <p className="mt-1 truncate text-xs text-foreground-secondary">
                  {fileNames}
                </p>
              ) : null}
            </div>
          </div>

          {!readOnly &&
          (workspace.phase === "ready" ||
            workspace.phase ===
              "processing-cancelled") ? (
            <Button
              type="button"
              disabled={isProcessing}
              onClick={workspace.process}
            >
              <Play
                aria-hidden="true"
                size={17}
              />
              Iniciar analisis
            </Button>
          ) : (
            <Badge
              tone={
                workspace.phase === "complete"
                  ? "success"
                  : hasAttentionState
                    ? "warning"
                    : "brand"
              }
            >
              {workspace.phase === "complete"
                ? "Propuesta disponible"
                : hasAttentionState
                  ? "Atencion requerida"
                  : "En analisis"}
            </Badge>
          )}
        </Surface>
      ) : null}

      {isProcessing ? (
        <div className="space-y-3">
          <RequirementAnalysisProgress
            completed={
              workspace.phase === "completing"
            }
          />

          {!readOnly ? (
            <Surface
              variant="subtle"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-foreground-secondary">
                {workspace.phase ===
                "processing-cancelling"
                  ? "Deteniendo..."
                  : "Procesando documentos..."}
              </p>

              <Button
                type="button"
                variant="ghost"
                disabled={
                  workspace.phase !== "processing"
                }
                onClick={
                  workspace.cancelProcessing
                }
              >
                <StopCircle
                  aria-hidden="true"
                  size={17}
                />

                {workspace.phase ===
                "processing-cancelling"
                  ? "Deteniendo..."
                  : "Detener extraccion"}
              </Button>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {workspace.phase ===
      "processing-cancelled" ? (
        <Surface variant="subtle">
          <p className="text-sm text-foreground-secondary">
            Extraccion detenida.
            {!readOnly
              ? " Puedes iniciar el analisis nuevamente."
              : ""}
          </p>
        </Surface>
      ) : null}

      {workspace.phase === "proposal-loading" ? (
        <PreQuotesLoading message="Cargando propuesta tecnica..." />
      ) : null}

      {workspace.phase === "process-error" ? (
        <PreQuotesError
          title="No fue posible completar el analisis"
          message={getRequirementErrorMessage(
            workspace.error,
            "process",
          )}
          onRetry={
            readOnly
              ? workspace.retryCurrent
              : workspace.process
          }
          retryLabel={
            readOnly
              ? "Consultar estado"
              : undefined
          }
        />
      ) : null}

      {workspace.phase ===
      "processing-timeout" ? (
        <PreQuotesError
          title="El analisis sigue en curso"
          message={getRequirementErrorMessage(
            workspace.error,
            "process",
          )}
          onRetry={workspace.retryCurrent}
          retryLabel="Consultar estado"
        />
      ) : null}

      {workspace.phase === "proposal-error" ? (
        <PreQuotesError
          title="No fue posible cargar la propuesta tecnica"
          message={getTechnicalProposalErrorMessage(
            workspace.error,
          )}
          onRetry={workspace.retryProposal}
        />
      ) : null}
{workspace.requirement ? (
        <RequirementDocumentsLifecycle
          key={
            workspace.requirement.requirementId
          }
          requirementId={
            workspace.requirement.requirementId
          }
          onCurrentChanged={
            workspace.retryCurrent
          }
          readOnly={readOnly}
        />
      ) : null}

      {!readOnly && workspace.requirement ? (
        <RequirementChatPanel
          requirementId={
            workspace.requirement.requirementId
          }
          title="Asistente de la precotizacion"
          onActionExecuted={
            workspace.refreshAfterChatAction
          }
        />
      ) : null}
{workspace.proposal && workspace.requirement ? (
        <PreQuoteExperienceFlow
          preQuoteDisplayName={preQuoteName?.trim() || preQuoteSerial?.trim() || "Precotizacion sin nombre"}
          requirement={workspace.requirement}
          requirementId={
            workspace.requirement
              .requirementId
          }
          proposal={workspace.proposal}
          pricing={workspace.pricing}
          pricingLoading={workspace.pricingLoading}
          pricingError={workspace.pricingError}
          pricingAfterSelectionError={workspace.pricingAfterSelectionError}
          pricingCancelMessage={workspace.pricingCancelMessage}
          confirmationLoading={workspace.confirmationLoading}
          confirmationError={workspace.confirmationError}
          onConfirmSelection={workspace.confirmSelection}
          onCalculatePricing={workspace.calculatePricing}
          readOnly={readOnly}
          selectionCatalog={
            workspace.selectionCatalog
          }
          selectionCatalogLoading={
            workspace.selectionCatalogLoading
          }
          selectionCatalogError={
            workspace.selectionCatalogError
          }
          onRetrySelectionCatalog={
            workspace.retrySelectionCatalog
          }
          savingSelectionItemIds={
            workspace.savingSelectionItemIds
          }
          selectionErrorMessages={Object.fromEntries(
            Object.entries(
              workspace.selectionErrors,
            ).map(([itemId, error]) => [
              itemId,
              getWorkspaceSelectionErrorMessage(
                error,
              ),
            ]),
          )}
          manualItemCreating={
            workspace.manualItemCreating
          }
          manualItemError={
            workspace.manualItemError
          }
          onSaveSelection={
            workspace.saveSelection
          }
          onClearSelectionError={
            workspace.clearSelectionError
          }
          onChatActionExecuted={
            workspace.refreshAfterChatAction
          }
          onCreateManualItem={
            workspace.createManualItem
          }
          onUpdateInclusion={
            workspace.updateItemInclusion
          }
          commercialMutationDisabled={
            readOnly ||
            workspace.isCommercialMutationBusy
          }
          recentChatAction={
            workspace.recentChatAction
          }
        />
      ) : null}
    </section>
  );
}
