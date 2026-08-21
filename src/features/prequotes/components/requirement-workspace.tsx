"use client";

import { FileCheck2, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PreQuotesError, PreQuotesLoading } from "@/features/prequotes/components/prequotes-status";
import { RequirementAnalysisProgress } from "@/features/prequotes/components/requirement-analysis-progress";
import { RequirementUploadPanel } from "@/features/prequotes/components/requirement-upload-panel";
import { TechnicalProposalSummary } from "@/features/prequotes/components/technical-proposal-summary";
import { getRequirementErrorMessage } from "@/features/prequotes/requirement-api";
import { getTechnicalProposalErrorMessage } from "@/features/prequotes/technical-proposal-api";
import { useRequirementWorkspace } from "@/features/prequotes/use-requirement-workspace";

export function RequirementWorkspace({ preQuoteId, projectIsActive }: { preQuoteId: string; projectIsActive: boolean }) {
  const workspace = useRequirementWorkspace(preQuoteId);
  const isUploading = workspace.phase === "uploading";
  const isProcessing = workspace.phase === "processing" || workspace.phase === "completing";

  return (
    <section aria-labelledby="requirement-workspace-title" className="space-y-4">
      <div>
        <p className="text-sm font-medium text-brand">Flujo técnico NEWPIPE</p>
        <h2 id="requirement-workspace-title" className="mt-1 text-lg font-semibold text-foreground">Requerimiento y propuesta técnica</h2>
        <p className="mt-1 text-sm leading-6 text-foreground-secondary">Adjunta los documentos del requerimiento, analízalos y revisa las configuraciones sugeridas por Steel & Glass.</p>
      </div>

      {!projectIsActive ? <Surface variant="subtle"><p className="text-sm text-foreground-secondary">Activa el proyecto para crear un requerimiento.</p></Surface> : null}

      {!workspace.requirement && projectIsActive ? (
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
              <p className="font-semibold text-foreground">Requerimiento creado</p>
              <p className="mt-1 text-sm text-foreground-secondary">{workspace.requirement.fileCount} {workspace.requirement.fileCount === 1 ? "archivo asociado" : "archivos asociados"}</p>
              <p className="mt-1 truncate text-xs text-foreground-secondary">{workspace.files.map((file) => file.name).join(" · ")}</p>
            </div>
          </div>
          {workspace.phase === "ready" ? (
            <Button type="button" disabled={isProcessing} onClick={workspace.process}><Play aria-hidden="true" size={17} />Iniciar análisis</Button>
          ) : (
            <Badge tone={workspace.phase === "complete" ? "success" : workspace.phase.endsWith("error") ? "warning" : "brand"}>
              {workspace.phase === "complete" ? "Propuesta disponible" : workspace.phase.endsWith("error") ? "Atención requerida" : "En análisis"}
            </Badge>
          )}
        </Surface>
      ) : null}

      {isProcessing ? <RequirementAnalysisProgress completed={workspace.phase === "completing"} /> : null}
      {workspace.phase === "proposal-loading" ? <PreQuotesLoading message="Cargando propuesta técnica..." /> : null}
      {workspace.phase === "process-error" ? <PreQuotesError title="No fue posible completar el análisis" message={getRequirementErrorMessage(workspace.error, "process")} onRetry={workspace.process} /> : null}
      {workspace.phase === "proposal-error" ? <PreQuotesError title="No fue posible cargar la propuesta técnica" message={getTechnicalProposalErrorMessage(workspace.error)} onRetry={workspace.retryProposal} /> : null}
      {workspace.proposal ? <TechnicalProposalSummary proposal={workspace.proposal} /> : null}
    </section>
  );
}
