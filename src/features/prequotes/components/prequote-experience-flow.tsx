"use client";

import { ArrowLeft, ArrowRight, Calculator, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PreQuoteExperienceConfigureStep } from "@/features/prequotes/components/prequote-experience-configure-step";
import { PreQuoteExperienceContextStep } from "@/features/prequotes/components/prequote-experience-context-step";
import { PreQuoteExperienceMomentsStep } from "@/features/prequotes/components/prequote-experience-moments-step";
import { PreQuoteExperienceStepper, PREQUOTE_EXPERIENCE_STEPS, type PreQuoteExperienceStepId } from "@/features/prequotes/components/prequote-experience-stepper";
import { PreQuoteExperienceSummaryStep } from "@/features/prequotes/components/prequote-experience-summary-step";
import { PreQuotesError } from "@/features/prequotes/components/prequotes-status";
import { TechnicalProposalSummary } from "@/features/prequotes/components/technical-proposal-summary";
import { getTechnicalProposalSelectionConfirmationErrorMessage } from "@/features/prequotes/technical-proposal-selection-api";
import { getRequirementPricingErrorMessage } from "@/features/prequotes/requirement-pricing-api";
import { createDefaultExperienceDraft, mergeExperienceDraftWithItem } from "@/features/prequotes/prequote-experience-demo-config";
import type { ItemExperienceDraft, ItemExperienceDrafts } from "@/features/prequotes/prequote-experience-types";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { CreatedRequirement, CurrentRequirement } from "@/features/prequotes/requirement-types";

type TechnicalProposalSummaryProps = ComponentProps<typeof TechnicalProposalSummary>;

type StepHeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
};

type PreQuoteExperienceFlowProps = TechnicalProposalSummaryProps & {
  preQuoteDisplayName: string;
  requirement: CreatedRequirement | CurrentRequirement;
  pricingLoading: boolean;
  pricingError: unknown | null;
  pricingAfterSelectionError: boolean;
  pricingCancelMessage: string | null;
  confirmationLoading: boolean;
  confirmationError: unknown | null;
  onConfirmSelection: () => void | Promise<unknown>;
  onCalculatePricing: () => void | Promise<unknown>;
};

const STEP_HEADERS: Record<PreQuoteExperienceStepId, StepHeaderContent> = {
  context: {
    eyebrow: "01 · CONTEXTO",
    title: "Entendimos su proyecto",
    description: "Antes de configurar, revisamos la base comercial y los datos que todavia falta confirmar.",
  },
  moments: {
    eyebrow: "02 · MOMENTOS",
    title: "Momentos del proyecto",
    description: "Una lectura simple del avance actual y de lo que sigue para convertir el requerimiento en propuesta.",
  },
  configure: {
    eyebrow: "03 · CONFIGURAR",
    title: "Configuremos cada elemento",
    description: "Ajusta seleccion tecnica, experiencia por item y decisiones comerciales sin perder la informacion real existente.",
  },
  summary: {
    eyebrow: "04 · RESUMEN",
    title: "Asi quedo configurado su proyecto",
    description: "Una lectura global para conversar alcance, experiencia e inversion estimada con datos reales de pricing.",
  },
};

function nextStep(currentStep: PreQuoteExperienceStepId, canOpenSummary: boolean): PreQuoteExperienceStepId | null {
  const index = PREQUOTE_EXPERIENCE_STEPS.findIndex((step) => step.id === currentStep);
  const candidate = PREQUOTE_EXPERIENCE_STEPS[index + 1]?.id ?? null;
  if (candidate === "summary" && !canOpenSummary) return null;
  return candidate;
}

function previousStep(currentStep: PreQuoteExperienceStepId): PreQuoteExperienceStepId | null {
  const index = PREQUOTE_EXPERIENCE_STEPS.findIndex((step) => step.id === currentStep);
  return PREQUOTE_EXPERIENCE_STEPS[index - 1]?.id ?? null;
}

function hasUsablePricing(pricing: RequirementPricing | null, pricingLoading: boolean, pricingError: unknown | null): boolean {
  return Boolean(
    pricing &&
      !pricingLoading &&
      !pricingError &&
      pricing.isCompleteTotal &&
      pricing.pricedItemCount === pricing.itemCount &&
      pricing.estimatedSubtotal.expected !== null,
  );
}

function ConfigurationActionBlock({
  proposalConfirmed,
  canOpenSummary,
  pricing,
  pricingLoading,
  pricingError,
  pricingAfterSelectionError,
  pricingCancelMessage,
  confirmationLoading,
  confirmationError,
  isCommercialMutationBusy,
  onConfirmSelection,
  onCalculatePricing,
  onGoSummary,
}: {
  proposalConfirmed: boolean;
  canOpenSummary: boolean;
  pricing: RequirementPricing | null;
  pricingLoading: boolean;
  pricingError: unknown | null;
  pricingAfterSelectionError: boolean;
  pricingCancelMessage: string | null;
  confirmationLoading: boolean;
  confirmationError: unknown | null;
  isCommercialMutationBusy: boolean;
  onConfirmSelection: () => void | Promise<unknown>;
  onCalculatePricing: () => void | Promise<unknown>;
  onGoSummary: () => void;
}) {
  const hasPricing = Boolean(pricing);

  return (
    <Surface variant="elevated" padding="lg" className="border-brand/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-foreground-secondary">Configuracion del proyecto</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            {proposalConfirmed ? (hasPricing ? "Estimacion disponible" : "Configuraciones confirmadas") : "Lista para confirmar"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {proposalConfirmed
              ? hasPricing
                ? "Puedes actualizar la estimacion o ir al resumen comercial con el precio real disponible."
                : "Calcula precios para habilitar el resumen comercial."
              : "Confirma las configuraciones reales para habilitar el calculo de precios."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {!proposalConfirmed ? (
            <Button type="button" disabled={isCommercialMutationBusy} onClick={onConfirmSelection} className="w-full sm:w-auto">
              <CheckCircle2 aria-hidden="true" size={17} strokeWidth={1.75} />
              {confirmationLoading ? "Confirmando..." : "Confirmar configuraciones"}
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </Button>
          ) : (
            <>
              <Button type="button" disabled={isCommercialMutationBusy} onClick={onCalculatePricing} className="w-full sm:w-auto">
                <Calculator aria-hidden="true" size={17} strokeWidth={1.75} />
                {pricingLoading ? "Calculando precios..." : hasPricing ? "Actualizar estimacion" : "Calcular precios"}
              </Button>
              {canOpenSummary ? (
                <Button type="button" variant="secondary" onClick={onGoSummary} className="w-full sm:w-auto">
                  Ir al resumen
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {confirmationError ? (
        <div className="mt-4">
          <PreQuotesError
            title="No fue posible confirmar las configuraciones"
            message={getTechnicalProposalSelectionConfirmationErrorMessage(confirmationError)}
            onRetry={onConfirmSelection}
            retryLabel="Reintentar confirmacion"
          />
        </div>
      ) : null}

      {pricingCancelMessage ? (
        <div className="mt-4 rounded-sm border border-border-subtle bg-surface-subtle p-3">
          <p className="text-sm text-foreground-secondary">{pricingCancelMessage}</p>
        </div>
      ) : null}

      {pricingError ? (
        <div className="mt-4">
          <PreQuotesError
            title={pricingAfterSelectionError ? "Seleccion guardada; precios pendientes" : "No fue posible calcular los precios"}
            message={
              pricingAfterSelectionError
                ? "La configuracion se guardo correctamente, pero no fue posible actualizar sus precios. Puedes reintentar sin volver a guardar la seleccion."
                : getRequirementPricingErrorMessage(pricingError)
            }
            onRetry={onCalculatePricing}
            retryLabel={pricingAfterSelectionError ? "Reintentar precios" : undefined}
          />
        </div>
      ) : null}
    </Surface>
  );
}

export function PreQuoteExperienceFlow({
  preQuoteDisplayName,
  requirement,
  pricingLoading,
  pricingError,
  pricingAfterSelectionError,
  pricingCancelMessage,
  confirmationLoading,
  confirmationError,
  onConfirmSelection,
  onCalculatePricing,
  ...technicalProposalProps
}: PreQuoteExperienceFlowProps) {
  const [currentStep, setCurrentStep] = useState<PreQuoteExperienceStepId>("context");
  const [shouldOpenSummaryAfterPricing, setShouldOpenSummaryAfterPricing] = useState(false);
  const [experienceDrafts, setExperienceDrafts] = useState<ItemExperienceDrafts>(() =>
    Object.fromEntries(
      technicalProposalProps.proposal.items.map((item) => [
        item.itemId,
        createDefaultExperienceDraft(item),
      ]),
    ),
  );
  const effectiveExperienceDrafts = useMemo<ItemExperienceDrafts>(() =>
    Object.fromEntries(
      technicalProposalProps.proposal.items.map((item) => [
        item.itemId,
        mergeExperienceDraftWithItem(item, experienceDrafts[item.itemId]),
      ]),
    ),
  [experienceDrafts, technicalProposalProps.proposal.items]);
  const saveExperienceDraft = (draft: ItemExperienceDraft) => {
    setExperienceDrafts((current) => ({ ...current, [draft.itemId]: draft }));
  };
  const proposalConfirmed = technicalProposalProps.proposal.commercialConfirmation.state === "CONFIRMED";
  const pricingUsable = hasUsablePricing(technicalProposalProps.pricing, pricingLoading, pricingError);
  const canOpenSummary = proposalConfirmed && pricingUsable;
  const effectiveStep = currentStep === "summary" && !canOpenSummary ? "configure" : currentStep;
  const previous = previousStep(effectiveStep);
  const next = nextStep(effectiveStep, canOpenSummary);
  const header = STEP_HEADERS[effectiveStep];
  useEffect(() => {
    if (!shouldOpenSummaryAfterPricing || pricingLoading) return;

    const timeout = window.setTimeout(() => {
      if (canOpenSummary) {
        setCurrentStep("summary");
      }
      if (canOpenSummary || pricingError) {
        setShouldOpenSummaryAfterPricing(false);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [canOpenSummary, pricingError, pricingLoading, shouldOpenSummaryAfterPricing]);

  const calculatePricingAndOpenSummary = async () => {
    setShouldOpenSummaryAfterPricing(true);
    await onCalculatePricing();
  };

  const configurationAction = technicalProposalProps.readOnly ? null : (
    <ConfigurationActionBlock
      proposalConfirmed={proposalConfirmed}
      canOpenSummary={canOpenSummary}
      pricing={technicalProposalProps.pricing}
      pricingLoading={pricingLoading}
      pricingError={pricingError}
      pricingAfterSelectionError={pricingAfterSelectionError}
      pricingCancelMessage={pricingCancelMessage}
      confirmationLoading={confirmationLoading}
      confirmationError={confirmationError}
      isCommercialMutationBusy={technicalProposalProps.commercialMutationDisabled}
      onConfirmSelection={onConfirmSelection}
      onCalculatePricing={calculatePricingAndOpenSummary}
      onGoSummary={() => setCurrentStep("summary")}
    />
  );

  return (
    <section aria-labelledby="prequote-experience-title" className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.98fr)] lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{header.eyebrow}</p>
          <h2 id="prequote-experience-title" className="mt-2 break-words text-3xl font-semibold text-foreground sm:text-4xl">
            {header.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-secondary sm:text-base">{header.description}</p>
        </div>
        <PreQuoteExperienceStepper
          currentStep={effectiveStep}
          disabledSteps={{ summary: !canOpenSummary }}
          disabledReason="Confirma las configuraciones y calcula la estimacion para continuar."
          onStepChange={setCurrentStep}
        />
      </div>

      {effectiveStep === "context" ? (
        <PreQuoteExperienceContextStep
          preQuoteDisplayName={preQuoteDisplayName}
          requirement={requirement}
          proposal={technicalProposalProps.proposal}
          onConfirmContext={() => setCurrentStep("moments")}
        />
      ) : null}

      {effectiveStep === "moments" ? (
        <PreQuoteExperienceMomentsStep
          requirement={requirement}
          proposal={technicalProposalProps.proposal}
          onConfigure={() => setCurrentStep("configure")}
        />
      ) : null}

      {effectiveStep === "configure" ? (
        <PreQuoteExperienceConfigureStep
          {...technicalProposalProps}
          experienceDrafts={effectiveExperienceDrafts}
          onSaveExperienceDraft={saveExperienceDraft}
          finalAction={configurationAction}
        />
      ) : null}

      {effectiveStep === "summary" && canOpenSummary ? (
        <PreQuoteExperienceSummaryStep
          proposal={technicalProposalProps.proposal}
          pricing={technicalProposalProps.pricing}
          experienceDrafts={effectiveExperienceDrafts}
          onBackToConfigure={() => setCurrentStep("configure")}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={!previous}
          onClick={() => previous && setCurrentStep(previous)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Anterior
        </Button>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {!canOpenSummary && effectiveStep === "configure" ? (
            <span className="text-sm text-foreground-secondary">Resumen se habilita despues de confirmar y calcular.</span>
          ) : null}
          <Button
            type="button"
            disabled={!next}
            onClick={() => next && setCurrentStep(next)}
            className="w-full sm:w-auto"
          >
            Siguiente
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </section>
  );
}