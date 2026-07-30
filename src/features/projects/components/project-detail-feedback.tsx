import { ArrowLeft, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ProjectDetailsLoadError } from "@/features/projects/use-project-details";
import { ApiError } from "@/lib/http/api-error";
import { cn } from "@/lib/utils/cn";

function getProjectErrorContent(error: ProjectDetailsLoadError): {
  title: string;
  message: string;
  canRetry: boolean;
  isNotFound: boolean;
} {
  const cause = error.cause;

  if (!(cause instanceof ApiError)) {
    return {
      title: "No fue posible consultar el proyecto",
      message: "Intenta nuevamente en unos minutos.",
      canRetry: true,
      isNotFound: false,
    };
  }

  switch (cause.status) {
    case 0:
      return {
        title: "No fue posible conectar con el servidor",
        message: "Verifica que el backend esté disponible e intenta nuevamente.",
        canRetry: true,
        isNotFound: false,
      };
    case 400:
      return {
        title: "Solicitud inválida",
        message: "No fue posible consultar el proyecto solicitado.",
        canRetry: true,
        isNotFound: false,
      };
    case 401:
      return {
        title: "Sesión no válida",
        message: "Tu sesión no es válida o expiró.",
        canRetry: true,
        isNotFound: false,
      };
    case 403:
      return {
        title: "Acceso no permitido",
        message: "No tienes permiso para consultar este proyecto.",
        canRetry: true,
        isNotFound: false,
      };
    case 404:
      return {
        title: "Proyecto no encontrado",
        message: "No existe un proyecto con el identificador indicado.",
        canRetry: false,
        isNotFound: true,
      };
    default:
      return {
        title: "No fue posible consultar el proyecto",
        message: "Intenta nuevamente en unos minutos.",
        canRetry: true,
        isNotFound: false,
      };
  }
}

export function InvalidProjectIdFeedback() {
  return (
    <Surface>
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            El identificador del proyecto no es válido.
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Revisa el enlace utilizado para abrir este proyecto.
          </p>
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a proyectos
          </Link>
        </div>
      </div>
    </Surface>
  );
}

export function ProjectDetailsLoading() {
  return (
    <Surface>
      <div
        className="flex items-center gap-3 text-sm text-foreground-secondary"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
        <p>Cargando proyecto...</p>
      </div>
    </Surface>
  );
}

export function ProjectDetailsErrorFeedback({
  error,
  onRetry,
}: {
  error: ProjectDetailsLoadError;
  onRetry: () => void;
}) {
  const content = getProjectErrorContent(error);

  return (
    <Surface>
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            {content.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            {content.message}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className={cn(
                buttonVariants({
                  variant: content.isNotFound ? "primary" : "outline",
                }),
                "w-full sm:w-auto",
              )}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
              Volver a proyectos
            </Link>
            {content.canRetry ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onRetry}
              >
                Reintentar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Surface>
  );
}
