import { CircleAlert, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ApiError } from "@/lib/http/api-error";

function getProjectsErrorContent(error: unknown): {
  title: string;
  message: string;
} {
  if (!(error instanceof ApiError)) {
    return {
      title: "No fue posible consultar los proyectos",
      message: "No fue posible obtener la información. Intenta nuevamente.",
    };
  }

  switch (error.status) {
    case 0:
      return {
        title: "No fue posible conectar con el servidor",
        message: "Verifica que el backend esté disponible e intenta nuevamente.",
      };
    case 400:
      return {
        title: "Solicitud inválida",
        message:
          "Los parámetros utilizados para consultar proyectos no son válidos.",
      };
    case 401:
      return {
        title: "Sesión no válida",
        message: "Tu sesión no es válida o expiró.",
      };
    case 403:
      return {
        title: "Acceso no permitido",
        message: "No tienes permiso para consultar proyectos.",
      };
    default:
      return {
        title: "No fue posible consultar los proyectos",
        message: "No fue posible obtener la información. Intenta nuevamente.",
      };
  }
}

export interface ProjectsFeedbackProps {
  error: unknown;
  isLoading: boolean;
  isRefreshing: boolean;
  onRetry: () => void;
}

export function ProjectsFeedback({
  error,
  isLoading,
  isRefreshing,
  onRetry,
}: ProjectsFeedbackProps) {
  if (isLoading) {
    return (
      <Surface>
        <div
          className="flex items-center gap-3 text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
          <p>Cargando proyectos...</p>
        </div>
      </Surface>
    );
  }

  if (error) {
    const content = getProjectsErrorContent(error);

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
            <h2 className="font-semibold text-foreground">{content.title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {content.message}
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
        Actualizando proyectos...
      </p>
    );
  }

  return null;
}
