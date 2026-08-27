"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getSupportedDocumentFormat,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/features/prequotes/prequote-document-formatters";
import { uploadPreQuoteDocument } from "@/features/prequotes/prequote-documents-api";
import type { UploadedPreQuoteDocument } from "@/features/prequotes/prequote-documents-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";

const MAX_FILE_NAME_LENGTH = 255;

interface UploadState {
  key: string;
  selectedFiles: File[];
  validationError: string | null;
  uploadError: unknown | null;
  isUploading: boolean;
  uploadedCount: number;
  uploadTotal: number;
}

export type UploadPreQuoteDocumentResult =
  | { status: "uploaded"; documents: UploadedPreQuoteDocument[] }
  | { status: "partial"; documents: UploadedPreQuoteDocument[] }
  | { status: "failed" }
  | { status: "stale" }
  | { status: "ignored" };

function createInitialState(preQuoteId: string): UploadState {
  return {
    key: preQuoteId,
    selectedFiles: [],
    validationError: null,
    uploadError: null,
    isUploading: false,
    uploadedCount: 0,
    uploadTotal: 0,
  };
}

function validateUploadFile(file: File): string | null {
  const normalizedFileName = file.name.trim();

  if (
    normalizedFileName.length === 0 ||
    normalizedFileName.length > MAX_FILE_NAME_LENGTH
  ) {
    return `El nombre de ${file.name || "uno de los archivos"} no es válido.`;
  }

  if (!getSupportedDocumentFormat(normalizedFileName, file.type)) {
    return `${file.name} no es un archivo PDF, XLSX, JPG o PNG compatible.`;
  }

  if (file.size === 0) {
    return `${file.name} está vacío.`;
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return `${file.name} supera el límite de 20 MiB.`;
  }

  return null;
}

function validateUploadFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Selecciona al menos un documento PDF, XLSX, JPG o PNG.";
  }

  for (const file of files) {
    const error = validateUploadFile(file);
    if (error) return error;
  }

  return null;
}

function fileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function useUploadPreQuoteDocument(preQuoteId: string) {
  const [state, setState] = useState<UploadState>(() =>
    createInitialState(preQuoteId),
  );
  const requestIdRef = useRef(0);
  const isUploadingRef = useRef(false);
  const currentPreQuoteIdRef = useRef(preQuoteId);

  useEffect(() => {
    currentPreQuoteIdRef.current = preQuoteId;
    requestIdRef.current += 1;
    isUploadingRef.current = false;
  }, [preQuoteId]);

  const currentState = useMemo(
    () => (state.key === preQuoteId ? state : createInitialState(preQuoteId)),
    [preQuoteId, state],
  );

  const selectFiles = useCallback(
    (files: File[]) => {
      if (isUploadingRef.current) return;

      setState((current) => {
        const existing = current.key === preQuoteId ? current.selectedFiles : [];
        const knownFiles = new Set(existing.map(fileIdentity));
        const additions = files.filter(
          (file) => !knownFiles.has(fileIdentity(file)),
        );
        const selectedFiles = [...existing, ...additions];

        return {
          key: preQuoteId,
          selectedFiles,
          validationError: validateUploadFiles(selectedFiles),
          uploadError: null,
          isUploading: false,
          uploadedCount: 0,
          uploadTotal: 0,
        };
      });
    },
    [preQuoteId],
  );

  const removeFile = useCallback(
    (index: number) => {
      if (isUploadingRef.current) return;

      setState((current) => {
        const selectedFiles = current.selectedFiles.filter(
          (_, fileIndex) => fileIndex !== index,
        );
        return {
          ...current,
          selectedFiles,
          validationError:
            selectedFiles.length === 0
              ? null
              : validateUploadFiles(selectedFiles),
          uploadError: null,
        };
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    if (isUploadingRef.current) return;
    requestIdRef.current += 1;
    setState(createInitialState(preQuoteId));
  }, [preQuoteId]);

  const upload = useCallback(async (): Promise<UploadPreQuoteDocumentResult> => {
    if (isUploadingRef.current || !isValidPreQuoteId(preQuoteId)) {
      return { status: "ignored" };
    }

    const selectedFiles = currentState.selectedFiles;
    const validationError = validateUploadFiles(selectedFiles);
    if (validationError) {
      setState((current) => ({ ...current, validationError }));
      return { status: "failed" };
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    isUploadingRef.current = true;
    setState((current) => ({
      ...current,
      validationError: null,
      uploadError: null,
      isUploading: true,
      uploadedCount: 0,
      uploadTotal: selectedFiles.length,
    }));

    const uploadedDocuments: UploadedPreQuoteDocument[] = [];

    for (let index = 0; index < selectedFiles.length; index += 1) {
      try {
        const document = await uploadPreQuoteDocument(
          preQuoteId,
          selectedFiles[index],
        );

        if (
          requestIdRef.current !== requestId ||
          currentPreQuoteIdRef.current !== preQuoteId
        ) {
          return { status: "stale" };
        }

        uploadedDocuments.push(document);
        setState((current) => ({
          ...current,
          uploadedCount: uploadedDocuments.length,
        }));
      } catch (error) {
        if (
          requestIdRef.current !== requestId ||
          currentPreQuoteIdRef.current !== preQuoteId
        ) {
          return { status: "stale" };
        }

        setState((current) => ({
          ...current,
          selectedFiles: selectedFiles.slice(index),
          uploadError: error,
          isUploading: false,
        }));

        return uploadedDocuments.length > 0
          ? { status: "partial", documents: uploadedDocuments }
          : { status: "failed" };
      }
    }

    setState(createInitialState(preQuoteId));
    return { status: "uploaded", documents: uploadedDocuments };
  }, [currentState.selectedFiles, preQuoteId]);

  return {
    selectedFiles: currentState.selectedFiles,
    validationError: currentState.validationError,
    uploadError: currentState.uploadError,
    isUploading: currentState.isUploading,
    uploadedCount: currentState.uploadedCount,
    uploadTotal: currentState.uploadTotal,
    selectFiles,
    removeFile,
    clearSelection,
    upload,
  };
}
