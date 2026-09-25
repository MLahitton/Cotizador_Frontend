"use client";

import { ArrowRight, CheckCircle2, Clock3, Circle, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { CreatedRequirement, CurrentRequirement } from "@/features/prequotes/requirement-types";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";

type MomentState = "complete" | "current" | "next";

const PLACEHOLDER_NEED_DATE = "Por confirmar";

function stateTone(state: MomentState): "success" | "brand" | "neutral" {
  if (state === "complete") return "success";
  if (state === "current") return "brand";
  return "neutral";
}

function markerClass(state: MomentState): string {
  if (state === "complete") return "border-success bg-success-soft text-success";
  if (state === "current") return "border-brand bg-brand text-white";
  return "border-border bg-surface text-foreground-secondary";
}

function stateLabel(state: MomentState): string {
  if (state === "complete") return "Completo";
  if (state === "current") return "Hoy";
  return "Siguiente";
}

function stateIcon(state: MomentState) {
  if (state === "complete") return <CheckCircle2 aria-hidden="true" size={18} strokeWidth={1.8} />;
  if (state === "current") return <Clock3 aria-hidden="true" size={18} strokeWidth={1.8} />;
  return <Circle aria-hidden="true" size={15} strokeWidth={1.8} />;
}

export function PreQuoteExperienceMomentsStep({
  requirement,
  proposal,
  onConfigure,
}: {
  requirement: CreatedRequirement | CurrentRequirement;
  proposal: TechnicalProposal;
  onConfigure: () => void;
}) {
  const isConfirmed = proposal.commercialConfirmation.state === "CONFIRMED";
  const isReadyForPricing = proposal.readiness.isReadyForPricing;
  const moments: Array<{ label: string; description: string; state: MomentState; meta: string }> = [
    { label: "Activacion", description: "Requirement creado y documentos asociados.", state: "complete", meta: requirement.createdAtUtc },
    { label: "Lectura", description: "Analisis tecnico disponible para revision.", state: "complete", meta: proposal.createdAtUtc },
    { label: "Configuracion", description: "Seleccion tecnica y experiencia comercial.", state: isConfirmed ? "complete" : "current", meta: isConfirmed ? "Confirmada" : "En curso" },
    { label: "Propuesta final", description: "Pricing y resumen para decision.", state: isReadyForPricing ? "current" : "next", meta: isReadyForPricing ? "Lista para precio" : "Depende de configuracion" },
    { label: "Cierre", description: "Revision final con el cliente.", state: "next", meta: PLACEHOLDER_NEED_DATE },
    { label: "Proyecto", description: "Transicion a ejecucion.", state: "next", meta: "Demo" },
  ];

  return (
    <section aria-labelledby="experience-moments-timeline" className="space-y-5">
      <Surface variant="elevated" padding="lg" className="overflow-hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Etapas del proyecto del cliente</p>
          <div id="experience-moments-timeline" className="mt-7 grid gap-5 lg:grid-cols-6 lg:gap-0">
            {moments.map((moment, index) => (
              <div key={moment.label} className="relative min-w-0 lg:px-3">
                {index < moments.length - 1 ? (
                  <div className="absolute left-4 top-10 h-[calc(100%+1.25rem)] w-px bg-border-subtle lg:left-[calc(50%+1rem)] lg:top-11 lg:h-px lg:w-[calc(100%-2rem)]" aria-hidden="true" />
                ) : null}
                <div className="relative flex gap-3 lg:flex-col lg:items-center lg:text-center">
                  <div className="min-w-0 pb-1 lg:min-h-[32px] lg:pb-0">
                    <Badge tone={stateTone(moment.state)} size="sm">{stateLabel(moment.state)}</Badge>
                  </div>
                  <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${markerClass(moment.state)}`}>
                    {stateIcon(moment.state)}
                  </span>
                  <div className="min-w-0 pb-4 lg:pb-0">
                    <h3 className="font-semibold text-foreground">{moment.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground-secondary">{moment.description}</p>
                    <p className="mt-2 break-words text-xs font-semibold uppercase text-foreground-secondary">{moment.meta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Surface variant="subtle">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Situacion del proyecto</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-border-subtle bg-surface p-4">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">Tiempo</dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">Por definir</dd>
            </div>
            <div className="rounded-sm border border-border-subtle bg-surface p-4">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">Estado</dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">{isConfirmed ? "Confirmado" : "En configuracion"}</dd>
            </div>
            <div className="rounded-sm border border-border-subtle bg-surface p-4">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">Lectura</dt>
              <dd className="mt-2 text-lg font-semibold text-foreground">A tiempo</dd>
            </div>
          </dl>
        </Surface>

        <Surface variant="elevated" padding="lg" className="border-brand/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Que sigue?</p>
          <p className="mt-3 text-sm leading-6 text-foreground-secondary">
            Revisar los elementos, ajustar decisiones tecnicas y confirmar configuraciones para pasar a pricing.
          </p>
          <Button type="button" className="mt-5 w-full" onClick={onConfigure}>
            Configurar
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
          </Button>
        </Surface>
      </div>

      <Surface variant="subtle" className="border-border-subtle">
        <div className="flex min-w-0 gap-3">
          <MessageSquareText aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={19} strokeWidth={1.75} />
          <p className="min-w-0 text-sm leading-6 text-foreground-secondary">
            <span className="font-semibold text-foreground">Lectura del sistema:</span> el flujo mantiene la seleccion tecnica, chat por item y pricing real; esta vista solo ordena el momento comercial.
          </p>
        </div>
      </Surface>
    </section>
  );
}