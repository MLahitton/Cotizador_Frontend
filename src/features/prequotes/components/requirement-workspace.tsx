"use client";

import { Calculator, FileCheck2, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PreQuotesError, PreQuotesLoading } from "@/features/prequotes/components/prequotes-status";
import { RequirementAnalysisProgress } from "@/features/prequotes/components/requirement-analysis-progress";
import { RequirementPricingSummary } from "@/features/prequotes/components/requirement-pricing-summary";
import { RequirementUploadPanel } from "@/features/prequotes/components/requirement-upload-panel";
import { TechnicalProposalSummary } from "@/features/prequotes/components/technical-proposal-summary";
import { getRequirementErrorMessage } from "@/features/prequotes/requirement-api";
import { getRequirementPricingErrorMessage } from "@/features/prequotes/requirement-pricing-api";
import { getTechnicalProposalErrorMessage } from "@/features/prequotes/technical-proposal-api";
import { useRequirementWorkspace } from "@/features/prequotes/use-requirement-workspace";

export function RequirementWorkspace({ preQuoteId, projectIsActive }: { preQuoteId: string; projectIsActive: boolean }) {
  const workspace = useRequirementWorkspace(preQuoteId);
  const isUploading = workspace.phase === "uploading";
  const isProcessing = workspace.phase === "processing" || workspace.phase === "completing";
  const fileCount = workspace.requirement && "fileCount" in workspace.requirement
    ? workspace.requirement.fileCount
    : null;
  const fileNames = workspace.files.map((file) => file.name).join(" Â· ");

  return (
    <section aria-labelledby="requirement-workspace-title" className="space-y-4">
      <div>
        <p className="text-sm font-medium text-brand">Flujo tecnico NEWPIPE</p>
        <h2 id="requirement-workspace-title" className="mt-1 text-lg font-semibold text-foreground">Requerimiento y propuesta tecnica</h2>
        <p className="mt-1 text-sm leading-6 text-foreground-secondary">Adjunta los documentos del requerimiento, analizalos y revisa las configuraciones sugeridas por Steel & Glass.</p>
      </div>

      {!projectIsActive ? <Surface variant="subtle"><p className="text-sm text-foreground-secondary">Activa el proyecto para crear un requerimiento.</p></Surface> : null}

      {workspace.phase === "hydrating" ? <PreQuotesLoading message="Cargando analisis guardado..." /> : null}

      {workspace.phase === "current-error" ? (
        <PreQuotesError title="No fue posible cargar el analisis guardado" message={getRequirementErrorMessage(workspace.error, "current")} onRetry={workspace.retryCurrent} />
      ) : null}

      {!workspace.requirement && projectIsActive && workspace.phase !== "hydrating" && workspace.phase !== "current-error" ? (
        <RequirementUploadPanel
          files={workspace.files}
          validationError={workspace.validationError}
          isUploading={isUploading}
          onFilesSelect={workspace.selectFiles}
          onFileRemove={workspace.removeFile}
          onUpload={workspace.upload}
        />
      ) : null}

      {workspace.phase === "upload-error" ? (
        <PreQuotesError title="No fue posible crear el requerimiento" message={getRequirementErrorMessage(workspace.error, "upload")} onRetry={workspace.upload} />
      ) : null}

      {workspace.requirement ? (
        <Surface variant="subtle" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <FileCheck2 aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={20} />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Requerimiento guardado</p>
              {fileCount !== null ? (
                <p className="mt-1 text-sm text-foreground-secondary">{fileCount} {fileCount === 1 ? "archivo asociado" : "archivos asociados"}</p>
              ) : (
                <p className="mt-1 text-sm text-foreground-secondary">Analisis existente asociado a esta precotizacion.</p>
              )}
              {fileNames ? <p className="mt-1 truncate text-xs text-foreground-secondary">{fileNames}</p> : null}
            </div>
          </div>
          {workspace.phase === "ready" ? (
            <Button type="button" disabled={isProcessing} onClick={workspace.process}><Play aria-hidden="true" size={17} />Iniciar analisis</Button>
          ) : (
            <Badge tone={workspace.phase === "complete" ? "success" : workspace.phase.endsWith("error") ? "warning" : "brand"}>
              {workspace.phase === "complete" ? "Propuesta disponible" : workspace.phase.endsWith("error") ? "Atencion requerida" : "En analisis"}
            </Badge>
          )}
        </Surface>
      ) : null}

      {isProcessing ? <RequirementAnalysisProgress completed={workspace.phase === "completing"} /> : null}
      {workspace.phase === "proposal-loading" ? <PreQuotesLoading message="Cargando propuesta tecnica..." /> : null}
      {workspace.phase === "process-error" ? <PreQuotesError title="No fue posible completar el analisis" message={getRequirementErrorMessage(workspace.error, "process")} onRetry={workspace.process} /> : null}
      {workspace.phase === "proposal-error" ? <PreQuotesError title="No fue posible cargar la propuesta tecnica" message={getTechnicalProposalErrorMessage(workspace.error)} onRetry={workspace.retryProposal} /> : null}
      {workspace.proposal ? (
        <div className="flex justify-end">
          <Button type="button" disabled={workspace.pricingLoading} onClick={workspace.calculatePricing}>
            <Calculator aria-hidden="true" size={17} />
            {workspace.pricingLoading ? "Calculando precios…" : workspace.pricing ? "Actualizar estimación" : "Calcular precios"}
          </Button>
        </div>
      ) : null}
      {workspace.pricingError ? (
        <PreQuotesError title="No fue posible calcular los precios" message={getRequirementPricingErrorMessage(workspace.pricingError)} onRetry={workspace.calculatePricing} />
      ) : null}
      {workspace.pricing ? <RequirementPricingSummary pricing={workspace.pricing} /> : null}
      {workspace.proposal ? <TechnicalProposalSummary proposal={workspace.proposal} pricing={workspace.pricing} /> : null}
    </section>
  );
}
