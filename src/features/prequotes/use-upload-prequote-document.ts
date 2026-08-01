"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { uploadPreQuoteDocument } from "@/features/prequotes/prequote-documents-api";
import type { UploadedPreQuoteDocument } from "@/features/prequotes/prequote-documents-types";
import { isValidPreQuoteId } from "@/features/prequotes/prequote-identifiers";

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 255;
const PDF_CONTENT_TYPE = "application/pdf";

type UploadStatus = "idle" | "uploading";

interface UploadState {
  key: string;
  selectedFile: File | null;
  validationError: string | null;
  uploadError: unknown | null;
  status: UploadStatus;
}

export type UploadPreQuoteDocumentResult =
  | { status: "uploaded"; document: UploadedPreQuoteDocument }
  | { status: "failed" }
  | { status: "stale" }
  | { status: "ignored" };

function createInitialState(preQuoteId: string): UploadState {
  return {
    key: preQuoteId,
    selectedFile: null,
    validationError: null,
    uploadError: null,
    status: "idle",
  };
}

function isPdfFileName(fileName: string): boolean {
  return fileName.trim().toLowerCase().endsWith(".pdf");
}

function isAllowedPdfContentType(contentType: string): boolean {
  const normalizedContentType = contentType.trim().toLowerCase();

  return (
    normalizedContentType.length === 0 ||
    normalizedContentType === PDF_CONTENT_TYPE
  );
}

function validateUploadFile(file: File | null): string | null {
  if (!file) {
    return "Selecciona un documento PDF.";
  }

  const normalizedFileName = file.name.trim();

  if (
    normalizedFileName.length === 0 ||
    normalizedFileName.length > MAX_FILE_NAME_LENGTH
  ) {
    return "El nombre del archivo no es válido.";
  }

  if (!isPdfFileName(normalizedFileName) || !isAllowedPdfContentType(file.type)) {
    return "Selecciona un archivo en formato PDF.";
  }

  if (file.size === 0) {
    return "El documento seleccionado está vacío.";
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return "El documento PDF no puede superar 20 MiB.";
  }

  return null;
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

  const selectFile = useCallback(
    (file: File | null) => {
      if (isUploadingRef.current) {
        return;
      }

      setState({
        key: preQuoteId,
        selectedFile: file,
        validationError: validateUploadFile(file),
        uploadError: null,
        status: "idle",
      });
    },
    [preQuoteId],
  );

  const clearSelection = useCallback(() => {
    if (isUploadingRef.current) {
      return;
    }

    requestIdRef.current += 1;
    setState(createInitialState(preQuoteId));
  }, [preQuoteId]);

  const upload = useCallback(async (): Promise<UploadPreQuoteDocumentResult> => {
    if (isUploadingRef.current || !isValidPreQuoteId(preQuoteId)) {
      return { status: "ignored" };
    }

    const selectedFile =
      currentState.key === preQuoteId ? currentState.selectedFile : null;
    const validationError = validateUploadFile(selectedFile);

    if (validationError || !selectedFile) {
      setState({
        key: preQuoteId,
        selectedFile,
        validationError,
        uploadError: null,
        status: "idle",
      });

      return { status: "failed" };
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    isUploadingRef.current = true;
    setState({
      key: preQuoteId,
      selectedFile,
      validationError: null,
      uploadError: null,
      status: "uploading",
    });

    try {
      const document = await uploadPreQuoteDocument(preQuoteId, selectedFile);

      if (
        requestIdRef.current !== requestId ||
        currentPreQuoteIdRef.current !== preQuoteId
      ) {
        return { status: "stale" };
      }

      setState(createInitialState(preQuoteId));

      return { status: "uploaded", document };
    } catch (error) {
      if (
        requestIdRef.current !== requestId ||
        currentPreQuoteIdRef.current !== preQuoteId
      ) {
        return { status: "stale" };
      }

      setState({
        key: preQuoteId,
        selectedFile,
        validationError: null,
        uploadError: error,
        status: "idle",
      });

      return { status: "failed" };
    } finally {
      if (
        requestIdRef.current === requestId &&
        currentPreQuoteIdRef.current === preQuoteId
      ) {
        isUploadingRef.current = false;
      }
    }
  }, [currentState, preQuoteId]);

  return {
    selectedFile: currentState.selectedFile,
    validationError: currentState.validationError,
    uploadError: currentState.uploadError,
    isUploading: currentState.status === "uploading",
    selectFile,
    clearSelection,
    upload,
  };
}
