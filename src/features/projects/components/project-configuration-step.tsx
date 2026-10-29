"use client";

import { hasUncertainExtractedQuantity, isQuantityReviewReason } from "@/features/prequotes/quantity-provenance";

import { configurationBlockerMessage, isActionableConfigurationBlocker } from "@/features/projects/experience-configuration-copy";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import {
  confirmRequirementExperienceConfiguration,
  getRequirementExperienceConfiguration,
  getRequirementExperienceCatalog,
  getRequirementExperienceDrafts,
  getRequirementExperienceConfigurationErrorCode,
  updateRequirementExperienceDraft,
} from "@/features/prequotes/requirement-experience-api";
import { defaultDraftForItem, itemDraftFromServer } from "@/features/prequotes/prequote-experience-demo-config";
import type {
  ItemExperienceDraft,
  ItemExperienceDrafts,
  RequirementExperienceCatalog,
  RequirementExperienceConfigurationStatusResponse,
  RequirementExperienceConfigurationItemStatus,
  RequirementExperienceCatalogQuestion,
} from "@/features/prequotes/prequote-experience-types";
import {
  updateTechnicalProposalItemInclusion,
  type TechnicalProposalItemInclusionResponse,
} from "@/features/prequotes/technical-proposal-selection-api";
import {
  deriveDisplayTotalAreaM2,
  formatProposalAreaM2,
  formatProposalNumber,
  formatProposalQuantity,
} from "@/features/prequotes/technical-proposal-formatters";
import type {
  TechnicalProposal,
  TechnicalProposalItem,
} from "@/features/prequotes/technical-proposal-types";
import type { ProjectWorkspace } from "@/features/projects/project-workspace-types";
import { getConfigurationDraftFailure } from "@/features/projects/project-configuration-draft-error";
import { canConfirmConfiguration, hasPendingConfigurationChanges, type ConfigurationDraftStatus } from "@/features/projects/project-configuration-editing";
import { cn } from "@/lib/utils/cn";

const ITEMS_PER_PAGE = 4;

type ItemFilter = "all" | "complete" | "incomplete" | "excluded";
type DraftStatus = ConfigurationDraftStatus;
type ConfigurationStatusState = "idle" | "loading" | "success" | "error";

const filters: Array<{ id: ItemFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "complete", label: "Datos completos" },
  { id: "incomplete", label: "Datos pendientes" },
  { id: "excluded", label: "Excluidos" },
];

const missingFieldLabels: Record<string, string> = {
  QUANTITY: "Falta cantidad",
  WIDTH: "Falta ancho",
  HEIGHT: "Falta alto",
};

function formatConfirmationDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function configurationStatusCopy(
  configuration: RequirementExperienceConfigurationStatusResponse,
): {
  badge: string;
  title: string;
  description: string;
  actionLabel: string | null;
  badgeTone: "neutral" | "success" | "warning";
} {
  if (configuration.status === "CONFIRMED") {
    return {
      badge: "Confirmada",
      title: "Configuración confirmada",
      description: "La configuración guardada coincide con la última confirmación.",
      actionLabel: null,
      badgeTone: "success",
    };
  }

  if (configuration.status === "STALE") {
    return {
      badge: "Cambios posteriores a la confirmación",
      title: "Configuración modificada",
      description: "Hay cambios posteriores a la última configuración confirmada.",
      actionLabel: "Confirmar cambios",
      badgeTone: "warning",
    };
  }

  if (configuration.canConfirm) {
    return {
      badge: "Lista para confirmar",
      title: "Lista para confirmar",
      description: "La configuración guardada está lista para confirmar.",
      actionLabel: "Confirmar configuración",
      badgeTone: "success",
    };
  }

  return {
    badge: "Pendiente de confirmar",
    title: "Pendiente de confirmar",
    description: "Hay información pendiente de revisar antes de confirmar la configuración.",
    actionLabel: "Confirmar configuración",
    badgeTone: "neutral",
  };
}

function includedConfigurationItems(
  configuration: RequirementExperienceConfigurationStatusResponse,
): RequirementExperienceConfigurationItemStatus[] {
  return configuration.items
    .filter((item) => item.isIncluded)
    .sort((first, second) => {
      const firstSequence = first.sequence ?? Number.MAX_SAFE_INTEGER;
      const secondSequence = second.sequence ?? Number.MAX_SAFE_INTEGER;
      if (firstSequence !== secondSequence) return firstSequence - secondSequence;

      return itemDisplayLabel(first).localeCompare(itemDisplayLabel(second), "es");
    });
}

function itemDisplayLabel(item: RequirementExperienceConfigurationItemStatus): string {
  const reference = item.reference?.trim();
  if (reference) return reference;
  if (item.sequence !== null) return `Elemento ${item.sequence}`;
  return "Elemento";
}

function itemsWithBlockingReason(
  configuration: RequirementExperienceConfigurationStatusResponse,
  reason: string,
): RequirementExperienceConfigurationItemStatus[] {
  return includedConfigurationItems(configuration).filter((item) =>
    item.blockingReasons.includes(reason),
  );
}

function itemsWithAnyReviewReason(
  configuration: RequirementExperienceConfigurationStatusResponse,
): RequirementExperienceConfigurationItemStatus[] {
  return includedConfigurationItems(configuration).filter((item) =>
    item.reviewReasons.some((reason) => !isQuantityReviewReason(reason)),
  );
}

function hasFinishDependency(
  configuration: RequirementExperienceConfigurationStatusResponse,
): boolean {
  return includedConfigurationItems(configuration).some((item) =>
    item.blockingReasons.includes("FINISH_REQUIRED") ||
    item.blockingReasons.includes("FINISH_PENDING_EXTERNAL_SOURCE"),
  );
}

function answerCount(draft: ItemExperienceDraft, catalog: RequirementExperienceCatalog | null): number {
  if (!catalog) {
    return Object.keys(draft.answers).length;
  }

  return catalog.questions.filter((question) => Boolean(draft.answers[question.benefitCode])).length;
}

function formatLevel1State(
  draft: ItemExperienceDraft,
  catalog: RequirementExperienceCatalog | null,
): string {
  const resolution = draft.level1Resolution;
  if (resolution?.isComplete) {
    return "Prioridades definidas";
  }

  const answered = resolution?.answeredBenefits ?? answerCount(draft, catalog);
  const required = resolution?.requiredBenefits ?? catalog?.questions.length ?? 5;

  if (answered > 0) {
    return `${answered} de ${required} prioridades definidas`;
  }

  return "Prioridades pendientes";
}

function itemCompleteness(item: TechnicalProposalItem): "complete" | "incomplete" | "excluded" {
  if (!item.isIncluded) {
    return "excluded";
  }

  return item.dataCompleteness.isComplete ? "complete" : "incomplete";
}

function filterItems(items: TechnicalProposalItem[], filter: ItemFilter): TechnicalProposalItem[] {
  if (filter === "all") {
    return items;
  }

  return items.filter((item) => itemCompleteness(item) === filter);
}

function completenessCounts(items: TechnicalProposalItem[]): Record<ItemFilter, number> {
  return items.reduce<Record<ItemFilter, number>>(
    (counts, item) => {
      counts.all += 1;
      counts[itemCompleteness(item)] += 1;
      return counts;
    },
    { all: 0, complete: 0, incomplete: 0, excluded: 0 },
  );
}

function typeLabel(item: TechnicalProposalItem): string {
  return item.visualModel?.functionalType ??
    item.trace.functionalType ??
    item.elementType ??
    "Tipología por confirmar";
}

function displayLocation(item: TechnicalProposalItem): string {
  return item.effectiveLocation?.trim() || item.occurrenceContext?.trim() || "Ubicación por confirmar";
}

function displayMissingFields(item: TechnicalProposalItem): string[] {
  return item.dataCompleteness.missingFields
    .map((field) => missingFieldLabels[field])
    .filter((value): value is string => Boolean(value));
}

function DraftFeedback({
  status,
  error,
}: {
  status: DraftStatus;
  error: string | null;
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary">
        <Loader2 aria-hidden="true" size={14} className="animate-spin" />
        Guardando…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 aria-hidden="true" size={14} />
        Prioridades guardadas
      </span>
    );
  }

  if (status === "dirty") {
    return <span className="text-xs font-semibold text-warning">Cambios sin guardar</span>;
  }

  if (status === "conflict") {
    return <span className="text-xs font-semibold text-warning">{error ?? "Estas prioridades cambiaron. Vuelve a cargarlas antes de guardar de nuevo."}</span>;
  }

  if (status === "error") {
    return <span className="text-xs font-semibold text-danger">{error ?? "No fue posible guardar las prioridades."}</span>;
  }

  return null;
}

function isUvQuestion(question: RequirementExperienceCatalogQuestion): boolean {
  const optionCodes = question.options.map((option) => option.optionCode).sort().join("|");
  return optionCodes === "UV_NO|UV_YES";
}

function optionLabel(option: RequirementExperienceCatalogQuestion["options"][number]): string {
  return option.shortLabel?.trim() || option.optionLabel;
}

function PriorityLevelControl({
  question,
  selectedOptionCode,
  disabled,
  onSelect,
}: {
  question: RequirementExperienceCatalogQuestion;
  selectedOptionCode: string | undefined;
  disabled: boolean;
  onSelect: (optionCode: string) => void;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="relative w-full min-w-0 px-1 pt-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[0.875rem] h-0.5 rounded-full bg-[#8D9DB7]/55"
        />
        <div className="relative z-10 grid grid-cols-3 gap-0">
          {question.options.map((option) => {
            const isSelected = selectedOptionCode === option.optionCode;
            return (
              <button
                key={option.optionCode}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "group flex min-h-11 min-w-0 flex-col items-center gap-0.5 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-subtle sm:text-xs",
                  isSelected ? "text-foreground" : "hover:text-foreground",
                  disabled ? "cursor-not-allowed opacity-55" : "",
                )}
                onClick={() => onSelect(option.optionCode)}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border bg-surface transition-colors",
                    isSelected
                      ? "border-[#8D9DB7] bg-[#8D9DB7] shadow-sm shadow-[#8D9DB7]/25"
                      : "border-[#8D9DB7]/55 group-hover:border-[#657A9B]",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      isSelected ? "bg-white" : "bg-transparent group-hover:bg-[#8D9DB7]/35",
                    )}
                  />
                </span>
                <span className="max-w-full whitespace-normal break-words text-center">{optionLabel(option)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function UvToggleControl({
  question,
  selectedOptionCode,
  disabled,
  onSelect,
}: {
  question: RequirementExperienceCatalogQuestion;
  selectedOptionCode: string | undefined;
  disabled: boolean;
  onSelect: (optionCode: string) => void;
}) {
  const noOption = question.options.find((option) => option.optionCode === "UV_NO") ?? question.options[0];
  const yesOption = question.options.find((option) => option.optionCode === "UV_YES") ?? question.options[1];
  const options = [noOption, yesOption].filter((option): option is RequirementExperienceCatalogQuestion["options"][number] => Boolean(option));

  return (
    <div className="w-full min-w-0">
      <div className="relative w-full min-w-0 px-1 pt-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[0.875rem] h-0.5 rounded-full bg-[#8D9DB7]/55"
        />
        <div className="relative z-10 grid grid-cols-3 gap-0 [&>button:nth-child(2)]:col-start-3">
          {options.map((option) => {
            const isSelected = selectedOptionCode === option.optionCode;
            return (
              <button
                key={option.optionCode}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "group flex min-h-11 min-w-0 flex-col items-center gap-0.5 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-subtle sm:text-xs",
                  isSelected ? "text-foreground" : "hover:text-foreground",
                  disabled ? "cursor-not-allowed opacity-55" : "",
                )}
                onClick={() => onSelect(option.optionCode)}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border bg-surface transition-colors",
                    isSelected
                      ? "border-[#8D9DB7] bg-[#8D9DB7] shadow-sm shadow-[#8D9DB7]/25"
                      : "border-[#8D9DB7]/55 group-hover:border-[#657A9B]",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      isSelected ? "bg-white" : "bg-transparent group-hover:bg-[#8D9DB7]/35",
                    )}
                  />
                </span>
                <span className="max-w-full whitespace-normal break-words text-center">{optionLabel(option)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function ExperienceQuestionControl({
  question,
  selectedOptionCode,
  disabled,
  onSelect,
}: {
  question: RequirementExperienceCatalogQuestion;
  selectedOptionCode: string | undefined;
  disabled: boolean;
  onSelect: (optionCode: string) => void;
}) {
  return (
    <div className="grid min-w-0 content-start gap-0.5">
      <p className="min-w-0 text-sm font-semibold text-foreground-secondary md:text-xs">
        {question.label}
      </p>
      {isUvQuestion(question) ? (
        <UvToggleControl
          question={question}
          selectedOptionCode={selectedOptionCode}
          disabled={disabled}
          onSelect={onSelect}
        />
      ) : (
        <PriorityLevelControl
          question={question}
          selectedOptionCode={selectedOptionCode}
          disabled={disabled}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
export function ConfigurationItemCard({
  item,
  catalog,
  draft,
  status,
  error,
  inclusionError,
  inclusionBusy,
  readOnly,
  confirming,
  onDraftChange,
  onSaveDraft,
  onToggleInclusion,
  onOpenItem,
}: {
  item: TechnicalProposalItem;
  catalog: RequirementExperienceCatalog | null;
  draft: ItemExperienceDraft;
  status: DraftStatus;
  error: string | null;
  inclusionError: string | null;
  inclusionBusy: boolean;
  readOnly: boolean;
  confirming: boolean;
  onDraftChange: (draft: ItemExperienceDraft) => void;
  onSaveDraft: (draft: ItemExperienceDraft) => void;
  onToggleInclusion: (item: TechnicalProposalItem) => void;
  onOpenItem: (item: TechnicalProposalItem) => void;
}) {
  const totalArea = deriveDisplayTotalAreaM2(
    item.areaM2,
    item.effectiveWidthMm,
    item.effectiveHeightMm,
    item.effectiveQuantity,
  );
  const isExcluded = !item.isIncluded;
  const missingFields = displayMissingFields(item);
  const mutationDisabled = readOnly || confirming;
  const canSave = status === "dirty" && !isExcluded && !mutationDisabled;
  const dimensions = `${formatProposalNumber(item.effectiveWidthMm, " mm")} x ${formatProposalNumber(item.effectiveHeightMm, " mm")}`;
  const quantity = formatProposalQuantity(item.effectiveQuantity).replace("Cantidad: ", "");
  const itemTypeLabel = typeLabel(item);

  const updateAnswer = (benefitCode: string, optionCode: string) => {
    if (!catalog || isExcluded || mutationDisabled || status === "saving") {
      return;
    }

    onDraftChange({
      ...draft,
      catalogVersion: catalog.version,
      spaceTypeCode: null,
      level1Resolution: null,
      answers: {
        ...draft.answers,
        [benefitCode]: optionCode,
      },
    });
  };

  return (
    <Surface
      padding="none"
      className={cn(
        "@container overflow-hidden border-border-subtle",
        isExcluded ? "bg-surface-subtle opacity-80" : "bg-surface",
      )}
    >
      <div className="grid items-start gap-3 p-3 @[35rem]:grid-cols-[12rem_minmax(0,1fr)_2.5rem] @[56rem]:grid-cols-[13.5rem_minmax(0,1fr)_2.5rem]">
        <div className="min-w-0">
          <div className="rounded-md border border-[#8D9DB7]/25 bg-[#D9E3F0]/45 p-1">
            <div className="min-w-0 [&_figure]:space-y-1 [&_figcaption]:px-1 [&_svg]:h-40 [&_svg]:max-h-none [&>figure>div]:border-0 [&>figure>div]:bg-transparent [&>figure>div]:p-0 [&>figure>div]:shadow-none">
              <TechnicalProposalVisualPreview visualModel={item.visualModel} />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="shrink-0 rounded-full bg-[#D9E3F0] px-2.5 py-1 text-xs font-bold text-foreground">
                {item.reference || `Elemento ${item.sequence}`}
              </span>
              <h3 className="min-w-0 break-words text-base font-semibold text-foreground">
                {item.description || itemTypeLabel}
              </h3>
              {item.source === "MANUAL" ? <Badge tone="brand" size="sm">Manual</Badge> : null}
              {isExcluded ? <Badge tone="neutral" size="sm">Excluido</Badge> : null}
              <button
                type="button"
                aria-label={`Abrir detalle de ${item.reference || `elemento ${item.sequence}`}`}
                className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8D9DB7]/45 bg-[#D9E3F0] text-[#657A9B] transition-colors hover:border-[#657A9B] hover:bg-[#C9D6EA] hover:text-foreground @[35rem]:hidden"
                onClick={() => onOpenItem(item)}
              >
                <ChevronRight aria-hidden="true" size={17} />
              </button>
            </div>
          </div>

          <div className="grid gap-x-3 gap-y-1 text-sm @[35rem]:grid-cols-2 @[35rem]:text-xs @[70rem]:grid-cols-4 [&>p]:break-words">
            <p className="min-w-0 text-foreground-secondary">
              <span className="font-semibold text-foreground">Tipología: </span>
              <span className="whitespace-normal break-normal">{itemTypeLabel}</span>
            </p>
            <p className="min-w-0 text-foreground-secondary">
              <span className="font-semibold text-foreground">Medidas: </span>
              <span>{dimensions}</span>
            </p>
            <p className="min-w-0 text-foreground-secondary">
              <span className="font-semibold text-foreground">Cantidad: </span>
              <span>{quantity}</span>
              {item.quantitySource === "ASSUMED_DEFAULT" ? <span className="ml-2 inline-block"><Badge tone="warning" size="sm">Cantidad asumida</Badge></span> : null}
              {hasUncertainExtractedQuantity(item) ? <span className="ml-2 inline-block"><Badge tone="warning" size="sm">Cantidad por verificar</Badge></span> : null}
            </p>
            <p className="min-w-0 text-foreground-secondary">
              <span className="font-semibold text-foreground">Área total: </span>
              <span>{formatProposalAreaM2(totalArea)}</span>
            </p>
          </div>

          <p className="flex min-w-0 items-center gap-1.5 text-xs text-foreground-secondary">
            <MapPin aria-hidden="true" size={13} className="shrink-0 text-[#657A9B]" />
            <span className="min-w-0 break-words">{displayLocation(item)}</span>
          </p>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={item.dataCompleteness.isComplete ? "success" : "warning"} size="sm">
                {item.dataCompleteness.isComplete ? "Datos completos" : "Datos pendientes"}
              </Badge>
              <Badge tone="neutral" size="sm">
                {formatLevel1State(draft, catalog)}
              </Badge>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label={`Abrir detalle de ${item.reference || `elemento ${item.sequence}`}`}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8D9DB7]/45 bg-[#D9E3F0] text-[#657A9B] transition-colors hover:border-[#657A9B] hover:bg-[#C9D6EA] hover:text-foreground @[35rem]:flex"
          onClick={() => onOpenItem(item)}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="min-w-0 border-t border-[#C4D2E6] bg-[#EAF1FB] px-3 py-2">
        <div className="grid items-start gap-x-5 gap-y-2 @[30rem]:grid-cols-2 @[48rem]:grid-cols-3">
          {catalog?.questions.length ? (
            <>
              {catalog.questions.map((question) => (
                <ExperienceQuestionControl
                  key={question.benefitCode}
                  question={question}
                  selectedOptionCode={draft.answers[question.benefitCode]}
                  disabled={isExcluded || status === "saving" || mutationDisabled}
                  onSelect={(optionCode) => updateAnswer(question.benefitCode, optionCode)}
                />
              ))}
            </>
          ) : (
            <div className="text-sm text-foreground-secondary">
              Las prioridades no están disponibles en este momento.
            </div>
          )}

          <div className="min-w-0 space-y-1.5 self-end @[30rem]:col-span-2 @[48rem]:col-span-1" role="group" aria-label="Acciones y estado del elemento">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <Button
                type="button"
                variant={item.isIncluded ? "outline" : "secondary"}
                size="sm"
                disabled={inclusionBusy || mutationDisabled || status === "saving"}
                onClick={() => { if (!mutationDisabled) onToggleInclusion(item); }}
              >
                {inclusionBusy ? "Guardando…" : item.isIncluded ? "Excluir" : "Volver a incluir"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSave}
                onClick={() => { if (canSave) onSaveDraft(draft); }}
              >
                {status === "saving" ? "Guardando…" : "Guardar prioridades"}
              </Button>
            </div>
            <div className="min-w-0 break-words" aria-live="polite">
              <DraftFeedback status={status} error={error} />
              {readOnly ? <p className="text-xs text-foreground-secondary">Solo lectura</p> : null}
              {!item.dataCompleteness.isComplete ? (
                <div className="flex flex-wrap gap-1.5">
                  {(missingFields.length > 0 ? missingFields : ["Hay datos pendientes de revisar"]).map((field) => (
                    <span
                      key={field}
                      className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              ) : null}
              {inclusionError ? (
                <p className="mt-1 text-xs font-semibold text-danger">
                  {inclusionError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function ConfigurationEmptyState() {
  return (
    <Surface variant="subtle">
      <p className="text-sm font-semibold text-foreground">
        No hay elementos disponibles para configurar.
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground-secondary">
        Cuando los elementos estén disponibles, podrás configurar sus prioridades aquí.
      </p>
    </Surface>
  );
}

function ConfigurationAvailabilityState({
  title,
  message,
  tone = "neutral",
  onRetry,
}: {
  title: string;
  message: string;
  tone?: "neutral" | "warning";
  onRetry?: () => void;
}) {
  return (
    <Surface
      variant="subtle"
      className={tone === "warning" ? "border-warning bg-warning-soft" : ""}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            tone === "warning"
              ? "bg-surface text-warning"
              : "bg-accent-soft text-accent-dark",
          )}
        >
          <AlertCircle aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {message}
          </p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 bg-surface"
              onClick={onRetry}
            >
              Volver a cargar
            </Button>
          ) : null}
        </div>
      </div>
    </Surface>
  );
}

function ConfigurationItemLinks({
  items,
  projectId,
}: {
  items: RequirementExperienceConfigurationItemStatus[];
  projectId: string;
}) {
  if (items.length === 0) return null;

  if (items.length > 5) {
    return (
      <p className="mt-2 text-sm text-foreground-secondary">
        {items.length} elementos requieren atención. Usa la lista de configuración para revisarlos por referencia.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Elementos con cantidad pendiente">
      {items.map((item) => (
        <Link
          key={item.technicalProposalItemId}
          href={`/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(item.technicalProposalItemId)}`}
          className="inline-flex min-h-9 items-center rounded-full border border-[#C4D2E6] bg-[#EAF1FB] px-3 text-sm font-semibold text-foreground transition hover:border-[#657A9B] hover:bg-[#D9E3F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657A9B]"
        >
          {itemDisplayLabel(item)}
        </Link>
      ))}
    </div>
  );
}

function ConfigurationPendingRow({
  tone,
  title,
  count,
  countLabel,
  description,
  children,
}: {
  tone: "action" | "process" | "review";
  title: string;
  count?: number;
  countLabel?: string;
  description: string;
  children?: ReactNode;
}) {
  const markerClassName = tone === "action"
    ? "bg-warning"
    : tone === "review"
      ? "bg-[#657A9B]"
      : "bg-[#8D9DB7]";

  return (
    <div className="rounded-md border border-border-subtle bg-surface p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-2">
          <span aria-hidden="true" className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", markerClassName)} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">{description}</p>
          </div>
        </div>
        {typeof count === "number" ? (
          <span className="shrink-0 text-sm font-semibold text-foreground-secondary">
            {count} {countLabel ?? (count === 1 ? "elemento" : "elementos")}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ExperienceConfigurationConfirmationPanel({
  projectId,
  configuration,
  state,
  confirming,
  notice,
  error,
  onConfirm,
  onRetry,
  readOnly,
  hasPendingChanges,
  confirmationAllowed,
}: {
  projectId: string;
  configuration: RequirementExperienceConfigurationStatusResponse | null;
  state: ConfigurationStatusState;
  confirming: boolean;
  notice: string | null;
  error: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  readOnly: boolean;
  hasPendingChanges: boolean;
  confirmationAllowed: boolean;
}) {
  if (state === "loading" || state === "idle") {
    return (
      <Surface className="border-[#C4D2E6] bg-[#EAF1FB]/70" aria-busy="true">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground-secondary">
          <Loader2 aria-hidden="true" size={18} className="animate-spin text-[#657A9B]" />
          Consultando estado de configuración…
        </div>
      </Surface>
    );
  }

  if (state === "error" || !configuration) {
    return (
      <Surface className="border-warning bg-warning-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-warning">
              <AlertCircle aria-hidden="true" size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                No fue posible consultar el estado de la configuración.
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                Puedes seguir revisando los elementos y volver a consultar el estado cuando lo necesites.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="bg-surface" onClick={onRetry}>
            Consultar estado
          </Button>
        </div>
      </Surface>
    );
  }

  const copy = configurationStatusCopy(configuration);
  const quantityPendingItems = itemsWithBlockingReason(configuration, "QUANTITY_REQUIRED");
  const quantityReviewItems = includedConfigurationItems(configuration).filter((item) =>
    item.reviewReasons.some(isQuantityReviewReason),
  );
  const glassPendingItems = itemsWithBlockingReason(configuration, "GLASS_REQUIRED");
  const reviewItems = itemsWithAnyReviewReason(configuration);
  const finishPending = hasFinishDependency(configuration);
  const additionalReasons = [...new Set([
    ...configuration.blockingReasons,
    ...includedConfigurationItems(configuration).flatMap((item) => item.blockingReasons),
  ])].filter((reason) => !["QUANTITY_REQUIRED", "GLASS_REQUIRED", "FINISH_REQUIRED", "FINISH_PENDING_EXTERNAL_SOURCE"].includes(reason) ||
    itemsWithBlockingReason(configuration, reason).length === 0);
  const hasActionablePending = quantityPendingItems.length > 0;
  const hasProcessDependencies = glassPendingItems.length > 0 || finishPending;
  const hasReviews = reviewItems.length > 0;
  const showBeforeConfirmDetails = configuration.status !== "CONFIRMED" &&
    (hasActionablePending || hasProcessDependencies || additionalReasons.length > 0);
  const confirmedDate = formatConfirmationDate(configuration.confirmedAtUtc);
  const showAction = Boolean(copy.actionLabel);
  const actionDisabled = !confirmationAllowed;

  return (
    <Surface className="border-[#C4D2E6] bg-[#EAF1FB]/70">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={copy.badgeTone} size="sm">
              {copy.badge}
            </Badge>
            {configuration.latestConfirmationRevision ? (
              <Badge tone="neutral" size="sm">
                Revisión {configuration.latestConfirmationRevision}
              </Badge>
            ) : null}
            {confirmedDate ? (
              <span className="text-xs font-semibold text-foreground-secondary">
                {confirmedDate}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            {copy.title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {copy.description}
          </p>
          {configuration.confirmedByUserId && configuration.status === "CONFIRMED" ? (
            <p className="mt-1 text-xs font-semibold text-foreground-secondary">
              Confirmación registrada.
            </p>
          ) : null}
        </div>

        {showAction && !readOnly ? (
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <Button
              type="button"
              disabled={actionDisabled}
              onClick={onConfirm}
              aria-describedby={hasPendingChanges ? "experience-configuration-unsaved" : !configuration.canConfirm ? "experience-configuration-blockers" : undefined}
            >
              {confirming ? "Confirmando..." : copy.actionLabel}
            </Button>
            {!configuration.canConfirm ? (
              <span className="text-xs font-semibold text-foreground-secondary">
                Resuelve los pendientes para habilitar la confirmación.
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {readOnly ? <p className="mt-3 text-sm text-foreground-secondary">Solo lectura</p> : null}
      {hasPendingChanges ? (
        <p id="experience-configuration-unsaved" role="status" className="mt-3 text-sm font-semibold text-warning">
          Hay cambios locales pendientes de guardar. La confirmación corresponde a los datos guardados; guarda las prioridades pendientes antes de confirmar.
        </p>
      ) : null}

      {showBeforeConfirmDetails ? (
        <div id="experience-configuration-blockers" className="mt-4 rounded-md border border-warning/30 bg-warning-soft/60 p-3">
          <p className="text-sm font-semibold text-foreground">Antes de confirmar</p>
          <div className="mt-3 grid gap-3">
            {additionalReasons.map((reason) => {
              const items = itemsWithBlockingReason(configuration, reason);
              const actionable = isActionableConfigurationBlocker(reason);
              return <ConfigurationPendingRow key={reason} tone={actionable ? "action" : "process"} title={configurationBlockerMessage(reason)} description={actionable ? "Abre el elemento para revisar su configuración." : "Esta definición debe resolverse antes de confirmar."}>
                {actionable && items.length > 0 ? <ConfigurationItemLinks items={items} projectId={projectId} /> : null}
              </ConfigurationPendingRow>;
            })}
            {quantityPendingItems.length > 0 ? (
              <ConfigurationPendingRow
                tone="action"
                title="Cantidad pendiente"
                count={quantityPendingItems.length}
                description={`${quantityPendingItems.length === 1 ? "Un elemento necesita" : `${quantityPendingItems.length} elementos necesitan`} completar su cantidad.`}
              >
                <ConfigurationItemLinks items={quantityPendingItems} projectId={projectId} />
              </ConfigurationPendingRow>
            ) : null}

            {glassPendingItems.length > 0 ? (
              <ConfigurationPendingRow
                tone="process"
                title="Vidrio pendiente"
                count={glassPendingItems.length}
                description={
                  glassPendingItems.length === includedConfigurationItems(configuration).length
                    ? "El vidrio todavía está pendiente de definición para los elementos del proyecto."
                    : "La definición del vidrio continúa pendiente para algunos elementos del proyecto."
                }
              />
            ) : null}

            {finishPending ? (
              <ConfigurationPendingRow
                tone="process"
                title="Acabado pendiente"
                description="El acabado está pendiente de definición."
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {quantityReviewItems.length > 0 ? (
        <div className="mt-3 rounded-md border border-warning/30 bg-surface p-3">
          <ConfigurationPendingRow
            tone="action"
            title="Cantidad por verificar"
            count={quantityReviewItems.length}
            description="Estos elementos tienen una cantidad asumida o identificada con incertidumbre. Confirma su cantidad si es necesario."
          >
            <ConfigurationItemLinks items={quantityReviewItems} projectId={projectId} />
          </ConfigurationPendingRow>
        </div>
      ) : null}

      {hasReviews ? (
        <div className="mt-3 rounded-md border border-[#C4D2E6] bg-surface p-3">
          <p className="text-sm font-semibold text-foreground">
            Revisión técnica
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Hay {reviewItems.length === 1 ? "un elemento cuya definición técnica requiere" : `${reviewItems.length} elementos cuya definición técnica requiere`} revisión. Esto no cambia por sí solo la disponibilidad de confirmación.
          </p>
          {reviewItems.length <= 5 ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Elementos con revisión técnica">
              {reviewItems.map((item) => (
                <span
                  key={item.technicalProposalItemId}
                  className="inline-flex min-h-8 items-center rounded-full border border-[#C4D2E6] bg-[#EAF1FB]/70 px-3 text-xs font-semibold text-foreground-secondary"
                >
                  {itemDisplayLabel(item)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <p role="status" className="mt-3 text-sm font-semibold text-success">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </Surface>
  );
}

function isProcessingRequirement(status: string | null): boolean {
  return status === "PROCESSING";
}

export function ProjectConfigurationStep({
  workspace,
  proposal,
  isProposalLoading,
  hasProposalError,
  onRetryProposal,
  onItemInclusionUpdated,
  readOnly,
}: {
  workspace: ProjectWorkspace;
  proposal: TechnicalProposal | null;
  isProposalLoading: boolean;
  hasProposalError: boolean;
  onRetryProposal: () => void;
  onItemInclusionUpdated: (update: TechnicalProposalItemInclusionResponse) => void;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<RequirementExperienceCatalog | null>(null);
  const [catalogRetryKey, setCatalogRetryKey] = useState(0);
  const [drafts, setDrafts] = useState<ItemExperienceDrafts>({});
  const [catalogState, setCatalogState] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [draftsState, setDraftsState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statuses, setStatuses] = useState<Record<string, DraftStatus>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [inclusionBusy, setInclusionBusy] = useState<Record<string, boolean>>({});
  const [inclusionErrors, setInclusionErrors] = useState<Record<string, string | null>>({});
  const [configurationStatus, setConfigurationStatus] =
    useState<RequirementExperienceConfigurationStatusResponse | null>(null);
  const [configurationState, setConfigurationState] = useState<ConfigurationStatusState>("idle");
  const [configurationConfirming, setConfigurationConfirming] = useState(false);
  const [configurationNotice, setConfigurationNotice] = useState<string | null>(null);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [page, setPage] = useState(0);

  const technicalProposalId = proposal?.technicalProposalId ?? workspace.workflow.technicalProposalId;
  const requirementId = proposal?.requirementId ?? workspace.workflow.requirementId;
  const shouldLoadExperienceData = Boolean(proposal && technicalProposalId && requirementId);
  const hasPendingChanges = hasPendingConfigurationChanges(statuses);
  const confirmationAllowed = canConfirmConfiguration({
    readOnly,
    confirming: configurationConfirming,
    hasPendingChanges,
    inclusionBusy: Object.values(inclusionBusy).some(Boolean),
    dataReady: catalogState === "success" && draftsState === "success" && configurationState === "success",
    canConfirm: configurationStatus?.canConfirm ?? false,
  });

  useEffect(() => {
    if (!shouldLoadExperienceData) {
      queueMicrotask(() => {
        setCatalog(null);
        setCatalogState("idle");
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setCatalogState("loading");
      }
    });
    void getRequirementExperienceCatalog()
      .then((response) => {
        if (!cancelled) {
          setCatalog(response);
          setCatalogState("success");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoadExperienceData, catalogRetryKey]);

  const loadDrafts = useCallback(() => {
    if (!shouldLoadExperienceData || !technicalProposalId) {
      setDrafts({});
      setDraftsState("idle");
      return;
    }

    setDraftsState("loading");
    void getRequirementExperienceDrafts(technicalProposalId)
      .then((response) => {
        setDrafts(
          Object.fromEntries(
            response.items.map((draft) => [
              draft.technicalProposalItemId,
              itemDraftFromServer(draft),
            ]),
          ),
        );
        setStatuses({});
        setErrors({});
        setDraftsState("success");
      })
      .catch(() => {
        setDraftsState("error");
      });
  }, [shouldLoadExperienceData, technicalProposalId]);

  useEffect(() => {
    queueMicrotask(() => {
      loadDrafts();
    });
  }, [loadDrafts]);

  const loadConfigurationStatus = useCallback(async () => {
    if (!shouldLoadExperienceData || !technicalProposalId) {
      setConfigurationStatus(null);
      setConfigurationState("idle");
      setConfigurationNotice(null);
      setConfigurationError(null);
      return;
    }

    setConfigurationState("loading");
    setConfigurationError(null);
    try {
      const response = await getRequirementExperienceConfiguration(technicalProposalId);
      setConfigurationStatus(response);
      setConfigurationState("success");
    } catch {
      setConfigurationState("error");
    }
  }, [shouldLoadExperienceData, technicalProposalId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadConfigurationStatus();
    });
  }, [loadConfigurationStatus]);

  const counts = useMemo(
    () => completenessCounts(proposal?.items ?? []),
    [proposal?.items],
  );
  const filteredItems = useMemo(
    () => filterItems(proposal?.items ?? [], filter),
    [filter, proposal?.items],
  );
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * ITEMS_PER_PAGE;
  const visibleItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const changeDraft = useCallback((draft: ItemExperienceDraft) => {
    if (readOnly || configurationConfirming) return;
    setDrafts((current) => ({
      ...current,
      [draft.itemId]: draft,
    }));
    setStatuses((current) => ({
      ...current,
      [draft.itemId]: "dirty",
    }));
    setErrors((current) => ({
      ...current,
      [draft.itemId]: null,
    }));
  }, [readOnly, configurationConfirming]);

  const saveDraft = useCallback(async (draft: ItemExperienceDraft) => {
    if (readOnly || configurationConfirming || !technicalProposalId || !catalog) {
      return;
    }

    setStatuses((current) => ({ ...current, [draft.itemId]: "saving" }));
    setErrors((current) => ({ ...current, [draft.itemId]: null }));

    try {
      const response = await updateRequirementExperienceDraft(
        technicalProposalId,
        draft.itemId,
        {
          catalogVersion: catalog.version,
          spaceTypeCode: null,
          expectedRevision: draft.revision,
          answers: Object.entries(draft.answers).map(([benefitCode, optionCode]) => ({
            benefitCode,
            optionCode,
          })),
        },
      );
      setDrafts((current) => ({
        ...current,
        [response.technicalProposalItemId]: itemDraftFromServer(response),
      }));
      setStatuses((current) => ({ ...current, [draft.itemId]: "saved" }));
      void loadConfigurationStatus();
    } catch (error: unknown) {
      const failure = getConfigurationDraftFailure(error);
      setStatuses((current) => ({
        ...current,
        [draft.itemId]: failure.status,
      }));
      setErrors((current) => ({ ...current, [draft.itemId]: failure.message }));
    }
  }, [catalog, loadConfigurationStatus, technicalProposalId, readOnly, configurationConfirming]);

  const openItem = useCallback((item: TechnicalProposalItem) => {
    router.push(`/projects/${encodeURIComponent(workspace.project.id)}/items/${encodeURIComponent(item.itemId)}`);
  }, [router, workspace.project.id]);

  const toggleInclusion = useCallback(async (item: TechnicalProposalItem) => {
    if (readOnly || configurationConfirming || !requirementId) {
      return;
    }

    setInclusionBusy((current) => ({ ...current, [item.itemId]: true }));
    setInclusionErrors((current) => ({ ...current, [item.itemId]: null }));
    try {
      const response = await updateTechnicalProposalItemInclusion(
        requirementId,
        item.itemId,
        { isIncluded: !item.isIncluded, reason: null },
      );
      onItemInclusionUpdated(response);
      void loadConfigurationStatus();
    } catch {
      setInclusionErrors((current) => ({
        ...current,
        [item.itemId]: "No fue posible actualizar la inclusión del elemento.",
      }));
    } finally {
      setInclusionBusy((current) => ({ ...current, [item.itemId]: false }));
    }
  }, [loadConfigurationStatus, onItemInclusionUpdated, requirementId, readOnly, configurationConfirming]);

  const confirmConfiguration = useCallback(async () => {
    if (!technicalProposalId || !confirmationAllowed) {
      return;
    }

    setConfigurationConfirming(true);
    setConfigurationNotice(null);
    setConfigurationError(null);
    try {
      const response = await confirmRequirementExperienceConfiguration(technicalProposalId);
      setConfigurationStatus(response);
      setConfigurationState("success");
      setConfigurationNotice("Configuración confirmada.");
    } catch (error: unknown) {
      const code = getRequirementExperienceConfigurationErrorCode(error);
      if (code === "REQUIREMENT_EXPERIENCE_CONFIGURATION_BLOCKED") {
        await loadConfigurationStatus();
        setConfigurationError("La configuración cambió y necesita una nueva revisión antes de confirmarse.");
      } else if (code === "REQUIREMENT_EXPERIENCE_CONFLICT") {
        await loadConfigurationStatus();
        setConfigurationError("La configuración fue actualizada. Consultamos nuevamente su estado.");
      } else {
        setConfigurationError("No fue posible confirmar la configuración.");
      }
    } finally {
      setConfigurationConfirming(false);
    }
  }, [confirmationAllowed, loadConfigurationStatus, technicalProposalId]);

  if (isProposalLoading) {
    return (
      <Surface>
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground-secondary">
          <Loader2 aria-hidden="true" size={18} className="animate-spin" />
          Cargando elementos del proyecto...
        </div>
      </Surface>
    );
  }

  if (workspace.workflow.resolutionState === "AMBIGUOUS") {
    return (
      <ConfigurationAvailabilityState
        title="Este proyecto tiene más de un proceso anterior"
        message="Falta definir cuál de los procesos asociados continuará. La configuración estará disponible cuando se seleccione el proceso correspondiente."
      />
    );
  }

  if (workspace.workflow.resolutionState === "EMPTY") {
    return (
      <ConfigurationAvailabilityState
        title="Este proyecto aún no tiene información para configurar"
        message="Cuando se carguen y procesen los documentos del proyecto, sus elementos aparecerán aquí."
      />
    );
  }

  if (hasProposalError) {
    return (
      <ConfigurationAvailabilityState
        title="No fue posible cargar los elementos"
        message="No pudimos cargar los elementos en este momento. Vuelve a cargarlos."
        tone="warning"
        onRetry={onRetryProposal}
      />
    );
  }

  if (workspace.workflow.resolutionState === "RESOLVED" && (!technicalProposalId || !proposal)) {
    if (isProcessingRequirement(workspace.workflow.requirementStatus)) {
      return (
        <ConfigurationAvailabilityState
          title="Estamos analizando la información del proyecto"
          message="La configuración estará disponible cuando termine el análisis."
        />
      );
    }

    return (
      <ConfigurationAvailabilityState
        title="La configuración aún no está disponible"
        message="Podrás configurar los elementos cuando estén disponibles los resultados del análisis de los documentos del proyecto."
      />
    );
  }

  if (!proposal || proposal.items.length === 0) {
    return <ConfigurationEmptyState />;
  }

  const loadingExperience = catalogState === "loading" || draftsState === "loading";
  const experienceError = catalogState === "error" || draftsState === "error";

  return (
    <section aria-labelledby="project-configuration-title" className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h2 id="project-configuration-title" className="text-2xl font-semibold text-foreground">
            Configuración de elementos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Ajusta las prioridades de cada elemento según las necesidades del proyecto. Los datos completos corresponden a cantidad y medidas; no indican una confirmación comercial.
          </p>
        </div>
        <Button type="button" variant="outline" disabled title="Agregar elementos todavía no está disponible en esta sección">
          <Plus aria-hidden="true" size={16} />
          Agregar elemento
        </Button>
      </div>

      <Surface padding="sm" className="border-[#8D9DB7]/25 bg-surface">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "border-[#8D9DB7] bg-[#D9E3F0] text-foreground shadow-sm shadow-[#8D9DB7]/15"
                      : "border-border-subtle bg-surface text-foreground-secondary hover:bg-surface-subtle hover:text-foreground",
                  )}
                  onClick={() => {
                    setFilter(item.id);
                    setPage(0);
                  }}
                >
                  {item.label}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-foreground">
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" size="sm">
              {catalog ? "Prioridades por elemento" : "Prioridades no disponibles"}
            </Badge>
            {loadingExperience ? <Badge tone="neutral" size="sm">Cargando prioridades…</Badge> : null}
            {experienceError ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { setCatalogRetryKey((value) => value + 1); if (draftsState === "error") loadDrafts(); }}>
                Volver a cargar prioridades
              </Button>
            ) : null}
          </div>
        </div>
      </Surface>

      {filteredItems.length === 0 ? (
        <Surface variant="subtle">
          <p className="text-sm text-foreground-secondary">
            No hay elementos para mostrar con este filtro.
          </p>
        </Surface>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground-secondary">
              Elementos {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft aria-hidden="true" size={16} />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              >
                Siguiente
                <ChevronRight aria-hidden="true" size={16} />
              </Button>
            </div>
          </div>

          {visibleItems.map((item) => {
            const draft = defaultDraftForItem(item, catalog, drafts[item.itemId]);
            return (
              <ConfigurationItemCard
                key={item.itemId}
                item={item}
                catalog={catalog}
                draft={draft}
                status={statuses[item.itemId] ?? "idle"}
                error={errors[item.itemId] ?? null}
                inclusionError={inclusionErrors[item.itemId] ?? null}
                inclusionBusy={Boolean(inclusionBusy[item.itemId])}
                readOnly={readOnly}
                confirming={configurationConfirming}
                onDraftChange={changeDraft}
                onSaveDraft={saveDraft}
                onToggleInclusion={toggleInclusion}
                onOpenItem={openItem}
              />
            );
          })}
        </div>
      )}

      <ExperienceConfigurationConfirmationPanel
        readOnly={readOnly}
        hasPendingChanges={hasPendingChanges}
        confirmationAllowed={confirmationAllowed}
        projectId={workspace.project.id}
        configuration={configurationStatus}
        state={configurationState}
        confirming={configurationConfirming}
        notice={configurationNotice}
        error={configurationError}
        onConfirm={confirmConfiguration}
        onRetry={loadConfigurationStatus}
      />
    </section>
  );
}

