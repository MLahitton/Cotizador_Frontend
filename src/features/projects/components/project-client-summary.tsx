import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientDetails } from "@/features/clients/clients-types";
import {
  formatClientType,
  formatDocumentLabel,
  formatNullableValue,
  formatProjectStatus,
} from "@/features/projects/project-detail-formatters";
import type { ProjectDetailsLoadError } from "@/features/projects/use-project-details";
import { ApiError } from "@/lib/http/api-error";
import { cn } from "@/lib/utils/cn";

function getClientErrorMessage(error: ProjectDetailsLoadError): string {
  const cause = error.cause;

  if (!(cause instanceof ApiError)) {
    return "No fue posible consultar el cliente asociado.";
  }

  switch (cause.status) {
    case 0:
      return "No fue posible conectar con el servidor para cargar el cliente.";
    case 400:
      return "No fue posible consultar el cliente asociado.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes permiso para consultar el cliente asociado.";
    case 404:
      return "El cliente asociado ya no existe o no está disponible.";
    default:
      return "No fue posible consultar el cliente asociado.";
  }
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function ProjectClientSummary({
  projectId,
  client,
  error,
  isLoading,
  onRetry,
}: {
  projectId: string;
  client: ClientDetails | null;
  error: ProjectDetailsLoadError | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section
        aria-labelledby="project-client-title"
        className="p-5 sm:p-6"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="project-client-title"
              className="text-lg font-semibold text-foreground"
            >
              Cliente asociado
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Información del cliente vinculado a este proyecto.
            </p>
          </div>
          {client ? (
            <Link
              href={{
                pathname: `/clients/${encodeURIComponent(client.id)}`,
                query: { fromProjectId: projectId },
              }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              aria-label={`Ver cliente ${client.legalName}`}
            >
              Ver cliente
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div
            className="mt-5 flex items-center gap-3 text-sm text-foreground-secondary"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
            <p>Cargando cliente asociado...</p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-4"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-danger"
              size={20}
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-danger">
                {getClientErrorMessage(error)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onRetry}
              >
                Reintentar cliente
              </Button>
            </div>
          </div>
        ) : null}

        {client ? (
          <div className="mt-5 space-y-5">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <p className="break-words text-xl font-semibold text-foreground">
                  {client.legalName}
                </p>
                <Badge tone={client.isActive ? "success" : "neutral"} size="sm">
                  {formatProjectStatus(client.isActive)}
                </Badge>
              </div>
              {client.tradeName && client.tradeName !== client.legalName ? (
                <p className="mt-1 break-words text-sm text-foreground-secondary">
                  {client.tradeName}
                </p>
              ) : null}
            </div>

            <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <DetailLine
                label="Tipo de cliente"
                value={formatClientType(client.clientType)}
              />
              <DetailLine
                label="Documento"
                value={formatDocumentLabel(
                  client.documentType,
                  client.documentNumber,
                )}
              />
              <DetailLine
                label="Correo"
                value={formatNullableValue(client.email)}
              />
              <DetailLine
                label="Teléfono"
                value={formatNullableValue(client.phone)}
              />
              <DetailLine
                label="Dirección"
                value={formatNullableValue(client.address)}
              />
              <DetailLine
                label="Ciudad"
                value={formatNullableValue(client.city)}
              />
            </dl>
          </div>
        ) : null}
      </section>
    </Surface>
  );
}
