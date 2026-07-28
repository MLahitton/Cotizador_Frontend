import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientDetails } from "@/features/clients/clients-types";
import { cn } from "@/lib/utils/cn";

const EMPTY_VALUE = "—";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatClientType(clientType: string): string {
  if (clientType === "Company") return "Empresa";
  if (clientType === "Person") return "Persona";
  return clientType || EMPTY_VALUE;
}

function formatDocumentType(documentType: string | null): string {
  if (documentType === "Nit") return "NIT";
  if (documentType === "CitizenshipCard") return "Cédula de ciudadanía";
  if (documentType === "ForeignerId") return "Cédula de extranjería";
  if (documentType === "Passport") return "Pasaporte";
  if (documentType === "Other") return "Otro";
  return EMPTY_VALUE;
}

function formatValue(value: string | null): string {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : EMPTY_VALUE;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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

function DetailSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-b border-border-subtle p-5 last:border-b-0 sm:p-6"
    >
      <h2
        id={id}
        className="text-sm font-semibold text-foreground"
      >
        {title}
      </h2>
      <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </dl>
    </section>
  );
}

export function ClientDetailsView({
  client,
  successMessage,
  isEditDisabled = false,
  isActivationDisabled = false,
  activationConfirmation,
  onEdit,
  onRequestActivation,
}: {
  client: ClientDetails;
  successMessage: string | null;
  isEditDisabled?: boolean;
  isActivationDisabled?: boolean;
  activationConfirmation?: ReactNode;
  onEdit: () => void;
  onRequestActivation: () => void;
}) {
  const activationLabel = client.isActive
    ? "Desactivar cliente"
    : "Activar cliente";

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/clients"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-4 w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a clientes
          </Link>
          <Badge tone="brand">Clientes</Badge>
          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="min-w-0 text-2xl font-semibold text-foreground sm:text-3xl">
              {client.legalName}
            </h1>
            <Badge tone={client.isActive ? "success" : "neutral"} size="sm">
              {client.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {client.tradeName ? (
            <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-foreground-secondary">
              {client.tradeName}
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isEditDisabled}
            className="w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil aria-hidden="true" size={17} strokeWidth={1.75} />
            Editar
          </Button>
          <Button
            type="button"
            variant={client.isActive ? "danger" : "primary"}
            disabled={isActivationDisabled}
            className="w-full sm:w-auto"
            onClick={onRequestActivation}
          >
            {activationLabel}
          </Button>
        </div>
      </header>

      {activationConfirmation}

      {successMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-sm border border-success bg-success-soft p-4 text-sm font-medium text-success"
        >
          {successMessage}
        </div>
      ) : null}

      <Surface padding="none" className="min-w-0 overflow-hidden">
        <DetailSection id="client-details-identification" title="Identificación">
          <DetailField
            label="Tipo de cliente"
            value={formatClientType(client.clientType)}
          />
          <DetailField
            label="Tipo de documento"
            value={formatDocumentType(client.documentType)}
          />
          <DetailField
            label="Número de documento"
            value={formatValue(client.documentNumber)}
          />
        </DetailSection>

        <DetailSection id="client-details-contact" title="Contacto">
          <DetailField label="Correo" value={formatValue(client.email)} />
          <DetailField label="Teléfono" value={formatValue(client.phone)} />
        </DetailSection>

        <DetailSection id="client-details-location" title="Ubicación">
          <DetailField label="Ciudad" value={formatValue(client.city)} />
          <DetailField label="Dirección" value={formatValue(client.address)} />
        </DetailSection>

        <DetailSection id="client-details-registry" title="Registro">
          <DetailField
            label="Fecha de creación"
            value={formatDate(client.createdAtUtc)}
          />
          <DetailField
            label="Última actualización"
            value={formatDate(client.updatedAtUtc)}
          />
        </DetailSection>
      </Surface>
    </div>
  );
}
