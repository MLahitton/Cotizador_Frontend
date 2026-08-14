"use client";

import { FileText, Trash2, Upload, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getUploadPreQuoteDocumentErrorMessage } from "@/features/prequotes/components/prequote-errors";
import {
  DOCUMENT_FILE_ACCEPT,
  formatFileSize,
  getSupportedDocumentFormat,
} from "@/features/prequotes/prequote-document-formatters";

export function UploadPreQuoteDocumentPanel({
  selectedFiles,
  validationError,
  uploadError,
  isUploading,
  uploadedCount,
  uploadTotal,
  onFilesSelect,
  onFileRemove,
  onCancel,
  onUpload,
  mode = "upload",
  errorMessageOverride,
}: {
  selectedFiles: File[];
  validationError: string | null;
  uploadError: unknown | null;
  isUploading: boolean;
  uploadedCount: number;
  uploadTotal: number;
  onFilesSelect: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onCancel: () => void;
  onUpload: () => void;
  mode?: "upload" | "estimate";
  errorMessageOverride?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorMessage =
    validationError ??
    errorMessageOverride ??
    (uploadError ? getUploadPreQuoteDocumentErrorMessage(uploadError) : null);

  function handleCancel() {
    if (inputRef.current) inputRef.current.value = "";
    onCancel();
  }

  return (
    <Surface>
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Documentos del requerimiento
          </h3>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            {mode === "estimate"
              ? "Selecciona uno o varios archivos para analizarlos juntos y obtener una precotización."
              : "Selecciona uno o varios archivos relacionados. Todos quedarán asociados a esta misma precotización."}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="prequote-document-file"
            className="text-sm font-medium text-foreground"
          >
            Archivos PDF, XLSX, JPG o PNG
          </label>
          <input
            ref={inputRef}
            id="prequote-document-file"
            type="file"
            accept={DOCUMENT_FILE_ACCEPT}
            multiple
            disabled={isUploading}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => {
              onFilesSelect(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = "";
            }}
          />
          <p className="text-sm leading-6 text-foreground-secondary">
            Máximo 20 MiB por archivo. Puedes retirar archivos antes de subirlos.
          </p>
        </div>

        {selectedFiles.length > 0 ? (
          <section aria-labelledby="selected-documents-title">
            <h4
              id="selected-documents-title"
              className="text-sm font-semibold text-foreground"
            >
              Documentos seleccionados ({selectedFiles.length})
            </h4>
            <ul className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex min-w-0 items-start gap-3 rounded-md border border-border bg-background p-3"
                >
                  <FileText
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0 text-foreground-secondary"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="mt-1 text-foreground-secondary">
                      {getSupportedDocumentFormat(file.name, file.type) ??
                        "Formato no compatible"} · {formatFileSize(file.size)} ·{" "}
                      {file.type || "Tipo no informado"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar ${file.name}`}
                    disabled={isUploading}
                    onClick={() => onFileRemove(index)}
                  >
                    <Trash2 aria-hidden="true" size={17} strokeWidth={1.75} />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isUploading ? (
          <p
            className="text-sm text-foreground-secondary"
            role="status"
            aria-live="polite"
          >
            {mode === "estimate"
              ? "Estamos analizando los documentos y calculando la precotización."
              : `Subiendo documento ${Math.min(uploadedCount + 1, uploadTotal)} de ${uploadTotal}...`}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={isUploading}
            onClick={handleCancel}
          >
            <X aria-hidden="true" size={17} strokeWidth={1.75} />
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={
              isUploading ||
              selectedFiles.length === 0 ||
              Boolean(validationError)
            }
            onClick={onUpload}
          >
            <Upload aria-hidden="true" size={17} strokeWidth={1.75} />
            {mode === "estimate"
              ? isUploading
                ? "Generando precotización..."
                : uploadError
                  ? "Intentar nuevamente"
                  : "Generar precotización"
              : isUploading
                ? "Subiendo..."
                : `Subir ${selectedFiles.length} ${selectedFiles.length === 1 ? "documento" : "documentos"}`}
          </Button>
        </div>
      </div>
    </Surface>
  );
}
