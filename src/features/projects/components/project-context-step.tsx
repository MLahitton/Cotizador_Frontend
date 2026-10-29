import {
  CalendarDays,
  CircleAlert,
  FileText,
  Palette,
  type LucideIcon,
  MapPin,
  Ruler,
  Shield,
  Shapes,
  Sparkles,
  Sun,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  calculateProposalPhysicalTotals,
  formatProposalAreaM2,
  formatProposalNumber,
} from "@/features/prequotes/technical-proposal-formatters";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import { formatPublicProjectType, formatPublicInstallationWindow } from "@/features/projects/project-public-context-formatters";
import { ProjectCodeRow } from "@/features/projects/components/project-code-row";
import { ProjectIdeaPhoto } from "@/features/projects/components/project-idea-photo";

interface ProjectContextMetrics {
  includedItems: number | null;
  structureCount: number | null;
  totalAreaM2: number | null;
}

function formatRequirementStatus(status: string | null): string {
  switch (status) {
    case "PENDING":
      return "Analisis pendiente";
    case "PROCESSING":
      return "Analisis en proceso";
    case "PROCESSED":
      return "Analisis completado";
    case "FAILED":
      return "Analisis no disponible";
    case "CANCELLED":
      return "Analisis cancelado";
    case "SUPERSEDED":
      return "Analisis reemplazado";
    default:
      return "Informacion pendiente";
  }
}

function getProjectContextMetrics(
  proposal: TechnicalProposal | null,
): ProjectContextMetrics {
  if (!proposal) {
    return {
      includedItems: null,
      structureCount: null,
      totalAreaM2: null,
    };
  }

  const includedItems = proposal.items.filter((item) => item.isIncluded);
  const totals = calculateProposalPhysicalTotals(includedItems);

  return {
    includedItems: includedItems.length,
    structureCount: totals.structureCount,
    totalAreaM2: totals.totalAreaM2,
  };
}

function DataPoint({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="min-w-0 px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
          <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
        </span>
        <p className="min-w-0 text-sm font-semibold text-foreground">
          {label}
        </p>
      </div>
      <p className="mt-2 min-w-0 break-words text-sm font-medium text-foreground-secondary">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  Icon,
  className = "",
}: {
  label: string;
  value: string;
  helper: string;
  Icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`rounded-md border border-border-subtle bg-surface p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-dark">
          <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPanel({
  workspace,
  proposal,
  isProposalLoading,
  hasProposalError,
  onRetryProposal,
}: {
  workspace: ProjectWorkspace;
  proposal: TechnicalProposal | null;
  isProposalLoading: boolean;
  hasProposalError: boolean;
  onRetryProposal: () => void;
}) {
  if (workspace.workflow.resolutionState === "AMBIGUOUS") {
    return (
      <div className="rounded-md border border-accent-soft-strong bg-accent-soft px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent-dark">
              <CircleAlert aria-hidden="true" size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Este proyecto proviene de un proceso anterior
              </h3>
              <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                Algunos datos pueden ser limitados o estar desactualizados. Te recomendamos validarlos con el cliente.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full bg-surface sm:w-auto">
            Ver detalles
          </Button>
        </div>
      </div>
    );
  }

  if (workspace.workflow.resolutionState === "EMPTY") {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3">
        <p className="text-sm leading-6 text-foreground-secondary">
          Aun no hay documentos procesados para este proyecto.
        </p>
      </div>
    );
  }

  if (!workspace.workflow.requirementId) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3">
        <p className="text-sm leading-6 text-foreground-secondary">
          El proyecto ya tiene un contexto interno, pero aun no hay un
          requerimiento procesado.
        </p>
      </div>
    );
  }

  if (!workspace.workflow.hasTechnicalProposal) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3">
        <p className="text-sm leading-6 text-foreground-secondary">
          {formatRequirementStatus(workspace.workflow.requirementStatus)}. La
          informacion comercial se mostrara cuando el analisis tenga una
          propuesta disponible.
        </p>
      </div>
    );
  }

  if (isProposalLoading) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3">
        <p className="text-sm text-foreground-secondary" role="status">
          Cargando metricas del proyecto...
        </p>
      </div>
    );
  }

  if (hasProposalError) {
    return (
      <div className="rounded-md border border-warning bg-surface px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-foreground-secondary">
            No fue posible cargar las metricas comerciales de la propuesta.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onRetryProposal}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return proposal ? null : null;
}

const priorityItems: Array<{
  label: string;
  Icon: LucideIcon;
}> = [
  {
    label: "Confort térmico",
    Icon: Sun,
  },
  {
    label: "Control acústico",
    Icon: Volume2,
  },
  {
    label: "Seguridad",
    Icon: Shield,
  },
  {
    label: "Protección UV",
    Icon: Sparkles,
  },
  {
    label: "Estética",
    Icon: Palette,
  },
];

function PriorityCard({ label, Icon, className = "" }: { label: string; Icon: LucideIcon; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center px-3 py-3 text-center sm:px-4 ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-soft-strong bg-accent-soft text-accent-dark">
        <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
      </span>
      <p className="mt-2 text-xs font-semibold text-foreground sm:text-sm">
        {label}
      </p>
    </div>
  );
}

export function ProjectContextStep({
  workspace,
  proposal,
  isProposalLoading,
  hasProposalError,
  onRetryProposal,
}: {
  workspace: ProjectWorkspace;
  proposal: TechnicalProposal | null;
  isProposalLoading: boolean;
  hasProposalError: boolean;
  onRetryProposal: () => void;
}) {
  const clientName = workspace.client.tradeName || workspace.client.legalName;
  const metrics = getProjectContextMetrics(proposal);
  const approximateArea =
    metrics.totalAreaM2 === null
      ? "Por definir"
      : formatProposalAreaM2(metrics.totalAreaM2);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="break-words text-2xl font-semibold text-foreground">
          {workspace.project.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">
          Resumen de la informacion recibida y el alcance identificado.
        </p>
      </div>

      <Surface padding="none" className="overflow-hidden">
        <ProjectIdeaPhoto key={workspace.project.id} projectId={workspace.project.id} />
        <div className="@container min-w-0 border-t border-border-subtle">
            <div className="grid grid-cols-1 gap-px bg-border-subtle [&>div]:bg-surface @[24rem]:grid-cols-2 @[40rem]:grid-cols-3 @[56rem]:grid-cols-5">
              <DataPoint
                label="Ubicacion"
                value={workspace.project.location || "Por definir"}
                Icon={MapPin}
              />
              <DataPoint
                label="Tipo de proyecto"
                value={formatPublicProjectType(workspace.publicContext?.projectType, workspace.publicContext?.projectTypeOther)}
                Icon={Sparkles}
              />
              <DataPoint
                label="Area aproximada"
                value={approximateArea}
                Icon={Ruler}
              />
              <DataPoint
                label="Instalacion estimada"
                value={formatPublicInstallationWindow(workspace.publicContext?.installationWindow)}
                Icon={CalendarDays}
              />
              <DataPoint
                label="Cliente"
                value={clientName}
                Icon={FileText}
              />
            </div>
        </div>
      </Surface>

      <StatusPanel
        workspace={workspace}
        proposal={proposal}
        isProposalLoading={isProposalLoading}
        hasProposalError={hasProposalError}
        onRetryProposal={onRetryProposal}
      />

      <section aria-labelledby="project-context-scope-title" className="space-y-3">
        <div>
          <h3
            id="project-context-scope-title"
            className="text-lg font-semibold text-foreground"
          >
            Alcance identificado
          </h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Resumen comercial calculado con la informacion vigente disponible.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          <MetricCard
            label="Items incluidos"
            value={
              metrics.includedItems === null
                ? "Pendiente"
                : formatProposalNumber(metrics.includedItems)
            }
            helper="Elementos vigentes en la propuesta"
            Icon={FileText}
          />
          <MetricCard
            label="Estructuras"
            value={
              metrics.structureCount === null
                ? "Pendiente"
                : formatProposalNumber(metrics.structureCount)
            }
            helper="Suma de unidades efectivas"
            Icon={Shapes}
          />
        </div>
      </section>

      <section
        aria-labelledby="project-context-priorities-title"
        className="space-y-3"
      >
        <div>
          <h3
            id="project-context-priorities-title"
            className="text-lg font-semibold text-foreground"
          >
            Lo que entendemos que debemos cuidar
          </h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Aquí verás las prioridades que el cliente haya indicado.
          </p>
        </div>
        <div className="overflow-hidden rounded-md border border-accent-soft-strong bg-surface">
          <div className="grid grid-cols-2 divide-y divide-accent-soft-strong md:grid-cols-5 md:divide-x md:divide-y-0">
            {priorityItems.map(({ label, Icon }, index) => (
              <PriorityCard
                key={label}
                label={label}
                Icon={Icon}
                className={index === 4 ? "col-span-2 md:col-span-1" : undefined}
              />
            ))}
          </div>
        </div>
      </section>
      <ProjectCodeRow key={workspace.project.id} code={workspace.project.code} />
    </div>
  );
}
