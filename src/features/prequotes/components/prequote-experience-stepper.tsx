"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type PreQuoteExperienceStepId = "context" | "moments" | "configure" | "summary";

export interface PreQuoteExperienceStep {
  id: PreQuoteExperienceStepId;
  label: string;
  description: string;
}

export const PREQUOTE_EXPERIENCE_STEPS: PreQuoteExperienceStep[] = [
  { id: "context", label: "Contexto", description: "Base" },
  { id: "moments", label: "Momentos", description: "Ruta" },
  { id: "configure", label: "Configurar", description: "Items" },
  { id: "summary", label: "Resumen", description: "Cierre" },
];

export function PreQuoteExperienceStepper({
  currentStep,
  disabledSteps = {},
  disabledReason,
  onStepChange,
}: {
  currentStep: PreQuoteExperienceStepId;
  disabledSteps?: Partial<Record<PreQuoteExperienceStepId, boolean>>;
  disabledReason?: string;
  onStepChange: (step: PreQuoteExperienceStepId) => void;
}) {
  const currentIndex = PREQUOTE_EXPERIENCE_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Flujo de precotizacion" className="min-w-0">
      <ol className="grid grid-cols-4 items-start gap-0">
        {PREQUOTE_EXPERIENCE_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = index < currentIndex;
          const isDisabled = Boolean(disabledSteps[step.id]);

          return (
            <li key={step.id} className="relative min-w-0">
              {index < PREQUOTE_EXPERIENCE_STEPS.length - 1 ? (
                <span className="absolute left-1/2 right-[-50%] top-4 h-px bg-border-subtle" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                disabled={isDisabled}
                title={isDisabled ? disabledReason : undefined}
                className={cn(
                  "relative z-10 flex w-full min-w-0 flex-col items-center gap-2 px-1 text-center transition",
                  isDisabled ? "cursor-not-allowed opacity-45" : "hover:text-brand",
                )}
                onClick={() => onStepChange(step.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={isDisabled && disabledReason ? `${step.label}. ${disabledReason}` : step.label}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-surface text-sm font-semibold",
                    isActive
                      ? "border-brand bg-brand text-white"
                      : isComplete
                        ? "border-success bg-success-soft text-success"
                        : "border-border text-foreground-secondary",
                  )}
                >
                  {isComplete ? <CheckCircle2 aria-hidden="true" size={17} strokeWidth={1.8} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">{step.label}</span>
                  <span className="mt-0.5 hidden break-words text-[11px] leading-4 text-foreground-secondary sm:block">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}