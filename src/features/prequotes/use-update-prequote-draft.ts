"use client";

import { useCallback, useRef, useState } from "react";

import { updatePreQuoteDraft } from "@/features/prequotes/prequote-draft-api";
import type {
  UpdatePreQuoteDraftError,
  UpdatePreQuoteDraftRequest,
  UpdatePreQuoteDraftResult,
} from "@/features/prequotes/prequote-draft-types";
import { PREQUOTE_ERROR_CODES } from "@/features/prequotes/prequote-error-codes";
import { API_ERROR_CODES, getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";

export interface UseUpdatePreQuoteDraftResult {
  error: UpdatePreQuoteDraftError | null;
  isSubmitting: boolean;
  resetError: () => void;
  submit: (
    preQuoteId: string,
    request: UpdatePreQuoteDraftRequest,
  ) => Promise<UpdatePreQuoteDraftResult>;
}

export function isPreQuoteDraftVersionConflict(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 409 ||
      getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftVersionConflict) &&
    getApiErrorCode(error) === PREQUOTE_ERROR_CODES.draftVersionConflict
  );
}

export function getUpdatePreQuoteDraftErrorMessage(error: unknown): string {
  const fallbackMessage =
    "No fue posible guardar los cambios del borrador. Intentalo nuevamente.";

  const code = getApiErrorCode(error);

  switch (code) {
    case PREQUOTE_ERROR_CODES.draftInvalidRequest:
      return "La solicitud de actualizacion del borrador no es valida.";
    case PREQUOTE_ERROR_CODES.draftNotFound:
      return "El borrador ya no esta disponible.";
    case PREQUOTE_ERROR_CODES.draftVersionConflict:
      return "El borrador fue modificado por otra sesion. Revisa tus cambios antes de continuar.";
    case PREQUOTE_ERROR_CODES.draftProjectInactive:
      return "El proyecto esta inactivo y no permite actualizar el borrador.";
    case PREQUOTE_ERROR_CODES.draftClientInactive:
      return "El cliente esta inactivo y no permite actualizar el borrador.";
    case PREQUOTE_ERROR_CODES.draftAlreadyApproved:
      return "El borrador ya fue aprobado y no puede modificarse.";
    case PREQUOTE_ERROR_CODES.draftInvalidContent:
      return "El contenido enviado no cumple las reglas del borrador.";
    case PREQUOTE_ERROR_CODES.draftQueryError:
      return "No fue posible consultar el borrador antes de guardar.";
    case PREQUOTE_ERROR_CODES.draftPersistenceError:
      return "No fue posible persistir los cambios del borrador.";
    case API_ERROR_CODES.unauthorized:
      return "Tu sesion no permite guardar estos cambios.";
    case API_ERROR_CODES.inactiveUser:
      return "Tu usuario no tiene acceso para guardar estos cambios.";
    case API_ERROR_CODES.methodNotAllowed:
      return "La operacion solicitada no esta disponible.";
    case API_ERROR_CODES.payloadTooLarge:
      return "La solicitud supera el tamano permitido por el servidor.";
    case API_ERROR_CODES.internalServerError:
      return fallbackMessage;
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return "No fue posible conectar con el servidor. Verifica la conexion e intentalo nuevamente.";
      case 400:
        return "La solicitud de actualizacion del borrador no es valida.";
      case 401:
        return "Tu sesion no permite guardar estos cambios.";
      case 403:
        return "No tienes acceso para guardar este borrador.";
      case 404:
        return "El borrador ya no esta disponible.";
      case 409:
        return "No fue posible guardar por el estado actual del borrador.";
      case 413:
        return "La solicitud supera el tamano permitido por el servidor.";
      case 500:
        return fallbackMessage;
    }
  }

  return fallbackMessage;
}

function idsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function useUpdatePreQuoteDraft(): UseUpdatePreQuoteDraftResult {
  const [error, setError] = useState<UpdatePreQuoteDraftError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const requestIdRef = useRef(0);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const submit = useCallback(
    async (
      preQuoteId: string,
      request: UpdatePreQuoteDraftRequest,
    ): Promise<UpdatePreQuoteDraftResult> => {
      if (isSubmittingRef.current) {
        return { status: "ignored" };
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const requestedPreQuoteId = preQuoteId;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const draft = await updatePreQuoteDraft(requestedPreQuoteId, request);

        if (
          requestId !== requestIdRef.current ||
          !idsMatch(draft.preQuoteId, requestedPreQuoteId)
        ) {
          return { status: "stale" };
        }

        return { status: "updated", draft };
      } catch (cause: unknown) {
        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }

        setError({ cause });

        if (isPreQuoteDraftVersionConflict(cause)) {
          return { status: "version-conflict" };
        }

        return { status: "failed" };
      } finally {
        if (requestId === requestIdRef.current) {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      }
    },
    [],
  );

  return {
    error,
    isSubmitting,
    resetError,
    submit,
  };
}
