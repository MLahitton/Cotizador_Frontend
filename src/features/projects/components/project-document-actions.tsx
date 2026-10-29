"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_FILE_ACCEPT, formatFileSize } from "@/features/prequotes/prequote-document-formatters";
import { validateRequirementDocumentFiles } from "@/features/prequotes/requirement-document-validation";
import { addRequirementDocument, replaceRequirementDocument, removeRequirementDocument, replaceRequirement, getCurrentRequirement } from "@/features/prequotes/requirement-api";
import type { RequirementDetails, RequirementLifecycleResponse } from "@/features/prequotes/requirement-types";
import type { ProjectDocumentsContext } from "@/features/projects/project-documents-query";
import { canMutateDocuments, createDocumentMutationSession, idleDocumentMutation, type DocumentOperation, type DocumentMutationState } from "@/features/projects/project-document-mutations";

const labels: Record<DocumentOperation, string> = {
  add: "Agregar documentos", substitute: "Sustituir archivo", remove: "Quitar documento", replacement: "Crear nueva versión",
};

export function ProjectDocumentActions({ context, details, readOnly, onSuccess, onReplacement, onRefresh, onRefreshWorkspace }: {
  context: Extract<ProjectDocumentsContext, { status: "resolved" }>;
  details: RequirementDetails | null;
  readOnly: boolean;
  onSuccess: (response: RequirementLifecycleResponse) => void;
  onReplacement: (response: RequirementLifecycleResponse) => void;
  onRefresh: () => void;
  onRefreshWorkspace: () => void;
}) {
  const [mutation, setMutation] = useState<DocumentMutationState>(idleDocumentMutation);
  const [operation, setOperation] = useState<DocumentOperation | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [documentId, setDocumentId] = useState("");
  const session = useRef<ReturnType<typeof createDocumentMutationSession> | null>(null);
  const { projectId, requirementId, preQuoteId } = context;
  useEffect(() => {
    const current = createDocumentMutationSession({ status: "resolved", projectId, requirementId, preQuoteId }, {
      add: addRequirementDocument, substitute: replaceRequirementDocument,
      remove: removeRequirementDocument, replacement: replaceRequirement,
    }, setMutation);
    session.current = current;
    return () => { current.dispose(); if (session.current === current) session.current = null; };
  }, [projectId, requirementId, preQuoteId]);
  useEffect(() => {
    if (details) queueMicrotask(() => session.current?.acknowledgeRead(details));
  }, [details]);

  const busy = mutation.kind === "busy" || mutation.kind === "replaced";
  const locked = busy || mutation.needsRead || mutation.consulting === true || !details;
  const permitted = operation !== null && canMutateDocuments(details, readOnly, operation);
  if (readOnly) return null;

  const submit = async () => {
    if (!operation || locked || !permitted) return;
    const success = await session.current?.submit({ operation, details, readOnly, files, documentId, onSuccess, onReplacement, onRefresh });
    if (success) { setOperation(null); setFiles([]); setDocumentId(""); }
  };

  return (
    <div className="mt-3 min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        {(["add", "substitute", "remove", "replacement"] as const).map((action) => canMutateDocuments(details, readOnly, action) ? (
          <Button key={action} type="button" variant="outline" size="sm" disabled={locked}
            onClick={() => {
              if (operation === action) return;
              setOperation(action); setFiles([]); setDocumentId("");
            }}>{labels[action]}</Button>
        ) : null)}
      </div>
      {details && !details.canEditDocuments ? <p className="text-xs text-foreground-secondary">Los archivos de esta versión no admiten cambios.</p> : null}
      {details?.canEditDocuments && details.documents.length <= 1 ? <p className="text-xs text-foreground-secondary">Debe conservarse al menos un documento en esta versión.</p> : null}
      {mutation.message ? (
        <p role={mutation.kind === "success" || mutation.kind === "replaced" ? "status" : "alert"}
          className="break-words text-sm text-foreground-secondary">{mutation.message}</p>
      ) : null}
      {mutation.needsRead ? (
        <Button type="button" variant="outline" size="sm" disabled={mutation.consulting} onClick={() => {
          if (operation === "replacement") void session.current?.consultIdentity(getCurrentRequirement, onRefresh, onRefreshWorkspace);
          else onRefresh();
        }}>{mutation.consulting ? "Consultando estado…" : "Consultar estado"}</Button>
      ) : null}
      {operation ? (
        <ProjectDocumentActionForm key={operation} operation={operation} details={details} files={files} documentId={documentId}
          busy={busy} locked={locked} permitted={permitted} closeDisabled={busy || mutation.needsRead}
          onSubmit={() => { void submit(); }} onDocumentChange={setDocumentId} onFilesChange={setFiles}
          onClose={() => { setOperation(null); setFiles([]); setDocumentId(""); }} />
      ) : null}
    </div>
  );
}

// Keep the existing inline confirmation/form independently verifiable. Network
// writes remain exclusively in the context-bound mutation session above.
export function ProjectDocumentActionForm({ operation, details, files, documentId, busy, locked, permitted, closeDisabled,
  onSubmit, onDocumentChange, onFilesChange, onClose }: {
  operation: DocumentOperation;
  details: RequirementDetails | null;
  files: File[];
  documentId: string;
  busy: boolean;
  locked: boolean;
  permitted: boolean;
  closeDisabled: boolean;
  onSubmit: () => void;
  onDocumentChange: (documentId: string) => void;
  onFilesChange: (files: File[]) => void;
  onClose: () => void;
}) {
  const inputId = `${details?.requirementId ?? "document"}-${operation}-upload`;
  const selectionIssue = files.length ? validateRequirementDocumentFiles(files) : null;
  const selectedDocument = details?.documents.find((doc) => doc.requirementFileId === documentId);
  const submitDisabled = locked || !permitted || ((operation === "remove" || operation === "substitute") && !selectedDocument);
  return (
    <form className="min-w-0 space-y-3 rounded-md border border-border-subtle bg-surface-subtle p-3"
      onSubmit={(event) => { event.preventDefault(); if (!submitDisabled) onSubmit(); }} aria-busy={busy}>
      <h3 className="text-sm font-semibold text-foreground">{labels[operation]}</h3>
      {operation === "replacement" ? <p className="text-sm text-foreground-secondary">Selecciona el conjunto completo de archivos para la nueva versión. La versión anterior se conserva. El análisis no se iniciará automáticamente.</p> : null}
      {operation === "add" ? <p className="text-sm text-foreground-secondary">Agrega un archivo por vez a esta versión documental.</p> : null}
      {operation === "substitute" || operation === "remove" ? (
        <label className="block min-w-0 space-y-1 text-sm text-foreground-secondary">
          <span>Documento sobre el que quieres actuar</span>
          <select className="block w-full min-w-0 rounded-sm border border-border bg-surface p-2" value={documentId} disabled={locked}
            onChange={(event) => onDocumentChange(event.target.value)}>
            <option value="">Selecciona el documento</option>
            {details?.documents.map((doc) => <option key={doc.requirementFileId} value={doc.requirementFileId}>{doc.fileName}</option>)}
          </select>
        </label>
      ) : null}
      {selectedDocument ? <p className="break-words text-sm text-foreground [overflow-wrap:anywhere]">Archivo: {selectedDocument.fileName}</p> : null}
      {operation === "remove" ? <p className="text-sm text-foreground-secondary">El documento seleccionado dejará de formar parte de esta versión documental.</p> : (
        <div className="min-w-0 space-y-2 text-sm text-foreground-secondary">
          <label htmlFor={inputId} className="sr-only">{operation === "replacement" ? "Seleccionar archivos" : "Seleccionar archivo"}</label>
          <input key={operation} id={inputId} type="file" accept={DOCUMENT_FILE_ACCEPT} multiple={operation === "replacement"} disabled={locked}
            className="sr-only" tabIndex={-1} aria-describedby={`${inputId}-help`} onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              if (selected.length) onFilesChange(selected);
              event.target.value = "";
            }} />
          <Button type="button" variant="outline" size="sm" disabled={locked} aria-controls={inputId}
            aria-describedby={`${inputId}-help`} onClick={(event) => event.currentTarget.form?.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
            <FolderOpen size={16} aria-hidden="true" />{operation === "replacement" ? "Seleccionar archivos" : "Seleccionar archivo"}
          </Button>
          <p id={`${inputId}-help`} className="text-xs">PDF, XLSX, JPG o PNG. Hasta 20 MiB por archivo; hasta 10 archivos y 100 MiB por conjunto.</p>
        </div>
      )}
      {files.length > 0 ? <ul className="space-y-2 text-sm text-foreground-secondary">{files.map((file, index) => (
        <li key={index} className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{file.name}<span className="block text-xs">{formatFileSize(file.size)}</span></span>
          <Button type="button" variant="ghost" size="sm" disabled={locked} title="Retirar selección local" aria-label={`Retirar selección: ${file.name}`}
            onClick={() => onFilesChange(files.filter((_, position) => position !== index))}><X size={16} aria-hidden="true" /></Button>
        </li>
      ))}</ul> : null}
      {selectionIssue ? <p role="alert" className="text-sm text-danger">{selectionIssue}</p> : null}
      {!locked && !permitted ? <p className="text-sm text-foreground-secondary">Esta acción ya no está disponible para esta versión.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={submitDisabled}>
          {busy ? "Guardando…" : operation === "remove" ? "Confirmar: quitar documento" : labels[operation]}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={closeDisabled} onClick={() => { if (!closeDisabled) onClose(); }}>Cerrar</Button>
      </div>
    </form>
  );
}
