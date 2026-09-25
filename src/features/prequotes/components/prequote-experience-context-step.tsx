"use client";

import { ArrowRight, CircleAlert, Eye, MapPin, ShieldCheck, SunMedium, Thermometer, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { CreatedRequirement, CurrentRequirement } from "@/features/prequotes/requirement-types";
import { calculateProposalPhysicalTotals, formatProposalAreaM2 } from "@/features/prequotes/technical-proposal-formatters";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";

type ExperienceField<T> = {
  value: T;
  source: "real" | "derived" | "placeholder" | "pending";
};

const PLACEHOLDER_LOCATION: ExperienceField<string> = {
  value: "Ubicacion general pendiente",
  source: "placeholder",
};

const PRIORITIES = [
  { label: "Maxima vista", description: "Aberturas claras y lectura exterior limpia.", icon: Eye },
  { label: "Alta tranquilidad", description: "Decisiones que priorizan confort y control acustico.", icon: Volume2 },
  { label: "Confort termico", description: "Pendiente de validar orientacion y exposicion solar.", icon: Thermometer },
  { label: "Seguridad", description: "Criterio comercial para revisar antes de propuesta final.", icon: ShieldCheck },
];

const MISSING_CONTEXT: Array<{ label: string; field: ExperienceField<string> }> = [
  { label: "Orientacion", field: { value: "Por confirmar", source: "placeholder" } },
  { label: "Fecha necesidad", field: { value: "Por confirmar", source: "placeholder" } },
  { label: "Relacion exterior", field: { value: "Nivel por definir", source: "placeholder" } },
];

function SourceBadge({ source }: { source: ExperienceField<unknown>["source"] }) {
  const labels = {
    real: "Real",
    derived: "Derivado",
    pending: "Pendiente",
    placeholder: "Demo",
  } as const;

  const tones = {
    real: "success",
    derived: "brand",
    pending: "warning",
    placeholder: "neutral",
  } as const;

  return <Badge tone={tones[source]} size="sm">{labels[source]}</Badge>;
}

function formatCommercialLine(value: string | null): string {
  if (!value) return "Version no disponible";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function MiniMetric({ label, value, source }: { label: string; value: string | number; source: ExperienceField<unknown>["source"] }) {
  return (
    <div className="min-w-0 rounded-sm border border-border-subtle bg-surface p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 break-words text-lg font-semibold text-foreground">
        {value}
        <SourceBadge source={source} />
      </dd>
    </div>
  );
}

export function PreQuoteExperienceContextStep({
  preQuoteDisplayName,
  requirement,
  proposal,
  onConfirmContext,
}: {
  preQuoteDisplayName: string;
  requirement: CreatedRequirement | CurrentRequirement;
  proposal: TechnicalProposal;
  onConfirmContext: () => void;
}) {
  const includedItems = proposal.items.filter((item) => item.isIncluded);
  const totals = calculateProposalPhysicalTotals(includedItems);
  const commercialLine: ExperienceField<string> = {
    value: formatCommercialLine(requirement.commercialLine),
    source: requirement.commercialLine ? "real" : "pending",
  };

  return (
    <section aria-labelledby="experience-context-project" className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Surface variant="elevated" padding="lg" className="min-w-0">
          <div className="flex flex-col gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Proyecto del cliente</p>
              <h3 id="experience-context-project" className="mt-2 break-words text-3xl font-semibold text-foreground">
                {preQuoteDisplayName}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
                <MapPin aria-hidden="true" size={16} strokeWidth={1.75} />
                <span>{PLACEHOLDER_LOCATION.value}</span>
                <SourceBadge source={PLACEHOLDER_LOCATION.source} />
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetric label="Items" value={proposal.totalProposalItemCount} source="real" />
              <MiniMetric label="Area aprox." value={formatProposalAreaM2(totals.totalAreaM2)} source="derived" />
              <MiniMetric label="Review" value={proposal.itemsRequiringReview} source="real" />
              <MiniMetric label="Linea" value={commercialLine.value} source={commercialLine.source} />
            </dl>

            <div className="border-t border-border-subtle pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Prioridades que entendemos</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PRIORITIES.map((priority) => {
                  const Icon = priority.icon;
                  return (
                    <div key={priority.label} className="flex min-w-0 gap-3 rounded-sm border border-border-subtle bg-surface-subtle p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{priority.label}</p>
                        <p className="mt-1 text-sm leading-6 text-foreground-secondary">{priority.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Surface>

        <Surface variant="subtle" className="border-warning/50">
          <div className="flex items-start gap-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={20} strokeWidth={1.75} />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">Datos por confirmar</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                Informacion contextual pendiente. No bloquea la configuracion tecnica actual.
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3">
            {MISSING_CONTEXT.map(({ label, field }) => (
              <div key={label} className="flex min-w-0 items-start gap-3 rounded-sm border border-border-subtle bg-surface p-3">
                <SunMedium aria-hidden="true" className="mt-0.5 shrink-0 text-foreground-secondary" size={16} strokeWidth={1.75} />
                <div className="min-w-0">
                  <dt className="text-sm font-semibold text-foreground">{label}</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
                    {field.value}
                    <SourceBadge source={field.source} />
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-sm border border-border-subtle bg-brand-soft p-4">
            <p className="text-sm font-semibold text-foreground">Informacion clave</p>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              El siguiente paso organiza el momento comercial antes de entrar a cada elemento.
            </p>
          </div>
        </Surface>
      </div>

      <div className="flex justify-end">
        <Button type="button" className="w-full sm:w-auto" onClick={onConfirmContext}>
          Confirmar contexto
          <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
        </Button>
      </div>
    </section>
  );
}