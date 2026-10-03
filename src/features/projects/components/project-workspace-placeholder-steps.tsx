import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Factory,
  FileCheck2,
  FileSignature,
  Hammer,
  Headphones,
  Lock,
  Ruler,
  Truck,
  type LucideIcon,
  UserCheck,
} from "lucide-react";

import { Surface } from "@/components/ui/surface";

function PlaceholderStep({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Surface>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-secondary">
        {description}
      </p>
    </Surface>
  );
}

const projectMoments: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Legalización del proyecto",
    description: "Firma de contrato y condiciones.",
    Icon: FileSignature,
  },
  {
    title: "Asignación del equipo",
    description: "Residente y acompañamiento técnico.",
    Icon: UserCheck,
  },
  {
    title: "Programación de toma de medidas",
    description: "Coordinación en obra.",
    Icon: CalendarDays,
  },
  {
    title: "Toma de medidas",
    description: "Levantamiento técnico.",
    Icon: Ruler,
  },
  {
    title: "Acta de vanos",
    description: "Validación y firma.",
    Icon: ClipboardCheck,
  },
  {
    title: "Producción",
    description: "Fabricación de tus ventanas.",
    Icon: Factory,
  },
  {
    title: "Despacho",
    description: "Coordinación logística.",
    Icon: Truck,
  },
  {
    title: "Instalación",
    description: "Montaje en obra.",
    Icon: Hammer,
  },
  {
    title: "Acta de entrega",
    description: "Finalización y firma.",
    Icon: FileCheck2,
  },
  {
    title: "Postventa",
    description: "Acompañamiento y garantía.",
    Icon: Headphones,
  },
];

function ProjectMomentItem({
  index,
  title,
  description,
  Icon,
  isLast,
}: {
  index: number;
  title: string;
  description: string;
  Icon: LucideIcon;
  isLast: boolean;
}) {
  return (
    <li className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 pb-7 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-accent-soft-strong"
        />
      ) : null}
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-accent-soft-strong bg-accent-soft text-accent-dark">
        <span className="text-sm font-semibold tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="min-w-0 rounded-md border border-border-subtle bg-surface px-4 py-3 shadow-sm shadow-black/[0.02]">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              {description}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

function PlanningInfoCard({
  title,
  value,
  description,
  Icon,
}: {
  title: string;
  value: string;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4 shadow-sm shadow-black/[0.02]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
          <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectMomentsStep() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Los momentos de tu proyecto
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
          Conoce cómo llevamos tu proyecto desde la aprobación hasta la finalización.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.68fr)_minmax(20rem,0.32fr)]">
        <Surface className="min-w-0">
          <ol className="space-y-0">
            {projectMoments.map((moment, index) => (
              <ProjectMomentItem
                key={moment.title}
                index={index}
                title={moment.title}
                description={moment.description}
                Icon={moment.Icon}
                isLast={index === projectMoments.length - 1}
              />
            ))}
          </ol>
        </Surface>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <PlanningInfoCard
            title="Tu fecha requerida"
            value="Por definir"
            description="La fecha requerida se completará cuando la información de planificación esté disponible."
            Icon={CalendarDays}
          />
          <PlanningInfoCard
            title="Duración estimada"
            value="Por definir"
            description="El cronograma podrá variar según la complejidad del proyecto y la validación técnica."
            Icon={Clock3}
          />
        </aside>
      </div>
    </div>
  );
}

export function ProjectConfigurationStep() {
  return (
    <PlaceholderStep
      title="Configuracion de elementos"
      description="La nueva configuracion comercial se construira en una fase posterior."
    />
  );
}

export function ProjectDocumentsStep() {
  return (
    <PlaceholderStep
      title="Documentos del proyecto"
      description="La gestion de documentos se integrara aqui sin mover todavia el flujo actual."
    />
  );
}

export function ProjectSummaryStep() {
  return (
    <Surface variant="subtle">
      <div className="flex items-start gap-3">
        <Lock
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-foreground-secondary"
          size={20}
          strokeWidth={1.75}
        />
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Resumen bloqueado
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Disponible despues de confirmar la configuracion y calcular la
            propuesta.
          </p>
        </div>
      </div>
    </Surface>
  );
}