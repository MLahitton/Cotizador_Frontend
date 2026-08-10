"use client";

import { FileText, Upload, X } from "lucide-react";
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
  selectedFile,
  validationError,
  uploadError,
  isUploading,
  onFileSelect,
  onCancel,
  onUpload,
}: {
  selectedFile: File | null;
  validationError: string | null;
  uploadError: unknown | null;
  isUploading: boolean;
  onFileSelect: (file: File | null) => void;
  onCancel: () => void;
  onUpload: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorMessage =
    validationError ??
    (uploadError ? getUploadPreQuoteDocumentErrorMessage(uploadError) : null);

  function handleCancel() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onCancel();
  }

  return (
    <Surface>
      <div className="space-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">
            Agregar documento PDF o XLSX
          </h3>
          <p className="text-sm leading-6 text-foreground-secondary">
            El documento quedará asociado a esta precotización. El
            procesamiento se realizará en una etapa posterior.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="prequote-document-file"
            className="text-sm font-medium text-foreground"
          >
            Documento PDF o XLSX
          </label>
          <input
            ref={inputRef}
            id="prequote-document-file"
            type="file"
            accept={DOCUMENT_FILE_ACCEPT}
            disabled={isUploading}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) =>
              onFileSelect(event.currentTarget.files?.[0] ?? null)
            }
          />
          <p className="text-sm leading-6 text-foreground-secondary">
            Selecciona un archivo PDF o XLSX de hasta 20 MiB.
          </p>
        </div>

        {selectedFile ? (
          <div className="flex min-w-0 items-start gap-3 rounded-md border border-border bg-background px-3 py-3">
            <FileText
              aria-hidden="true"
              size={18}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0 text-foreground-secondary"
            />
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-foreground-secondary">
                {getSupportedDocumentFormat(
                  selectedFile.name,
                  selectedFile.type,
                ) ?? "Formato no compatible"}{" "}
                - {formatFileSize(selectedFile.size)} -{" "}
                {selectedFile.type || "Tipo no informado"}
              </p>
            </div>
          </div>
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
            Subiendo documento...
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
            disabled={isUploading || !selectedFile || Boolean(validationError)}
            onClick={onUpload}
          >
            <Upload aria-hidden="true" size={17} strokeWidth={1.75} />
            {isUploading ? "Subiendo..." : "Subir documento"}
          </Button>
        </div>
      </div>
    </Surface>
  );
}
