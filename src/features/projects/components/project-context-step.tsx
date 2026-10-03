import {
  CalendarDays,
  CircleAlert,
  FileText,
  ImageIcon,
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
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(7rem,auto)] items-center gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
          <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
        </span>
        <p className="min-w-0 text-sm font-semibold text-foreground">
          {label}
        </p>
      </div>
      <p className="min-w-0 break-words text-right text-sm font-medium text-foreground-secondary">
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
}: {
  label: string;
  value: string;
  helper: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4">
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

function ProjectImagePlaceholder() {
  return (
    <div className="relative flex min-h-[24rem] w-full min-w-0 max-w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--sng-color-accent-soft-strong),var(--sng-color-accent-soft)_48%,var(--sng-color-surface-muted))] p-6 lg:min-h-full">
      <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-white/45 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute inset-6 rounded-md border border-dashed border-accent/70" />
      <div className="relative z-10 flex max-w-sm flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white/55 text-accent-dark shadow-sm shadow-accent/10 backdrop-blur-sm">
          <ImageIcon aria-hidden="true" size={26} strokeWidth={1.75} />
        </span>
        <p className="mt-4 text-base font-semibold text-foreground">
          Imagen del proyecto
        </p>
        <p className="mt-1 max-w-60 text-sm leading-6 text-foreground-secondary">
          Aqui se mostrara la imagen principal del proyecto.
        </p>
      </div>
    </div>
  );
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

function PriorityCard({ label, Icon }: { label: string; Icon: LucideIcon }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center px-3 py-3 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-soft-strong bg-accent-soft text-accent-dark">
        <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
      </span>
      <p className="mt-2 text-xs font-semibold text-foreground sm:text-sm">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground-secondary">
        Por definir
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
        <h2 className="text-2xl font-semibold text-foreground">
          Contexto del proyecto
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">
          Resumen de la informacion recibida y nuestro analisis inicial.
        </p>
      </div>

      <Surface padding="none" className="overflow-hidden">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0"><ProjectImagePlaceholder /></div>
          <div className="min-w-0 overflow-hidden p-5 sm:p-6 lg:h-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-foreground">
                {clientName}
              </span>
              {workspace.client.city ? (
                <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-foreground-secondary">
                  {workspace.client.city}
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 break-words text-2xl font-semibold text-foreground">
              {workspace.project.name}
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-secondary">Proyecto residencial con contexto comercial pendiente de completar.</p>

            <div className="mt-5 divide-y divide-border-subtle">
              <DataPoint
                label="Ubicacion"
                value={workspace.project.location || "Por definir"}
                Icon={MapPin}
              />
              <DataPoint
                label="Tipo de inmueble"
                value="Por definir"
                Icon={Sparkles}
              />
              <DataPoint
                label="Area aproximada"
                value={approximateArea}
                Icon={Ruler}
              />
              <DataPoint
                label="Etapa actual"
                value="Por definir"
                Icon={Shapes}
              />
              <DataPoint
                label="Fecha requerida"
                value="Por definir"
                Icon={CalendarDays}
              />
              <DataPoint
                label="Cliente"
                value={clientName}
                Icon={FileText}
              />
            </div>
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
        <div className="grid gap-4 md:grid-cols-3">
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
          <MetricCard
            label="Area aproximada"
            value={approximateArea}
            helper="Calculada con medidas efectivas"
            Icon={Ruler}
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
            Estas prioridades se completaran cuando lleguen desde la experiencia externa.
          </p>
        </div>
        <div className="overflow-hidden rounded-md border border-accent-soft-strong bg-surface">
          <div className="grid grid-cols-2 divide-y divide-accent-soft-strong sm:grid-cols-3 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
            {priorityItems.map(({ label, Icon }) => (
              <PriorityCard key={label} label={label} Icon={Icon} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}