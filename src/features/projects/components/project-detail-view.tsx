import { ArrowLeft, Pencil, Power, PowerOff } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  formatDateTime,
  formatNullableValue,
  formatProjectStatus,
} from "@/features/projects/project-detail-formatters";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { cn } from "@/lib/utils/cn";

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

export function ProjectDetailView({
  project,
  clientSummary,
  successMessage,
  isActivationDisabled = false,
  isEditDisabled = false,
  isEditing = false,
  editForm,
  activationConfirmation,
  onRequestEdit,
  onRequestActivation,
}: {
  project: ProjectDetails;
  clientSummary: ReactNode;
  successMessage: string | null;
  isActivationDisabled?: boolean;
  isEditDisabled?: boolean;
  isEditing?: boolean;
  editForm?: ReactNode;
  activationConfirmation?: ReactNode;
  onRequestEdit: () => void;
  onRequestActivation: () => void;
}) {
  const activationLabel = project.isActive
    ? "Desactivar proyecto"
    : "Activar proyecto";
  const ActivationIcon = project.isActive ? PowerOff : Power;

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-4 w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a proyectos
          </Link>
          <Badge tone="brand">Proyectos</Badge>
          <p className="mt-4 break-words text-sm font-semibold uppercase text-foreground-secondary">
            {project.code}
          </p>
          <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="min-w-0 break-words text-2xl font-semibold text-foreground sm:text-3xl">
              {project.name}
            </h1>
            <Badge tone={project.isActive ? "success" : "neutral"} size="sm">
              {formatProjectStatus(project.isActive)}
            </Badge>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isEditDisabled || isEditing}
            className="w-full sm:w-auto"
            onClick={onRequestEdit}
          >
            <Pencil aria-hidden="true" size={17} strokeWidth={1.75} />
            Editar proyecto
          </Button>
          <Button
            type="button"
            variant={project.isActive ? "danger" : "primary"}
            disabled={isActivationDisabled}
            className="w-full sm:w-auto"
            onClick={onRequestActivation}
          >
            <ActivationIcon
              aria-hidden="true"
              size={17}
              strokeWidth={1.75}
            />
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

      {isEditing && editForm ? (
        editForm
      ) : (
        <Surface padding="none" className="min-w-0 overflow-hidden">
          <section
            aria-labelledby="project-detail-title"
            className="p-5 sm:p-6"
          >
            <h2
              id="project-detail-title"
              className="text-lg font-semibold text-foreground"
            >
              Información del proyecto
            </h2>
            <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <DetailField label="Código" value={project.code} />
              <DetailField label="Nombre" value={project.name} />
              <DetailField
                label="Ubicación"
                value={formatNullableValue(project.location)}
              />
              <DetailField
                label="Estado"
                value={formatProjectStatus(project.isActive)}
              />
              <DetailField
                label="Fecha de creación"
                value={formatDateTime(project.createdAtUtc)}
              />
              <DetailField
                label="Última actualización"
                value={formatDateTime(project.updatedAtUtc)}
              />
              <div className="min-w-0 md:col-span-2 xl:col-span-3">
                <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                  Descripción
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-foreground">
                  {formatNullableValue(project.description)}
                </dd>
              </div>
            </dl>
          </section>
        </Surface>
      )}

      {clientSummary}
    </div>
  );
}
