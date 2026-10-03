import { ArrowLeft, CalendarDays, MapPin, Pencil, Power, PowerOff } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import { formatProjectStatus } from "@/features/projects/project-detail-formatters";
import { cn } from "@/lib/utils/cn";

function displayClientName(workspace: ProjectWorkspace): string {
  return workspace.client.tradeName || workspace.client.legalName;
}

function formatWorkspaceDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectWorkspaceHeader({
  workspace,
  readOnly,
  userInitials,
  isEditDisabled,
  isActivationDisabled,
  onRequestEdit,
  onRequestActivation,
}: {
  workspace: ProjectWorkspace;
  readOnly: boolean;
  userInitials: string;
  isEditDisabled: boolean;
  isActivationDisabled: boolean;
  onRequestEdit: () => void;
  onRequestActivation: () => void;
}) {
  const activationLabel = workspace.project.isActive
    ? "Desactivar proyecto"
    : "Activar proyecto";
  const ActivationIcon = workspace.project.isActive ? PowerOff : Power;

  return (
    <header className="rounded-md border border-border-subtle bg-surface px-3 py-2.5 shadow-sm shadow-black/[0.02] sm:px-4">
      <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9 shrink-0",
            )}
            title="Volver a proyectos"
            aria-label="Volver a proyectos"
          >
            <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.75} />
          </Link>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="break-words text-lg font-semibold text-foreground sm:text-xl">
                {workspace.project.name}
              </h1>
              <Badge tone={workspace.project.isActive ? "success" : "neutral"} size="sm">
                {formatProjectStatus(workspace.project.isActive)}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-col gap-1 text-sm text-foreground-secondary md:flex-row md:flex-wrap md:items-center md:gap-3">
              <span className="font-medium text-foreground">
                {workspace.project.code}
              </span>
              {workspace.project.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" size={14} strokeWidth={1.75} />
                  {workspace.project.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden="true" size={14} strokeWidth={1.75} />
                Fecha: {formatWorkspaceDate(workspace.project.createdAtUtc)}
              </span>
              <span>{displayClientName(workspace)}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center xl:justify-end">
          {!readOnly ? (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isEditDisabled}
                className="h-8 w-full border border-accent bg-accent px-3 text-sm text-white hover:bg-accent-dark sm:w-auto"
                onClick={onRequestEdit}
              >
                <Pencil aria-hidden="true" size={15} strokeWidth={1.75} />
                Editar proyecto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActivationDisabled}
                className="h-8 w-full px-3 text-sm sm:w-auto"
                onClick={onRequestActivation}
              >
                <ActivationIcon aria-hidden="true" size={15} strokeWidth={1.75} />
                {activationLabel}
              </Button>
            </>
          ) : null}
          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-inverse text-sm font-semibold text-white sm:flex">
            {userInitials || "JD"}
          </span>
        </div>
      </div>
    </header>
  );
}