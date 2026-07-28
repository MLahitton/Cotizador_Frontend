import { CircleAlert, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ApiError } from "@/lib/http/api-error";

const FALLBACK_ERROR_MESSAGE =
  "Se produjo un error al consultar la información. Intenta nuevamente.";

function getSafeErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return FALLBACK_ERROR_MESSAGE;
  }

  if (
    error.status === 0 ||
    error.status === 400 ||
    error.status === 403 ||
    error.status === 404 ||
    error.status === 409 ||
    error.status === 422
  ) {
    return error.detail;
  }

  return FALLBACK_ERROR_MESSAGE;
}

export interface ClientsFeedbackProps {
  error: unknown;
  isLoading: boolean;
  isRefreshing: boolean;
  onRetry: () => void;
}

export function ClientsFeedback({
  error,
  isLoading,
  isRefreshing,
  onRetry,
}: ClientsFeedbackProps) {
  if (isLoading) {
    return (
      <Surface>
        <div
          className="flex items-center gap-3 text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
          <p>Cargando clientes…</p>
        </div>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface>
        <div role="alert" className="flex items-start gap-3">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-danger"
            size={20}
            strokeWidth={1.75}
          />
          <div>
            <h2 className="font-semibold text-foreground">
              No fue posible consultar los clientes
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {getSafeErrorMessage(error)}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </Surface>
    );
  }

  if (isRefreshing) {
    return (
      <p
        className="text-sm text-foreground-secondary"
        role="status"
        aria-live="polite"
      >
        Actualizando clientes…
      </p>
    );
  }

  return null;
}
