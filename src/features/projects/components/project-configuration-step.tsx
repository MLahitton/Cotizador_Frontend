"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import {
  getRequirementExperienceCatalog,
  getRequirementExperienceDrafts,
  getRequirementExperienceErrorMessage,
  updateRequirementExperienceDraft,
} from "@/features/prequotes/requirement-experience-api";
import { defaultDraftForItem, itemDraftFromServer } from "@/features/prequotes/prequote-experience-demo-config";
import type {
  ItemExperienceDraft,
  ItemExperienceDrafts,
  RequirementExperienceCatalog,
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
import { cn } from "@/lib/utils/cn";

const ITEMS_PER_PAGE = 4;

type ItemFilter = "all" | "complete" | "incomplete" | "excluded";
type DraftStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

const filters: Array<{ id: ItemFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "complete", label: "Completos" },
  { id: "incomplete", label: "Incompletos" },
  { id: "excluded", label: "Excluidos" },
];

const missingFieldLabels: Record<string, string> = {
  QUANTITY: "Falta cantidad",
  WIDTH: "Falta ancho",
  HEIGHT: "Falta alto",
};

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
    return "Prioridades completas";
  }

  const answered = resolution?.answeredBenefits ?? answerCount(draft, catalog);
  const required = resolution?.requiredBenefits ?? catalog?.questions.length ?? 5;

  if (answered > 0) {
    return `${answered} de ${required} prioridades definidas`;
  }

  return "Configuración parcial";
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
        Guardando
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 aria-hidden="true" size={14} />
        Guardado
      </span>
    );
  }

  if (status === "dirty") {
    return <span className="text-xs font-semibold text-warning">Cambios sin guardar</span>;
  }

  if (status === "conflict") {
    return <span className="text-xs font-semibold text-warning">{error ?? "Hay una versión más reciente."}</span>;
  }

  if (status === "error") {
    return <span className="text-xs font-semibold text-danger">{error ?? "No fue posible guardar."}</span>;
  }

  return null;
}

function isUvQuestion(question: RequirementExperienceCatalogQuestion): boolean {
  const optionCodes = question.options.map((option) => option.optionCode).sort().join("|");
  return optionCodes === "NO|YES";
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
                  "group flex min-w-0 flex-col items-center gap-1 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-subtle sm:text-xs",
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
                <span className="max-w-full truncate">{optionLabel(option)}</span>
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
  const noOption = question.options.find((option) => option.optionCode === "NO") ?? question.options[0];
  const yesOption = question.options.find((option) => option.optionCode === "YES") ?? question.options[1];
  const options = [noOption, yesOption].filter((option): option is RequirementExperienceCatalogQuestion["options"][number] => Boolean(option));

  return (
    <div className="w-full min-w-0">
      <div className="relative w-full min-w-0 px-1 pt-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/4 right-1/4 top-[0.875rem] h-0.5 rounded-full bg-[#8D9DB7]/55"
        />
        <div className="relative z-10 grid grid-cols-2 gap-0">
          {options.map((option) => {
            const isSelected = selectedOptionCode === option.optionCode;
            return (
              <button
                key={option.optionCode}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "group flex min-w-0 flex-col items-center gap-1 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-subtle sm:text-xs",
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
                <span className="max-w-full truncate">{optionLabel(option)}</span>
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
    <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(5.75rem,0.65fr)_minmax(0,1fr)] md:items-center xl:grid-cols-[minmax(7rem,0.72fr)_minmax(0,1fr)]">
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
function ConfigurationItemCard({
  item,
  catalog,
  draft,
  status,
  error,
  inclusionError,
  inclusionBusy,
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
  const canSave = status === "dirty" && !isExcluded;
  const dimensions = `${formatProposalNumber(item.effectiveWidthMm, " mm")} x ${formatProposalNumber(item.effectiveHeightMm, " mm")}`;
  const quantity = formatProposalQuantity(item.effectiveQuantity).replace("Cantidad: ", "");
  const itemTypeLabel = typeLabel(item);

  const updateAnswer = (benefitCode: string, optionCode: string) => {
    if (!catalog || isExcluded) {
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
      <div className="grid gap-3 p-3 @[35rem]:grid-cols-[6.5rem_minmax(0,1fr)_minmax(14.5rem,1.05fr)_2.25rem] @[35rem]:items-center @[56rem]:grid-cols-[9rem_minmax(0,0.9fr)_minmax(18rem,1.25fr)_2.5rem] @[78rem]:grid-cols-[10.5rem_minmax(10rem,0.85fr)_minmax(20rem,1.2fr)_2.5rem] @[92rem]:grid-cols-[11.75rem_minmax(12rem,0.95fr)_minmax(25rem,1.3fr)_2.5rem]">
        <div className="min-w-0">
          <div className="h-40 overflow-hidden rounded-md border border-[#8D9DB7]/25 bg-[#D9E3F0]/45 p-2 sm:h-44 @[35rem]:h-32 @[56rem]:h-36 @[78rem]:h-40">
            <div className="h-full min-w-0 [&_figure]:h-full [&_figure]:space-y-0 [&_figcaption]:hidden [&_svg]:max-h-36 @[35rem]:[&_svg]:max-h-28 @[56rem]:[&_svg]:max-h-32 @[78rem]:[&_svg]:max-h-36 [&>figure>div]:h-full [&>figure>div]:border-0 [&>figure>div]:bg-transparent [&>figure>div]:p-1 [&>figure>div]:shadow-none">
              <TechnicalProposalVisualPreview visualModel={item.visualModel} />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-2.5 @[35rem]:py-1">
          <div className="space-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="shrink-0 rounded-full bg-[#D9E3F0] px-2.5 py-1 text-xs font-bold text-foreground">
                {item.reference || `Elemento ${item.sequence}`}
              </span>
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
            <h3 className="line-clamp-2 text-base font-semibold text-foreground">
              {item.description || itemTypeLabel}
            </h3>
          </div>

          <div className="grid gap-x-3 gap-y-1 text-sm @[35rem]:text-xs @[56rem]:grid-cols-2">
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
            </p>
            <p className="min-w-0 text-foreground-secondary">
              <span className="font-semibold text-foreground">Área total: </span>
              <span>{formatProposalAreaM2(totalArea)}</span>
            </p>
          </div>

          <p className="flex min-w-0 items-center gap-1.5 text-xs text-foreground-secondary">
            <MapPin aria-hidden="true" size={13} className="shrink-0 text-[#657A9B]" />
            <span className="line-clamp-1">{displayLocation(item)}</span>
          </p>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={item.dataCompleteness.isComplete ? "success" : "warning"} size="sm">
                {item.dataCompleteness.isComplete ? "Información completa" : "Información pendiente"}
              </Badge>
              <Badge tone="neutral" size="sm">
                {formatLevel1State(draft, catalog)}
              </Badge>
            </div>
            <DraftFeedback status={status} error={error} />
          </div>
        </div>
        <div className="min-w-0 rounded-md border border-[#C4D2E6] bg-[#EAF1FB] p-3">
          {catalog?.questions.length ? (
            <div className="grid gap-2">
              {catalog.questions.map((question) => (
                <ExperienceQuestionControl
                  key={question.benefitCode}
                  question={question}
                  selectedOptionCode={draft.answers[question.benefitCode]}
                  disabled={isExcluded || status === "saving"}
                  onSelect={(optionCode) => updateAnswer(question.benefitCode, optionCode)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-foreground-secondary">
              Catálogo de experiencia no disponible.
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {!item.dataCompleteness.isComplete ? (
                <div className="flex flex-wrap gap-1.5">
                  {(missingFields.length > 0 ? missingFields : ["Faltan datos comerciales"]).map((field) => (
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
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Button
                type="button"
                variant={item.isIncluded ? "outline" : "secondary"}
                size="sm"
                disabled={inclusionBusy}
                onClick={() => onToggleInclusion(item)}
              >
                {inclusionBusy ? "Guardando..." : item.isIncluded ? "Excluir" : "Reactivar"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canSave}
                onClick={() => onSaveDraft(draft)}
              >
                {status === "saving" ? "Guardando..." : "Guardar"}
              </Button>
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
    </Surface>
  );
}

function ConfigurationEmptyState() {
  return (
    <Surface variant="subtle">
      <p className="text-sm font-semibold text-foreground">
        No hay elementos técnicos disponibles.
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground-secondary">
        Cuando exista una propuesta técnica, aquí aparecerán los elementos para configurar sus prioridades comerciales.
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
              Reintentar
            </Button>
          ) : null}
        </div>
      </div>
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
}: {
  workspace: ProjectWorkspace;
  proposal: TechnicalProposal | null;
  isProposalLoading: boolean;
  hasProposalError: boolean;
  onRetryProposal: () => void;
  onItemInclusionUpdated: (update: TechnicalProposalItemInclusionResponse) => void;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<RequirementExperienceCatalog | null>(null);
  const [drafts, setDrafts] = useState<ItemExperienceDrafts>({});
  const [catalogState, setCatalogState] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [draftsState, setDraftsState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statuses, setStatuses] = useState<Record<string, DraftStatus>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [inclusionBusy, setInclusionBusy] = useState<Record<string, boolean>>({});
  const [inclusionErrors, setInclusionErrors] = useState<Record<string, string | null>>({});
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [page, setPage] = useState(0);

  const technicalProposalId = proposal?.technicalProposalId ?? workspace.workflow.technicalProposalId;
  const requirementId = proposal?.requirementId ?? workspace.workflow.requirementId;
  const shouldLoadExperienceData = Boolean(proposal && technicalProposalId && requirementId);

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
  }, [shouldLoadExperienceData]);

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
  }, []);

  const saveDraft = useCallback(async (draft: ItemExperienceDraft) => {
    if (!technicalProposalId || !catalog) {
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
    } catch (error: unknown) {
      const message = getRequirementExperienceErrorMessage(error);
      setStatuses((current) => ({
        ...current,
        [draft.itemId]: message.includes("versión") || message.includes("version")
          ? "conflict"
          : "error",
      }));
      setErrors((current) => ({ ...current, [draft.itemId]: message }));
    }
  }, [catalog, technicalProposalId]);

  const openItem = useCallback((item: TechnicalProposalItem) => {
    router.push(`/projects/${encodeURIComponent(workspace.project.id)}/items/${encodeURIComponent(item.itemId)}`);
  }, [router, workspace.project.id]);

  const toggleInclusion = useCallback(async (item: TechnicalProposalItem) => {
    if (!requirementId) {
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
    } catch {
      setInclusionErrors((current) => ({
        ...current,
        [item.itemId]: "No fue posible actualizar la inclusión del elemento.",
      }));
    } finally {
      setInclusionBusy((current) => ({ ...current, [item.itemId]: false }));
    }
  }, [onItemInclusionUpdated, requirementId]);

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
        message="Aún no se ha definido cuál debe continuar en la nueva experiencia. La configuración estará disponible cuando se seleccione el proceso correspondiente."
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
        message="El servidor no pudo devolver la propuesta técnica en este momento."
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
        message="Podrás configurar los elementos cuando exista una propuesta técnica generada a partir de los documentos del proyecto."
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
            Configura tus elementos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Ajusta las prioridades de cada elemento según las necesidades del proyecto.
          </p>
        </div>
        <Button type="button" variant="outline" disabled title="Pendiente de flujo manual V4">
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
              {catalog?.version ?? "Catálogo pendiente"}
            </Badge>
            {loadingExperience ? <Badge tone="neutral" size="sm">Cargando preferencias</Badge> : null}
            {experienceError ? (
              <Button type="button" variant="outline" size="sm" onClick={loadDrafts}>
                Reintentar preferencias
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
                onDraftChange={changeDraft}
                onSaveDraft={saveDraft}
                onToggleInclusion={toggleInclusion}
                onOpenItem={openItem}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

