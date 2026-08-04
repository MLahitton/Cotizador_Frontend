import { ArrowLeft, CircleAlert, Power, PowerOff } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PROJECT_ERROR_CODES } from "@/features/projects/project-error-codes";
import { isInvalidProjectActivationResponseError } from "@/features/projects/projects-api";
import type { ProjectActivationError } from "@/features/projects/use-set-project-activation";
import { API_ERROR_CODES, getApiErrorCode } from "@/lib/errors/api-error-code";
import { ApiError } from "@/lib/http/api-error";
import { cn } from "@/lib/utils/cn";

function getActivationCopy(targetIsActive: boolean): {
  title: string;
  description: string;
  confirmLabel: string;
  submittingLabel: string;
} {
  if (targetIsActive) {
    return {
      title: "Activar este proyecto",
      description:
        "El proyecto volvera a estar disponible para las operaciones permitidas.",
      confirmLabel: "Confirmar activacion",
      submittingLabel: "Activando...",
    };
  }

  return {
    title: "Desactivar este proyecto",
    description:
      "El proyecto seguira disponible para consulta, pero no podra utilizarse en operaciones que requieran un proyecto activo.",
    confirmLabel: "Confirmar desactivacion",
    submittingLabel: "Desactivando...",
  };
}

function getActivationErrorContent(error: ProjectActivationError): {
  message: string;
  isNotFound: boolean;
} {
  const cause = error.cause;

  if (isInvalidProjectActivationResponseError(cause)) {
    return {
      message: "No fue posible confirmar el nuevo estado del proyecto.",
      isNotFound: false,
    };
  }

  if (!(cause instanceof ApiError)) {
    return {
      message: "No fue posible cambiar el estado del proyecto. Intentalo nuevamente.",
      isNotFound: false,
    };
  }

  switch (getApiErrorCode(cause)) {
    case PROJECT_ERROR_CODES.invalidRequest:
      return {
        message:
          "No fue posible cambiar el estado del proyecto porque la solicitud no es válida.",
        isNotFound: false,
      };
    case PROJECT_ERROR_CODES.unauthorized:
      return {
        message: "Tu sesión no es válida o expiró.",
        isNotFound: false,
      };
    case PROJECT_ERROR_CODES.inactiveUser:
      return {
        message: "No tienes permisos para cambiar el estado de este proyecto.",
        isNotFound: false,
      };
    case PROJECT_ERROR_CODES.projectNotFound:
      return {
        message: "El proyecto ya no está disponible.",
        isNotFound: true,
      };
    case PROJECT_ERROR_CODES.queryError:
      return {
        message:
          "No fue posible consultar el proyecto para cambiar su estado. Inténtalo nuevamente.",
        isNotFound: false,
      };
    case PROJECT_ERROR_CODES.persistenceError:
      return {
        message:
          "No fue posible cambiar el estado del proyecto. Inténtalo nuevamente.",
        isNotFound: false,
      };
    case API_ERROR_CODES.methodNotAllowed:
      return {
        message: "La operación solicitada no está disponible.",
        isNotFound: false,
      };
    case API_ERROR_CODES.payloadTooLarge:
      return {
        message: "La solicitud supera el tamaño permitido por el servidor.",
        isNotFound: false,
      };
    case API_ERROR_CODES.internalServerError:
      return {
        message:
          "No fue posible cambiar el estado del proyecto. Inténtalo nuevamente.",
        isNotFound: false,
      };
  }

  switch (cause.status) {
    case 0:
      return {
        message:
          "No fue posible conectar con el servidor. Verifica la conexion e intentalo nuevamente.",
        isNotFound: false,
      };
    case 400:
      return {
        message:
          "No fue posible cambiar el estado del proyecto porque la solicitud no es valida.",
        isNotFound: false,
      };
    case 401:
      return {
        message: "Tu sesion no es valida o expiro.",
        isNotFound: false,
      };
    case 403:
      return {
        message: "No tienes permisos para cambiar el estado de este proyecto.",
        isNotFound: false,
      };
    case 404:
      return {
        message: "El proyecto ya no esta disponible.",
        isNotFound: true,
      };
    default:
      return {
        message:
          "No fue posible cambiar el estado del proyecto. Intentalo nuevamente.",
        isNotFound: false,
      };
  }
}

export function ProjectActivationConfirmation({
  projectName,
  targetIsActive,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  targetIsActive: boolean;
  isSubmitting: boolean;
  error: ProjectActivationError | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const copy = getActivationCopy(targetIsActive);
  const errorContent = error ? getActivationErrorContent(error) : null;
  const Icon = targetIsActive ? Power : PowerOff;

  return (
    <Surface
      variant="subtle"
      className="max-w-3xl"
      aria-labelledby="project-activation-confirmation-title"
      aria-describedby="project-activation-confirmation-description"
      aria-busy={isSubmitting ? "true" : undefined}
    >
      <section>
        <div className="flex min-w-0 items-start gap-3">
          <Icon
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand"
            size={20}
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <h2
              id="project-activation-confirmation-title"
              className="text-lg font-semibold text-foreground"
            >
              {copy.title}
            </h2>
            <p
              id="project-activation-confirmation-description"
              className="mt-2 text-sm leading-6 text-foreground-secondary"
            >
              {copy.description}
            </p>
            <p className="mt-4 break-words text-sm font-semibold text-foreground">
              {projectName}
            </p>
          </div>
        </div>

        {errorContent ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-4 text-danger"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{errorContent.message}</p>
              {errorContent.isNotFound ? (
                <Link
                  href="/projects"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-4",
                  )}
                >
                  <ArrowLeft
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.75}
                  />
                  Volver a proyectos
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          aria-live="polite"
        >
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={targetIsActive ? "primary" : "danger"}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            onClick={onConfirm}
          >
            {isSubmitting ? copy.submittingLabel : copy.confirmLabel}
          </Button>
        </div>
      </section>
    </Surface>
  );
}
