"use client";

import { useCallback, useRef, useState } from "react";

import {
  approvePreQuoteDraft,
  isInvalidApprovePreQuoteDraftResponseError,
} from "@/features/prequotes/prequote-draft-api";
import type {
  ApprovePreQuoteDraftError,
  ApprovePreQuoteDraftRequest,
  ApprovePreQuoteDraftResult,
} from "@/features/prequotes/prequote-draft-types";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import { API_ERROR_CODES, getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

export interface UseApprovePreQuoteDraftResult {
  error: ApprovePreQuoteDraftError | null;
  isApproving: boolean;
  resetError: () => void;
  approve: (
    preQuoteId: string,
    request: ApprovePreQuoteDraftRequest,
  ) => Promise<ApprovePreQuoteDraftResult>;
}

export function isPreQuoteDraftApprovalVersionConflict(error: unknown): boolean {
  return getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftVersionConflict;
}

export function isPreQuoteDraftApprovalAlreadyApproved(error: unknown): boolean {
  return getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftAlreadyApproved;
}

export function getApprovePreQuoteDraftErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible aprobar la precotización. Inténtalo nuevamente.";

  if (isInvalidApprovePreQuoteDraftResponseError(error)) {
    return "El servidor devolvió una respuesta inesperada al aprobar el borrador.";
  }

  const code = getApiErrorCode(error);

  switch (code) {
    case PREQUOTE_ERROR_CODES.draftInvalidRequest:
      return "La solicitud de aprobación del borrador no es válida.";
    case API_ERROR_CODES.unauthorized:
      return "Tu sesión no permite aprobar este borrador. Inicia sesión nuevamente.";
    case API_ERROR_CODES.inactiveUser:
      return "Tu usuario no tiene acceso para aprobar este borrador.";
    case PREQUOTE_ERROR_CODES.draftNotFound:
      return "El borrador ya no está disponible.";
    case PREQUOTE_ERROR_CODES.draftVersionConflict:
      return "El borrador cambió en otra sesión. Recarga la información actual antes de aprobar.";
    case PREQUOTE_ERROR_CODES.draftProjectInactive:
      return "El proyecto está inactivo y no permite aprobar el borrador.";
    case PREQUOTE_ERROR_CODES.draftClientInactive:
      return "El cliente está inactivo y no permite aprobar el borrador.";
    case PREQUOTE_ERROR_CODES.draftAlreadyApproved:
      return "El borrador ya fue aprobado y quedó en solo lectura.";
    case PREQUOTE_ERROR_CODES.draftPendingIssues:
      return "Resuelve o descarta todos los issues pendientes antes de aprobar.";
    case PREQUOTE_ERROR_CODES.draftPendingConflicts:
      return "Resuelve o descarta todos los conflictos pendientes antes de aprobar.";
    case PREQUOTE_ERROR_CODES.draftInvalidContent:
      return "El borrador todavía no cumple las condiciones económicas y operativas para aprobarse.";
    case PREQUOTE_ERROR_CODES.draftQueryError:
      return "No fue posible consultar el borrador antes de aprobar.";
    case PREQUOTE_ERROR_CODES.draftPersistenceError:
      return "No fue posible guardar la aprobación del borrador.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operación solicitada no está disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamaño permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
      case 400:
        return "La solicitud de aprobación del borrador no es válida.";
      case 401:
        return "Tu sesión no permite aprobar este borrador.";
      case 403:
        return "No tienes acceso para aprobar este borrador.";
      case 404:
        return "El borrador ya no está disponible.";
      case 409:
        return "No fue posible aprobar por el estado actual del borrador.";
      case 413:
        return "La solicitud supera el tamaño permitido por el servidor.";
      case 500:
        return fallbackMessage;
    }
  }

  return fallbackMessage;
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useApprovePreQuoteDraft(): UseApprovePreQuoteDraftResult {
  const [error, setError] = useState<ApprovePreQuoteDraftError | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const isApprovingRef = useRef(false);
  const requestIdRef = useRef(0);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const approve = useCallback(
    async (
      preQuoteId: string,
      request: ApprovePreQuoteDraftRequest,
    ): Promise<ApprovePreQuoteDraftResult> => {
      if (isApprovingRef.current) {
        return { status: "ignored" };
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const requestedPreQuoteId = preQuoteId;

      isApprovingRef.current = true;
      setIsApproving(true);
      setError(null);

      try {
        const draft = await approvePreQuoteDraft(requestedPreQuoteId, request);

        if (
          requestId !== requestIdRef.current ||
          !idsMatch(draft.preQuoteId, requestedPreQuoteId)
        ) {
          return { status: "stale" };
        }

        return { status: "approved", draft };
      } catch (cause: unknown) {
        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }

        setError({ cause });

        if (isPreQuoteDraftApprovalVersionConflict(cause)) {
          return { status: "version-conflict" };
        }

        if (isPreQuoteDraftApprovalAlreadyApproved(cause)) {
          return { status: "already-approved" };
        }

        return { status: "failed" };
      } finally {
        if (requestId === requestIdRef.current) {
          isApprovingRef.current = false;
          setIsApproving(false);
        }
      }
    },
    [],
  );

  return {
    error,
    isApproving,
    resetError,
    approve,
  };
}
