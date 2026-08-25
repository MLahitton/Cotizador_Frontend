"use client";

import { FileText, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { Select } from "@/components/ui/select";
import { DOCUMENT_FILE_ACCEPT, formatFileSize, getSupportedDocumentFormat } from "@/features/prequotes/prequote-document-formatters";
import type { RequirementCommercialLine } from "@/features/prequotes/requirement-types";

export function RequirementUploadPanel({
  files, commercialLine, validationError, isUploading, onCommercialLineChange, onFilesSelect, onFileRemove, onUpload,
}: {
  files: File[];
  commercialLine: RequirementCommercialLine | null;
  validationError: string | null;
  isUploading: boolean;
  onCommercialLineChange: (line: RequirementCommercialLine) => void;
  onFilesSelect: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onUpload: () => void;
}) {
  return (
    <Surface variant="subtle" className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Agregar requerimiento</h3>
        <p className="mt-1 text-sm leading-6 text-foreground-secondary">
          Adjunta de 1 a 10 documentos. Se agruparan en un unico requerimiento tecnico.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="requirement-commercial-line" className="text-sm font-medium text-foreground">Linea comercial</label>
        <Select
          id="requirement-commercial-line"
          value={commercialLine ?? ""}
          disabled={isUploading}
          onChange={(event) => onCommercialLineChange(event.target.value as RequirementCommercialLine)}
        >
          <option value="" disabled>Selecciona una linea comercial</option>
          <option value="CLASSIC">Classic</option>
          <option value="ESSENTIAL">Essential</option>
          <option value="BIOCONFORT">Bioconfort</option>
          <option value="SIGNATURE">Signature</option>
        </Select>
        <p className="text-xs text-foreground-secondary">La linea quedara asociada al requerimiento y no se podra cambiar despues de crearlo.</p>
      </div>
      <input
        type="file"
        multiple
        accept={DOCUMENT_FILE_ACCEPT}
        disabled={isUploading}
        aria-label="Archivos del requerimiento"
        className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-background disabled:opacity-60"
        onChange={(event) => {
          onFilesSelect(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <p className="text-xs text-foreground-secondary">
        PDF, XLSX, JPG o PNG · 20 MiB por archivo · 100 MiB en total
      </p>
      {files.length > 0 ? (
        <ul className="space-y-2" aria-label="Archivos seleccionados">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex min-w-0 items-center gap-3 rounded-sm border border-border-subtle bg-surface p-3">
              <FileText aria-hidden="true" size={18} className="shrink-0 text-foreground-secondary" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-foreground" title={file.name}>{file.name}</p>
                <p className="text-foreground-secondary">{getSupportedDocumentFormat(file.name, file.type)} · {formatFileSize(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={isUploading} aria-label={`Quitar ${file.name}`} onClick={() => onFileRemove(index)}>
                <Trash2 aria-hidden="true" size={17} />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {validationError ? <p role="alert" className="text-sm font-medium text-danger">{validationError}</p> : null}
      <div className="flex justify-end">
        <Button type="button" disabled={isUploading || !commercialLine || files.length === 0 || Boolean(validationError)} onClick={onUpload}>
          <Upload aria-hidden="true" size={17} />
          {isUploading ? "Creando requerimiento..." : "Crear requerimiento"}
        </Button>
      </div>
    </Surface>
  );
}
