import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientActivationError } from "@/features/clients/use-set-client-activation";
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
      title: "Activar cliente",
      description:
        "El cliente volverá a aparecer en el filtro Activos y podrá utilizarse normalmente en los procesos disponibles.",
      confirmLabel: "Sí, activar",
      submittingLabel: "Activando cliente...",
    };
  }

  return {
    title: "Desactivar cliente",
    description:
      "El cliente dejará de aparecer en el filtro Activos, pero sus datos no se eliminarán. Podrás volver a activarlo posteriormente.",
    confirmLabel: "Sí, desactivar",
    submittingLabel: "Desactivando cliente...",
  };
}

function getActivationErrorContent(error: ClientActivationError): {
  title: string;
  message: string;
  isNotFound: boolean;
} {
  const cause = error.cause;

  if (!(cause instanceof ApiError)) {
    return {
      title: "No fue posible cambiar el estado del cliente",
      message: "No fue posible guardar el nuevo estado. Intenta nuevamente.",
      isNotFound: false,
    };
  }

  switch (cause.status) {
    case 0:
      return {
        title: "No fue posible conectar con el servidor",
        message: "Verifica que el backend esté disponible e intenta nuevamente.",
        isNotFound: false,
      };
    case 400:
      return {
        title: "Solicitud inválida",
        message: "No fue posible cambiar el estado del cliente solicitado.",
        isNotFound: false,
      };
    case 401:
      return {
        title: "Sesión no válida",
        message: "Tu sesión no es válida o expiró.",
        isNotFound: false,
      };
    case 403:
      return {
        title: "Acceso no permitido",
        message: "No tienes permiso para cambiar el estado de clientes.",
        isNotFound: false,
      };
    case 404:
      return {
        title: "Cliente no encontrado",
        message: "El cliente ya no existe o no está disponible.",
        isNotFound: true,
      };
    default:
      return {
        title: "No fue posible cambiar el estado del cliente",
        message: "No fue posible guardar el nuevo estado. Intenta nuevamente.",
        isNotFound: false,
      };
  }
}

export function ClientActivationConfirmation({
  legalName,
  targetIsActive,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: {
  legalName: string;
  targetIsActive: boolean;
  isSubmitting: boolean;
  error: ClientActivationError | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const copy = getActivationCopy(targetIsActive);
  const errorContent = error ? getActivationErrorContent(error) : null;

  return (
    <Surface
      variant="subtle"
      className="max-w-3xl"
      aria-labelledby="client-activation-confirmation-title"
      aria-describedby="client-activation-confirmation-description"
      aria-busy={isSubmitting ? "true" : undefined}
    >
      <section>
        <h2
          id="client-activation-confirmation-title"
          className="text-lg font-semibold text-foreground"
        >
          {copy.title}
        </h2>
        <p
          id="client-activation-confirmation-description"
          className="mt-2 text-sm leading-6 text-foreground-secondary"
        >
          {copy.description}
        </p>
        <p className="mt-4 break-words text-sm font-semibold text-foreground">
          {legalName}
        </p>

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
              <p className="text-sm font-semibold">{errorContent.title}</p>
              <p className="mt-1 text-sm leading-6">{errorContent.message}</p>
              {errorContent.isNotFound ? (
                <Link
                  href="/clients"
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
                  Volver a clientes
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
