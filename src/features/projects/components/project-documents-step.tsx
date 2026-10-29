"use client";

import { FileText, LoaderCircle } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatFileSize, getSupportedDocumentFormat } from "@/features/prequotes/prequote-document-formatters";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import { projectDocumentsErrorMessage, resolveProjectDocumentsContext, type ProjectDocumentsState } from "@/features/projects/project-documents-query";
import { useProjectDocuments } from "@/features/projects/use-project-documents";
import { ProjectDocumentActions } from "./project-document-actions";
import { ProjectDocumentDownloadButton } from "./project-document-download-button";
import { canMutateDocuments } from "@/features/projects/project-document-mutations";
import { ProjectExtractionStatus } from "./project-extraction-status";

function documentDate(value: string): string | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date)
    : null;
}

export function ProjectDocumentsView({ state, readOnly, onRetry, hasActions = false, downloadEnabled = false, children }: {
  state: ProjectDocumentsState;
  readOnly: boolean;
  onRetry: () => void;
  hasActions?: boolean;
  downloadEnabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="project-documents-title" className="min-w-0 space-y-4">
      <div>
        <h2 id="project-documents-title" className="text-2xl font-semibold text-foreground">Documentos</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">Consulta los archivos asociados a este proyecto.</p>
      </div>
      <Surface className="min-w-0 space-y-3">
        {readOnly || !hasActions ? <Badge tone="neutral" size="sm">{readOnly ? "Solo lectura" : "Solo consulta"}</Badge> : null}
        {state.status === "loading" ? (
          <div role="status" aria-live="polite" aria-busy="true" className="flex items-center gap-2 text-sm text-foreground-secondary">
            <LoaderCircle aria-hidden="true" size={18} className="motion-safe:animate-spin" />Cargando documentos…
          </div>
        ) : null}
        {state.status === "empty" ? <p className="text-sm text-foreground-secondary">Este proyecto aún no tiene documentos disponibles.</p> : null}
        {state.status === "ambiguous" ? (
          <p className="text-sm leading-6 text-foreground-secondary">No se pudo determinar qué conjunto documental mostrar para este proyecto.</p>
        ) : null}
        {state.status === "unavailable" ? (
          <p className="text-sm leading-6 text-foreground-secondary">No hay un conjunto documental disponible para consultar en este proyecto.</p>
        ) : null}
        {state.status === "error" ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-danger">{projectDocumentsErrorMessage(state.cause)}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>Volver a cargar</Button>
          </div>
        ) : null}
        {state.status === "success" ? (
          <>
            <p className="text-sm font-semibold text-foreground">
              {state.details.isCurrent ? "Documentos actuales" : state.details.supersededByRequirementId
                ? "Versión anterior · Solo consulta" : "Documentos no vigentes · Solo consulta"}
            </p>
            {state.details.documents.length === 0 ? (
              <p className="text-sm text-foreground-secondary">No hay archivos disponibles en este conjunto documental.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {state.details.documents.map((document) => {
                  const format = getSupportedDocumentFormat(document.fileName, document.contentType);
                  const date = documentDate(document.createdAtUtc);
                  return (
                    <li key={document.requirementFileId} className="flex min-w-0 items-start gap-3 py-3">
                      <FileText aria-hidden="true" size={19} className="mt-0.5 shrink-0 text-brand" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
                        <p className="min-w-0 break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{document.fileName}</p>
                        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-secondary">
                          {format ? <span>{format}</span> : null}
                          {Number.isFinite(document.sizeBytes) && document.sizeBytes >= 0 ? <span>{formatFileSize(document.sizeBytes)}</span> : null}
                          {date ? <time dateTime={document.createdAtUtc}>Registrado: {date}</time> : null}
                        </div>
                        {downloadEnabled ? <ProjectDocumentDownloadButton key={`${state.details.requirementId}:${document.requirementFileId}`} requirementId={state.details.requirementId}
                          fileId={document.requirementFileId} fileName={document.fileName} /> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : null}
        {children}
      </Surface>
    </section>
  );
}

export function ProjectDocumentsStep({ workspace, readOnly, onRefreshWorkspace }: { workspace: ProjectWorkspace; readOnly: boolean; onRefreshWorkspace: () => void }) {
  const { state, retry } = useProjectDocuments(workspace);
  const context = useMemo(() => resolveProjectDocumentsContext(workspace), [workspace]);
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const details = state.status === "success" ? state.details : null;
  return (
    <div className="min-w-0 space-y-4">
    <ProjectExtractionStatus extraction={workspace.workflow.extraction} projectId={workspace.project.id} />
    <ProjectDocumentsView state={replacementId ? { status: "loading" } : state} readOnly={readOnly} onRetry={retry} downloadEnabled
      hasActions={canMutateDocuments(details, readOnly, "add") || canMutateDocuments(details, readOnly, "replacement")}>
      {context.status === "resolved" && !replacementId ? (
        <ProjectDocumentActions key={`${context.projectId}:${context.requirementId}:${context.preQuoteId}`} context={context} details={details} readOnly={readOnly}
          onSuccess={retry} onRefresh={retry} onRefreshWorkspace={onRefreshWorkspace} onReplacement={(response) => {
            setReplacementId(response.requirementId);
            onRefreshWorkspace();
          }} />
      ) : null}
    </ProjectDocumentsView>
    </div>
  );
}
