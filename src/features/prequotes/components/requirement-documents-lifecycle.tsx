"use client";

import { FileText, History, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { DOCUMENT_FILE_ACCEPT, formatFileSize, getSupportedDocumentFormat, MAX_DOCUMENT_SIZE_BYTES } from "@/features/prequotes/prequote-document-formatters";
import {
  addRequirementDocument,
  cancelRequirement,
  getRequirementById,
  getRequirementErrorMessage,
  removeRequirementDocument,
  replaceRequirement,
  replaceRequirementDocument,
} from "@/features/prequotes/requirement-api";
import type { RequirementDetails } from "@/features/prequotes/requirement-types";

function validateFiles(files: File[]): string | null {
  if (files.length === 0) return "Selecciona al menos un archivo.";
  if (files.length > 10) return "Puedes seleccionar hasta 10 archivos.";
  if (files.some((file) => !getSupportedDocumentFormat(file.name, file.type))) return "Solo se permiten archivos PDF, XLSX, JPG o PNG.";
  if (files.some((file) => file.size === 0)) return "Los archivos no pueden estar vacíos.";
  if (files.some((file) => file.size > MAX_DOCUMENT_SIZE_BYTES)) return "Cada archivo debe pesar como máximo 20 MiB.";
  if (files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) return "El conjunto de archivos debe pesar como máximo 100 MiB.";
  return null;
}

export function RequirementDocumentsLifecycle({ requirementId, onCurrentChanged }: {
  requirementId: string;
  onCurrentChanged: () => void;
}) {
  const [viewedId, setViewedId] = useState(requirementId);
  const [details, setDetails] = useState<RequirementDetails | null>(null);
  const [loadingRequirement, setLoadingRequirement] = useState(true);
  const [addingDocument, setAddingDocument] = useState(false);
  const [removingDocumentId, setRemovingDocumentId] = useState<string | null>(null);
  const [replacingDocumentId, setReplacingDocumentId] = useState<string | null>(null);
  const [cancellingRequirement, setCancellingRequirement] = useState(false);
  const [replacingRequirement, setReplacingRequirement] = useState(false);
  const [replacementFiles, setReplacementFiles] = useState<File[]>([]);
  const [showReplacement, setShowReplacement] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const load = useCallback(async (id: string) => {
    const request = ++requestRef.current;
    setLoadingRequirement(true);
    setError(null);
    try {
      const response = await getRequirementById(id);
      if (request === requestRef.current) setDetails(response);
    } catch (cause) {
      if (request === requestRef.current) setError(cause);
    } finally {
      if (request === requestRef.current) setLoadingRequirement(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getRequirementById(requirementId)
      .then((response) => { if (!cancelled) setDetails(response); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause); })
      .finally(() => { if (!cancelled) setLoadingRequirement(false); });
    return () => { cancelled = true; };
  }, [requirementId]);

  const refreshAfterWrite = useCallback(async (id: string) => {
    setViewedId(id);
    await load(id);
    onCurrentChanged();
  }, [load, onCurrentChanged]);

  const handleAdd = async (file: File) => {
    const issue = validateFiles([file]);
    if (issue) { setError(new Error(issue)); return; }
    setAddingDocument(true); setError(null);
    try { await addRequirementDocument(viewedId, file); await refreshAfterWrite(viewedId); }
    catch (cause) { setError(cause); await load(viewedId); }
    finally { setAddingDocument(false); }
  };

  const handleRemove = async (fileId: string, fileName: string) => {
    if (!window.confirm(`¿Quitar "${fileName}" de este Requirement?`)) return;
    setRemovingDocumentId(fileId); setError(null);
    try { await removeRequirementDocument(viewedId, fileId); await refreshAfterWrite(viewedId); }
    catch (cause) { setError(cause); await load(viewedId); }
    finally { setRemovingDocumentId(null); }
  };

  const handleReplaceDocument = async (fileId: string, file: File) => {
    const issue = validateFiles([file]);
    if (issue) { setError(new Error(issue)); return; }
    setReplacingDocumentId(fileId); setError(null);
    try { await replaceRequirementDocument(viewedId, fileId, file); await refreshAfterWrite(viewedId); }
    catch (cause) { setError(cause); await load(viewedId); }
    finally { setReplacingDocumentId(null); }
  };

  const handleCancel = async () => {
    if (!window.confirm("Este Requirement dejará de ser el vigente. Los datos existentes se conservarán según su ciclo de vida. ¿Deseas continuar?")) return;
    setCancellingRequirement(true); setError(null);
    try { await cancelRequirement(viewedId); await load(viewedId); onCurrentChanged(); }
    catch (cause) { setError(cause); await load(viewedId); }
    finally { setCancellingRequirement(false); }
  };

  const handleReplacement = async () => {
    const issue = validateFiles(replacementFiles);
    if (issue) { setError(new Error(issue)); return; }
    setReplacingRequirement(true); setError(null);
    try {
      const response = await replaceRequirement(viewedId, replacementFiles);
      setReplacementFiles([]); setShowReplacement(false);
      await refreshAfterWrite(response.requirementId);
    } catch (cause) { setError(cause); await load(viewedId); }
    finally { setReplacingRequirement(false); }
  };

  if (loadingRequirement && !details) return <Surface variant="subtle"><p className="text-sm text-foreground-secondary">Cargando documentos del Requirement...</p></Surface>;

  return (
    <Surface variant="default" className="space-y-4" aria-labelledby="requirement-documents-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="requirement-documents-title" className="font-semibold text-foreground">Documentos del Requirement</h3>
          <p className="mt-1 text-sm text-foreground-secondary">Archivos asociados directamente a esta versión.</p>
        </div>
        {loadingRequirement ? <RefreshCw aria-label="Actualizando" className="animate-spin text-foreground-secondary" size={18} /> : null}
      </div>

      {details && !details.isCurrent ? (
        <div className="rounded-sm border border-warning/30 bg-warning-soft p-3 text-sm text-foreground">
          <p className="font-semibold">Este Requirement fue reemplazado o descartado y se conserva como historial.</p>
          {details.supersededByRequirementId ? <Button className="mt-3" type="button" variant="outline" size="sm" onClick={() => { setViewedId(details.supersededByRequirementId!); void load(details.supersededByRequirementId!); }}><History size={16} />Ver Requirement actual</Button> : null}
        </div>
      ) : null}

      {details?.documents.length ? (
        <ul className="space-y-2">
          {details.documents.map((document) => {
            const busy = removingDocumentId === document.requirementFileId || replacingDocumentId === document.requirementFileId;
            return <li key={document.requirementFileId} className="flex flex-col gap-3 rounded-sm border border-border bg-surface-subtle p-3 sm:flex-row sm:items-center">
              <FileText size={18} className="shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{document.fileName}</p><p className="text-xs text-foreground-secondary">{formatFileSize(document.sizeBytes)}</p></div>
              {details.canEditDocuments ? <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-muted aria-disabled:pointer-events-none aria-disabled:opacity-60" aria-disabled={busy}>
                  <Upload size={15} />{replacingDocumentId === document.requirementFileId ? "Reemplazando..." : "Reemplazar"}
                  <input className="sr-only" type="file" accept={DOCUMENT_FILE_ACCEPT} disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleReplaceDocument(document.requirementFileId, file); event.target.value = ""; }} />
                </label>
                <Button type="button" variant="ghost" size="sm" disabled={busy || details.documents.length <= 1} onClick={() => void handleRemove(document.requirementFileId, document.fileName)}><Trash2 size={15} />{removingDocumentId === document.requirementFileId ? "Quitando..." : "Quitar"}</Button>
              </div> : null}
            </li>;
          })}
        </ul>
      ) : <p className="text-sm text-foreground-secondary">No hay documentos disponibles.</p>}

      {details?.canEditDocuments ? <div className="flex flex-wrap gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-brand px-4 py-2 text-sm font-semibold text-white aria-disabled:pointer-events-none aria-disabled:opacity-60" aria-disabled={addingDocument}>
          <Plus size={16} />{addingDocument ? "Agregando..." : "Agregar documento"}
          <input className="sr-only" type="file" accept={DOCUMENT_FILE_ACCEPT} disabled={addingDocument} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleAdd(file); event.target.value = ""; }} />
        </label>
        {details.canCancel ? <Button type="button" variant="danger" disabled={cancellingRequirement} onClick={() => void handleCancel()}>{cancellingRequirement ? "Descartando..." : "Descartar Requirement"}</Button> : null}
      </div> : null}

      {details && !details.canEditDocuments && details.canReplace && details.isCurrent ? <div className="space-y-3 rounded-sm border border-border bg-surface-subtle p-4">
        <p className="text-sm text-foreground-secondary">Documentos bloqueados después del análisis. Para cambiarlos, crea una nueva versión del Requirement.</p>
        {!showReplacement ? <Button type="button" onClick={() => setShowReplacement(true)}>Reemplazar documentos</Button> : <>
          <input type="file" multiple accept={DOCUMENT_FILE_ACCEPT} disabled={replacingRequirement} className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:border-brand/50 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60" onChange={(event) => setReplacementFiles(Array.from(event.target.files ?? []))} />
          <p className="text-xs text-foreground-secondary">Selecciona el conjunto documental completo para la nueva versión.</p>
          <div className="flex gap-2"><Button type="button" disabled={replacingRequirement || replacementFiles.length === 0} onClick={() => void handleReplacement()}>{replacingRequirement ? "Creando nueva versión..." : "Crear reemplazo"}</Button><Button type="button" variant="ghost" disabled={replacingRequirement} onClick={() => { setShowReplacement(false); setReplacementFiles([]); }}>Cancelar</Button></div>
        </>}
      </div> : null}

      {details?.supersedesRequirementId ? <Button type="button" variant="ghost" size="sm" onClick={() => { setViewedId(details.supersedesRequirementId!); void load(details.supersedesRequirementId!); }}><History size={16} />Ver Requirement anterior</Button> : null}
      {error ? <div role="alert" className="rounded-sm border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{error instanceof Error && !("status" in error) ? error.message : getRequirementErrorMessage(error, "lifecycle")}</div> : null}
    </Surface>
  );
}
