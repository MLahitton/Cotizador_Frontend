import {
  CalendarDays,
  ArrowRight,
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
    <li className="group/moment relative min-w-0 snap-start">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-5 h-0.5 w-[calc(100%+1rem)] bg-accent"
        >
          <ArrowRight size={14} className="absolute -right-1 -top-1.5 text-accent-dark" />
        </span>
      ) : null}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-accent-dark text-white shadow-sm transition-colors group-hover/moment:bg-brand group-focus-within/moment:bg-brand motion-reduce:transition-none">
        <span className="text-sm font-semibold tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div tabIndex={0} className="mt-4 min-w-0 rounded-md border border-border-subtle bg-surface px-4 py-3 shadow-sm transition duration-200 hover:border-accent hover:shadow-md focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-reduce:transition-none">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[#657A9B]">
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
    <div className="w-full max-w-[440px] rounded-md border border-[#8D9DB7]/35 bg-surface p-3 shadow-sm shadow-[#8D9DB7]/10">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9E3F0] text-[#657A9B] shadow-sm shadow-[#8D9DB7]/15">
          <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs leading-5 text-foreground-secondary sm:text-sm sm:leading-6">
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
          El recorrido de tu proyecto
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
          Conoce cada etapa que acompañará tu proyecto desde la aprobación hasta la entrega.
        </p>
      </div>

      <div className="min-w-0 space-y-5">
        <div role="region" aria-label="Recorrido del proyecto" tabIndex={0} className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-md px-1 py-3 snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-accent-dark">
          <ol className="grid auto-cols-[min(17rem,85%)] grid-flow-col items-start gap-6 sm:auto-cols-[18rem]">
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
        </div>

        <aside className="mx-auto grid w-full max-w-[896px] justify-items-center gap-4 sm:grid-cols-2">
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
