"use client";

import { hasUncertainExtractedQuantity } from "@/features/prequotes/quantity-provenance";
import { reconcilePhysicalDataDraft, type PhysicalDataDraft } from "@/features/projects/physical-data-draft";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  ShieldCheck,
  Sparkles,
  Sun,
  ThermometerSun,
  Volume2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { useAuth } from "@/features/auth/auth-context";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { ExperienceLevel2SelectionDialog, type ExperienceLevel2DialogOption } from "@/features/projects/components/experience-level2-selection-dialog";
import { defaultDraftForItem, itemDraftFromServer } from "@/features/prequotes/prequote-experience-demo-config";
import type {
  ItemExperienceDraft,
  RequirementExperienceCatalog,
  RequirementExperienceCatalogQuestion,
  RequirementExperienceLevel2GlassCandidate,
  RequirementExperienceLevel2OverrideState,
  RequirementExperienceLevel2Response,
  RequirementExperienceLevel2SystemCandidate,
} from "@/features/prequotes/prequote-experience-types";
import {
  getRequirementExperienceLevel2,
  getRequirementExperienceCatalog,
  getRequirementExperienceDrafts,
  getRequirementExperienceErrorMessage,
  getRequirementExperienceLevel2ErrorCode,
  updateRequirementExperienceDraft,
  updateRequirementExperienceLevel2Glass,
  updateRequirementExperienceLevel2System,
} from "@/features/prequotes/requirement-experience-api";
import {
  getTechnicalProposalItemLocationErrorMessage,
  getTechnicalProposalItemObservationErrorMessage,
  updateTechnicalProposalItemLocation,
  updateTechnicalProposalItemObservation,
  updateTechnicalProposalItemPhysicalData,
} from "@/features/prequotes/technical-proposal-api";
import {
  updateTechnicalProposalItemInclusion,
  type TechnicalProposalItemInclusionResponse,
} from "@/features/prequotes/technical-proposal-selection-api";
import {
  deriveDisplayAreaM2,
  deriveDisplayTotalAreaM2,
  formatProposalAreaM2,
  formatProposalNumber,
  formatProposalQuantity,
} from "@/features/prequotes/technical-proposal-formatters";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import { ProjectDetailsErrorFeedback, ProjectDetailsLoading } from "@/features/projects/components/project-detail-feedback";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import {
  ProjectWorkspaceNavigation,
  type ProjectWorkspaceStep,
} from "@/features/projects/components/project-workspace-navigation";
import { useProjectWorkspace } from "@/features/projects/use-project-workspace";
import { useProjectWorkspaceProposal } from "@/features/projects/use-project-workspace-proposal";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/http/api-error";

const missingFieldLabels: Record<string, string> = {
  QUANTITY: "Cantidad",
  WIDTH: "Ancho",
  HEIGHT: "Alto",
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

function itemTitle(item: TechnicalProposalItem): string {
  return item.description || item.visualModel?.functionalType || item.elementType || "Elemento por configurar";
}

function itemTypeLabel(item: TechnicalProposalItem): string {
  return item.visualModel?.functionalType ?? item.trace.functionalType ?? item.elementType ?? "Tipologia por confirmar";
}

function locationLabel(item: TechnicalProposalItem): string {
  return item.effectiveLocation?.trim() || item.occurrenceContext?.trim() || "Por definir";
}

function cleanOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function toInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function optionLabel(option: RequirementExperienceCatalogQuestion["options"][number]): string {
  return option.shortLabel?.trim() || option.optionLabel;
}

function isUvQuestion(question: RequirementExperienceCatalogQuestion): boolean {
  return question.options.map((option) => option.optionCode).sort().join("|") === "UV_NO|UV_YES";
}


function priorityMeta(question: RequirementExperienceCatalogQuestion): {
  description: string;
  Icon: LucideIcon;
} {
  const key = `${question.benefitCode} ${question.label}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  if (key.includes("ACUST")) {
    return { description: "Reduce el ingreso de ruido exterior.", Icon: Volume2 };
  }

  if (key.includes("SEGUR")) {
    return { description: "Prioriza una mayor proteccion del elemento.", Icon: ShieldCheck };
  }

  if (key.includes("UV")) {
    return { description: "Ayuda a proteger interiores de la radiacion solar.", Icon: Sun };
  }

  if (key.includes("ESTET") || key.includes("DISE")) {
    return { description: "Da mayor importancia a apariencia y diseno.", Icon: Sparkles };
  }

  if (key.includes("VISTA")) {
    return { description: "Da prioridad a la relacion visual con el exterior.", Icon: Eye };
  }

  return { description: "Ayuda a mantener una temperatura interior mas estable.", Icon: ThermometerSun };
}
function DraftFeedback({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === "saving") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-secondary"><Loader2 aria-hidden="true" size={13} className="animate-spin" />Guardando</span>;
  }
  if (status === "saved") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 aria-hidden="true" size={13} />Guardado</span>;
  }
  if (status === "dirty") return <span className="text-xs font-semibold text-warning">Cambios sin guardar</span>;
  if (status === "conflict") return <span className="text-xs font-semibold text-warning">{error ?? "Hay una version mas reciente."}</span>;
  if (status === "error") return <span className="text-xs font-semibold text-danger">{error ?? "No fue posible guardar."}</span>;
  return null;
}

function PriorityControl({
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
  const { description, Icon } = priorityMeta(question);
  const uvQuestion = isUvQuestion(question);

  let control;

  if (uvQuestion) {
    const noOption = question.options.find((option) => option.optionCode === "UV_NO") ?? question.options[0];
    const yesOption = question.options.find((option) => option.optionCode === "UV_YES") ?? question.options[1];
    const options = [noOption, yesOption].filter((option): option is RequirementExperienceCatalogQuestion["options"][number] => Boolean(option));

    control = (
      <div className="w-full min-w-0">
        <div className="relative w-full min-w-0 px-1 pt-1">
          <span aria-hidden="true" className="pointer-events-none absolute left-1/4 right-1/4 top-[0.875rem] h-0.5 rounded-full bg-[#8D9DB7]/55" />
          <div className="relative z-10 grid grid-cols-2 gap-0">
            {options.map((option) => {
              const selected = selectedOptionCode === option.optionCode;
              return (
                <button key={option.optionCode} type="button" disabled={disabled} aria-pressed={selected} className={cn("group flex min-w-0 flex-col items-center gap-1 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 sm:text-xs", selected ? "text-foreground" : "hover:text-foreground", disabled ? "cursor-not-allowed opacity-55" : "")} onClick={() => onSelect(option.optionCode)}>
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border bg-surface transition-colors", selected ? "border-[#8D9DB7] bg-[#8D9DB7] shadow-sm shadow-[#8D9DB7]/25" : "border-[#8D9DB7]/55 group-hover:border-[#657A9B]")}>
                    <span className={cn("h-2 w-2 rounded-full", selected ? "bg-white" : "bg-transparent group-hover:bg-[#8D9DB7]/35")} />
                  </span>
                  <span className="max-w-full truncate">{optionLabel(option)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  } else {
    control = (
      <div className="w-full min-w-0">
        <div className="relative w-full min-w-0 px-1 pt-1">
          <span aria-hidden="true" className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-[0.875rem] h-0.5 rounded-full bg-[#8D9DB7]/55" />
          <div className="relative z-10 grid grid-cols-3 gap-0">
            {question.options.map((option) => {
              const selected = selectedOptionCode === option.optionCode;
              return (
                <button key={option.optionCode} type="button" disabled={disabled} aria-pressed={selected} className={cn("group flex min-w-0 flex-col items-center gap-1 rounded-sm text-[12px] font-semibold text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 sm:text-xs", selected ? "text-foreground" : "hover:text-foreground", disabled ? "cursor-not-allowed opacity-55" : "")} onClick={() => onSelect(option.optionCode)}>
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border bg-surface transition-colors", selected ? "border-[#8D9DB7] bg-[#8D9DB7] shadow-sm shadow-[#8D9DB7]/25" : "border-[#8D9DB7]/55 group-hover:border-[#657A9B]")}>
                    <span className={cn("h-2 w-2 rounded-full", selected ? "bg-white" : "bg-transparent group-hover:bg-[#8D9DB7]/35")} />
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

  return (
    <div className="grid gap-3 border-b border-[#C4D2E6]/80 py-3 last:border-b-0 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] xl:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9E3F0] text-[#657A9B]"><Icon aria-hidden="true" size={17} strokeWidth={1.8} /></span>
        <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{question.label}</p><p className="mt-0.5 text-xs leading-5 text-foreground-secondary">{description}</p></div>
      </div>
      <div className="w-full min-w-0 xl:justify-self-end">{control}</div>
    </div>
  );
}
function AvailabilityState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <Surface variant="subtle">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9E3F0] text-[#657A9B]">
          <AlertCircle aria-hidden="true" size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-secondary">{message}</p>
          {onRetry ? <Button type="button" variant="outline" size="sm" className="mt-3 bg-surface" onClick={onRetry}>Reintentar</Button> : null}
        </div>
      </div>
    </Surface>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2 text-sm last:border-b-0">
      <span className="font-semibold text-foreground">{label}</span>
      <span className="text-right text-foreground-secondary">{value}</span>
    </div>
  );
}

type Level2Kind = "system" | "glass";
type Level2Candidate = RequirementExperienceLevel2SystemCandidate | RequirementExperienceLevel2GlassCandidate;

function sameId(left: string | null | undefined, right: string | null | undefined): boolean {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function systemTitle(candidate: RequirementExperienceLevel2SystemCandidate | null | undefined): string {
  return candidate?.commercialName?.trim() || candidate?.name?.trim() || "Pendiente de definicion";
}

function systemDescription(candidate: RequirementExperienceLevel2SystemCandidate): string | null {
  return [candidate.technicalName, candidate.family, candidate.series].filter(Boolean).join(" · ") || null;
}

function glassTitle(candidate: RequirementExperienceLevel2GlassCandidate | null | undefined): string {
  return candidate?.composition?.trim() || candidate?.name?.trim() || "Pendiente de definicion";
}

function glassDescription(candidate: RequirementExperienceLevel2GlassCandidate): string | null {
  return [candidate.name, candidate.treatment, candidate.family].filter(Boolean).join(" · ") || null;
}

function candidateCode(candidate: Level2Candidate | null | undefined): string | null {
  return candidate?.code?.trim() || null;
}

function overrideBadges(overrideState: RequirementExperienceLevel2OverrideState, hasEffective: boolean) {
  if (!hasEffective) return [];
  if (overrideState === "VALID") return [{ label: "Seleccion personalizada", tone: "brand" as const }];
  if (overrideState === "REQUIRES_REVIEW") return [
    { label: "Seleccion personalizada", tone: "brand" as const },
    { label: "Requiere revision tecnica", tone: "warning" as const },
  ];
  if (overrideState === "STALE") return [{ label: "Seleccion anterior no compatible", tone: "warning" as const }];
  return [{ label: "Recomendado", tone: "success" as const }];
}

function level2DialogOptions(
  kind: Level2Kind,
  level2: RequirementExperienceLevel2Response | null,
): ExperienceLevel2DialogOption[] {
  if (!level2) return [];
  const source = kind === "system" ? level2.system : level2.glass;
  const suggestedId = source.suggested?.id ?? null;
  const currentId = source.effective?.id ?? null;
  return source.candidates.map((candidate) => ({
    id: candidate.id,
    title: kind === "system"
      ? systemTitle(candidate as RequirementExperienceLevel2SystemCandidate)
      : glassTitle(candidate as RequirementExperienceLevel2GlassCandidate),
    code: candidate.code,
    description: kind === "system"
      ? systemDescription(candidate as RequirementExperienceLevel2SystemCandidate)
      : glassDescription(candidate as RequirementExperienceLevel2GlassCandidate),
    compatibilityState: candidate.compatibilityState,
    isSuggested: sameId(candidate.id, suggestedId),
    isCurrent: sameId(candidate.id, currentId),
  }));
}

function Level2TechnicalCard({
  kind,
  title,
  loading,
  loadError,
  level2,
  saving,
  onChange,
  onClear,
}: {
  kind: Level2Kind;
  title: string;
  loading: boolean;
  loadError: string | null;
  level2: RequirementExperienceLevel2Response | null;
  saving: boolean;
  onChange: () => void;
  onClear: () => void;
}) {
  const model = kind === "system" ? level2?.system : level2?.glass;
  const effective = model?.effective ?? null;
  const suggested = model?.suggested ?? null;
  const override = model?.override ?? null;
  const overrideState = model?.overrideState ?? "NONE";
  const displayTitle = kind === "system"
    ? systemTitle(effective as RequirementExperienceLevel2SystemCandidate | null)
    : glassTitle(effective as RequirementExperienceLevel2GlassCandidate | null);
  const displayCode = candidateCode(effective);
  const suggestedTitle = kind === "system"
    ? systemTitle(suggested as RequirementExperienceLevel2SystemCandidate | null)
    : glassTitle(suggested as RequirementExperienceLevel2GlassCandidate | null);
  const suggestedCode = candidateCode(suggested);
  const showSuggested = Boolean(override && suggested && !sameId(effective?.id, suggested.id));
  const canClear = Boolean(override);
  const actionLabel = kind === "system" ? "Cambiar sistema" : model?.suggested ? "Cambiar vidrio" : "Revisar alternativas";
  const badges = overrideBadges(overrideState, Boolean(effective));

  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {kind === "glass" && level2?.glass.glassFamily ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Familia requerida: {level2.glass.glassFamily}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => <Badge key={badge.label} tone={badge.tone} size="sm">{badge.label}</Badge>)}
        </div>
      </div>

      <div className="mt-4 min-h-16">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-secondary"><Loader2 aria-hidden="true" size={15} className="animate-spin" />Cargando configuracion</span>
        ) : loadError ? (
          <p className="text-sm font-semibold text-warning">{loadError}</p>
        ) : (
          <>
            <p className="text-base font-semibold text-foreground">{displayTitle}</p>
            {displayCode ? <p className="mt-1 text-sm text-foreground-secondary">{displayCode}</p> : null}
            {kind === "glass" && !effective ? <p className="mt-1 text-sm text-foreground-secondary">Composicion pendiente de definicion.</p> : null}
            {showSuggested ? <p className="mt-3 text-xs text-foreground-secondary">Sugerido: {suggestedTitle}{suggestedCode ? ` · ${suggestedCode}` : ""}</p> : null}
            {overrideState === "STALE" ? <p className="mt-3 text-xs font-semibold text-warning">La seleccion anterior ya no es compatible con la configuracion actual.</p> : null}
            {kind === "glass" && !suggested && model?.candidates.some((candidate) => candidate.compatibilityState === "REQUIRES_REVIEW") ? <p className="mt-3 text-xs text-foreground-secondary">Las alternativas disponibles requieren revision tecnica.</p> : null}
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={loading || Boolean(loadError) || saving || !level2} onClick={onChange}>{actionLabel}</Button>
        {canClear ? <Button type="button" size="sm" variant="ghost" disabled={loading || saving || !level2} onClick={onClear}>{model?.suggested ? "Usar recomendado" : "Limpiar seleccion"}</Button> : null}
      </div>
    </div>
  );
}
export function ProjectItemDetailPageContent({ projectId, itemId }: { projectId: string; itemId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { workspace, workspaceError, isWorkspaceLoading, retryWorkspace, isProjectIdValid } = useProjectWorkspace(projectId);
  const shouldLoadProposal = workspace?.workflow.resolutionState === "RESOLVED" && Boolean(workspace.workflow.requirementId && workspace.workflow.hasTechnicalProposal);
  const {
    proposal,
    proposalError,
    isProposalLoading,
    retryProposal,
    applyItemInclusionUpdate,
    applyItemLocationUpdate,
    applyItemObservationUpdate,
    applyItemPhysicalUpdate,
  } = useProjectWorkspaceProposal(workspace?.workflow.requirementId ?? null, shouldLoadProposal);
  const requirementId = workspace?.workflow.requirementId ?? null;

  const [catalog, setCatalog] = useState<RequirementExperienceCatalog | null>(null);
  const [draft, setDraft] = useState<ItemExperienceDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<SaveStatus>("idle");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [observationInput, setObservationInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [locationStatus, setLocationStatus] = useState<SaveStatus>("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [observationStatus, setObservationStatus] = useState<SaveStatus>("idle");
  const [observationError, setObservationError] = useState<string | null>(null);
  const [physicalStatus, setPhysicalStatus] = useState<SaveStatus>("idle");
  const [physicalError, setPhysicalError] = useState<string | null>(null);
  const [inclusionStatus, setInclusionStatus] = useState<SaveStatus>("idle");
  const [inclusionError, setInclusionError] = useState<string | null>(null);
  const [level2, setLevel2] = useState<RequirementExperienceLevel2Response | null>(null);
  const [isLevel2Loading, setIsLevel2Loading] = useState(false);
  const [level2Error, setLevel2Error] = useState<string | null>(null);
  const [level2Notice, setLevel2Notice] = useState<string | null>(null);
  const [level2Dialog, setLevel2Dialog] = useState<Level2Kind | null>(null);
  const [level2Saving, setLevel2Saving] = useState<Level2Kind | null>(null);
  const [level2RefreshKey, setLevel2RefreshKey] = useState(0);
  const [experienceRetryKey, setExperienceRetryKey] = useState(0);
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null);
  const initializedItem = useRef<string | null>(null);
  const initializedDraft = useRef<string | null>(null);
  const physicalDraft = useRef<PhysicalDataDraft>({ quantity: "", widthMm: "", heightMm: "" });
  const physicalRequestId = useRef(0);
  const physicalSaving = useRef(false);

  useEffect(() => () => {
    physicalRequestId.current += 1;
    physicalSaving.current = false;
  }, [projectId, itemId]);

  const item = useMemo(
    () => proposal?.items.find((candidate) => candidate.itemId.toLowerCase() === itemId.toLowerCase()) ?? null,
    [itemId, proposal?.items],
  );

  useEffect(() => {
    let cancelled = false;
    void getRequirementExperienceCatalog()
      .then((response) => {
        if (!cancelled) setCatalog(response);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      });
    return () => {
      cancelled = true;
    };
  }, [experienceRetryKey]);

  useEffect(() => {
    if (!proposal?.technicalProposalId || !item) {
      return;
    }
    if (initializedDraft.current === `${proposal.technicalProposalId}:${item.itemId}`) return;
    let cancelled = false;
    void getRequirementExperienceDrafts(proposal.technicalProposalId)
      .then((response) => {
        if (cancelled) return;
        const draftKey = `${proposal.technicalProposalId}:${item.itemId}`;
        if (initializedDraft.current === draftKey) return;
        initializedDraft.current = draftKey;
        const serverDraft = response.items.find((entry) => entry.technicalProposalItemId.toLowerCase() === item.itemId.toLowerCase());
        setDraft(defaultDraftForItem(item, catalog, serverDraft ? itemDraftFromServer(serverDraft) : undefined));
        setDraftStatus("idle");
        setDraftError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setDraft(null);
          setDraftError("No fue posible cargar las preferencias de experiencia.");
          setDraftStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, item, proposal?.technicalProposalId, experienceRetryKey]);

  useEffect(() => {
    if (!proposal?.technicalProposalId || !item) {
      queueMicrotask(() => {
        setLevel2(null);
        setLevel2Error(null);
        setLevel2Notice(null);
        setLevel2Dialog(null);
        setIsLevel2Loading(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setIsLevel2Loading(true);
      setLevel2Error(null);
    });

    void getRequirementExperienceLevel2(proposal.technicalProposalId, item.itemId)
      .then((response) => {
        if (cancelled) return;
        setLevel2(response);
        setLevel2Error(null);
        setLevel2Notice(null);
      })
      .catch(() => {
        if (cancelled) return;
        setLevel2(null);
        setLevel2Error("No fue posible cargar la configuracion tecnica.");
      })
      .finally(() => {
        if (!cancelled) setIsLevel2Loading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item, level2RefreshKey, proposal?.technicalProposalId]);

  useEffect(() => {
    if (!item) return;
    const key = `${projectId}:${item.itemId}`;
    if (initializedItem.current === key) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      initializedItem.current = key;
      physicalDraft.current = {
        quantity: toInput(item.effectiveQuantity),
        widthMm: toInput(item.effectiveWidthMm),
        heightMm: toInput(item.effectiveHeightMm),
      };
      setLocationInput(locationLabel(item) === "Por definir" ? "" : locationLabel(item));
      setQuantityInput(toInput(item.effectiveQuantity));
      setWidthInput(toInput(item.effectiveWidthMm));
      setHeightInput(toInput(item.effectiveHeightMm));
      setLocationStatus("idle");
      setPhysicalStatus("idle");
      setLocationError(null);
      setPhysicalError(null);
      setObservationInput(item.manualObservation ?? "");
      setObservationStatus("idle");
      setObservationError(null);
    });
    return () => { cancelled = true; };
  }, [item, projectId]);

  const handleStepChange = useCallback((step: ProjectWorkspaceStep) => {
    router.push(`/projects/${encodeURIComponent(projectId)}${step === "context" ? "" : `?section=${step}`}`);
  }, [projectId, router]);

  const saveLocation = useCallback(async (nextLocation: string | null) => {
    if (!proposal || !item) return;
    setLocationStatus("saving");
    setLocationError(null);
    try {
      const response = await updateTechnicalProposalItemLocation(
        proposal.technicalProposalId,
        item.itemId,
        { location: nextLocation },
      );
      applyItemLocationUpdate(response);
      setLocationInput(response.effectiveLocation ?? "");
      setLocationStatus("saved");
    } catch (error) {
      setLocationError(getTechnicalProposalItemLocationErrorMessage(error));
      setLocationStatus("error");
    }
  }, [applyItemLocationUpdate, item, proposal]);

  const savePhysical = useCallback(async () => {
    if (!proposal || !item || physicalSaving.current) return;
    const submitted = { ...physicalDraft.current };
    const quantity = parsePositiveInteger(submitted.quantity);
    const widthMm = parsePositiveInteger(submitted.widthMm);
    const heightMm = parsePositiveInteger(submitted.heightMm);
    if ((!quantity && !widthMm && !heightMm) ||
        (submitted.quantity.trim() && quantity === null) ||
        (submitted.widthMm.trim() && widthMm === null) ||
        (submitted.heightMm.trim() && heightMm === null)) {
      setPhysicalError("Ingresa al menos un dato y usa numeros enteros mayores a cero. Los campos vacios conservan su valor actual.");
      setPhysicalStatus("error");
      return;
    }
    const request = { quantity, widthMm, heightMm };
    const requestId = ++physicalRequestId.current;
    physicalSaving.current = true;
    setPhysicalStatus("saving");
    setPhysicalError(null);
    try {
      const response = await updateTechnicalProposalItemPhysicalData(proposal.technicalProposalId, item.itemId, request);
      const reconciled = reconcilePhysicalDataDraft(submitted, physicalDraft.current, response, requestId, physicalRequestId.current);
      if (!reconciled) return;
      applyItemPhysicalUpdate(response);
      physicalDraft.current = reconciled.draft;
      setQuantityInput(reconciled.draft.quantity);
      setWidthInput(reconciled.draft.widthMm);
      setHeightInput(reconciled.draft.heightMm);
      retryProposal();
      setPhysicalStatus(reconciled.dirty ? "dirty" : "saved");
    } catch {
      if (requestId !== physicalRequestId.current) return;
      setPhysicalError("No fue posible actualizar las medidas del elemento.");
      setPhysicalStatus("error");
    } finally {
      if (requestId === physicalRequestId.current) physicalSaving.current = false;
    }
  }, [applyItemPhysicalUpdate, item, proposal, retryProposal]);

  const saveObservation = useCallback(async () => {
    if (!proposal || !item) return;
    setObservationStatus("saving");
    setObservationError(null);
    try {
      const response = await updateTechnicalProposalItemObservation(
        proposal.technicalProposalId,
        item.itemId,
        { observation: cleanOptional(observationInput) },
      );
      applyItemObservationUpdate(response);
      setObservationInput(response.manualObservation ?? "");
      setObservationStatus("saved");
    } catch (error) {
      setObservationError(getTechnicalProposalItemObservationErrorMessage(error));
      setObservationStatus("error");
    }
  }, [applyItemObservationUpdate, item, observationInput, proposal]);

  const changeDraftAnswer = useCallback((benefitCode: string, optionCode: string) => {
    if (!draft || !catalog) return;
    setDraft({
      ...draft,
      catalogVersion: catalog.version,
      spaceTypeCode: null,
      level1Resolution: null,
      answers: { ...draft.answers, [benefitCode]: optionCode },
    });
    setDraftStatus("dirty");
    setDraftError(null);
  }, [catalog, draft]);

  const saveDraft = useCallback(async () => {
    if (!draft || !catalog || !proposal || !item) return;
    setDraftStatus("saving");
    setDraftError(null);
    try {
      const response = await updateRequirementExperienceDraft(proposal.technicalProposalId, draft.itemId, {
        catalogVersion: catalog.version,
        spaceTypeCode: null,
        expectedRevision: draft.revision,
        answers: Object.entries(draft.answers).map(([benefitCode, optionCode]) => ({ benefitCode, optionCode })),
      });
      setDraft(itemDraftFromServer(response));
      setDraftStatus("saved");
      setLevel2RefreshKey((value) => value + 1);
    } catch (error) {
      const message = getRequirementExperienceErrorMessage(error);
      setDraftError(message);
      setDraftStatus(message.includes("version") || message.includes("version") ? "conflict" : "error");
    }
  }, [catalog, draft, item, proposal]);

  const refreshLevel2AfterConcurrency = useCallback(async (message: string) => {
    if (!proposal || !item) return;
    try {
      const response = await getRequirementExperienceLevel2(proposal.technicalProposalId, item.itemId);
      setLevel2(response);
      setLevel2Error(null);
      setLevel2Notice(message);
      setLevel2Dialog(null);
    } catch {
      setLevel2Notice(message);
      setLevel2Error("No fue posible cargar la configuracion tecnica.");
      setLevel2Dialog(null);
    }
  }, [item, proposal]);

  const saveLevel2Selection = useCallback(async (kind: Level2Kind, selectedId: string | null) => {
    if (!proposal || !item || !level2 || level2Error || level2Saving) return;
    setLevel2Saving(kind);
    setSubmittingOptionId(selectedId);
    setLevel2Notice(null);
    try {
      const expectedRevision = level2.technicalSelectionRevision;
      const response = kind === "system"
        ? await updateRequirementExperienceLevel2System(proposal.technicalProposalId, item.itemId, { systemId: selectedId, expectedRevision })
        : await updateRequirementExperienceLevel2Glass(proposal.technicalProposalId, item.itemId, { glassId: selectedId, expectedRevision });
      setLevel2(response);
      setLevel2Error(null);
      setLevel2Dialog(null);
    } catch (error) {
      const code = getRequirementExperienceLevel2ErrorCode(error);
      if (code === "REQUIREMENT_EXPERIENCE_CONFLICT" ||
          (error instanceof ApiError && error.status === 409 && code !== "REQUIREMENT_EXPERIENCE_LEVEL2_CANDIDATE_NOT_ALLOWED")) {
        await refreshLevel2AfterConcurrency("La configuracion cambio mientras la estabas editando. Actualizamos las opciones disponibles.");
      } else if (code === "REQUIREMENT_EXPERIENCE_LEVEL2_CANDIDATE_NOT_ALLOWED") {
        await refreshLevel2AfterConcurrency("Esta alternativa ya no esta disponible para la configuracion actual.");
      } else {
        setLevel2Notice("No fue posible actualizar la configuracion tecnica.");
      }
    } finally {
      setLevel2Saving(null);
      setSubmittingOptionId(null);
    }
  }, [item, level2, level2Error, level2Saving, proposal, refreshLevel2AfterConcurrency]);
  const toggleInclusion = useCallback(async () => {
    if (!requirementId || !item) return;
    setInclusionStatus("saving");
    setInclusionError(null);
    try {
      const response: TechnicalProposalItemInclusionResponse = await updateTechnicalProposalItemInclusion(
        requirementId,
        item.itemId,
        { isIncluded: !item.isIncluded, reason: null },
      );
      applyItemInclusionUpdate(response);
      setInclusionStatus("saved");
    } catch {
      setInclusionError("No fue posible actualizar la inclusion del elemento.");
      setInclusionStatus("error");
    }
  }, [applyItemInclusionUpdate, item, requirementId]);

  if (!isProjectIdValid) {
    return <ProjectDetailsErrorFeedback error={{ cause: new Error("Proyecto invalido.") }} onRetry={retryWorkspace} />;
  }
  if (isWorkspaceLoading) return <ProjectDetailsLoading />;
  if (workspaceError) return <ProjectDetailsErrorFeedback error={workspaceError} onRetry={retryWorkspace} />;
  if (!workspace) return <ProjectDetailsErrorFeedback error={{ cause: new Error("Proyecto no disponible.") }} onRetry={retryWorkspace} />;

  const userInitials = (user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "");
  const backHref = `/projects/${encodeURIComponent(projectId)}?section=configuration`;

  let content;
  if (workspace.workflow.resolutionState === "AMBIGUOUS") {
    content = <AvailabilityState title="Este proyecto tiene mas de un proceso anterior" message="Aun no se ha definido cual debe continuar en la nueva experiencia. La configuracion estara disponible cuando se seleccione el proceso correspondiente." />;
  } else if (workspace.workflow.resolutionState === "EMPTY") {
    content = <AvailabilityState title="Este proyecto aun no tiene informacion para configurar" message="Cuando se carguen y procesen los documentos del proyecto, sus elementos apareceran aqui." />;
  } else if (isProposalLoading) {
    content = <Surface><div className="flex items-center gap-3 text-sm font-semibold text-foreground-secondary"><Loader2 aria-hidden="true" size={18} className="animate-spin" />Cargando elemento...</div></Surface>;
  } else if (proposalError) {
    content = <AvailabilityState title="No fue posible cargar el elemento" message="El servidor no pudo devolver la propuesta tecnica en este momento." onRetry={retryProposal} />;
  } else if (!proposal || !item) {
    content = <AvailabilityState title="Elemento no disponible" message="No encontramos este elemento dentro de la propuesta tecnica actual del proyecto." />;
  } else {
    const unitArea = deriveDisplayAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm);
    const totalArea = deriveDisplayTotalAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm, item.effectiveQuantity);
    const missingFields = item.dataCompleteness.missingFields.map((field) => missingFieldLabels[field]).filter(Boolean);
    const resolution = draft?.level1Resolution;
    const showLevel2Loading = isLevel2Loading || (!level2 && !level2Error);
    const systemOptions = level2DialogOptions("system", level2);
    const glassOptions = level2DialogOptions("glass", level2);

    content = (
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-secondary hover:text-foreground">
            <ArrowLeft aria-hidden="true" size={16} />
            Volver a Configuracion
          </Link>
          <Button type="button" variant={item.isIncluded ? "outline" : "secondary"} size="sm" disabled={inclusionStatus === "saving"} onClick={toggleInclusion}>
            {inclusionStatus === "saving" ? "Guardando..." : item.isIncluded ? "Excluir elemento" : "Reactivar elemento"}
          </Button>
        </div>

        <Surface padding="lg" className="overflow-hidden">
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" size="md">{item.reference || `Elemento ${item.sequence}`}</Badge>
                {item.isIncluded ? <Badge tone="success" size="sm">Incluido</Badge> : <Badge tone="neutral" size="sm">Excluido</Badge>}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">{itemTitle(item)}</h2>
              <p className="mt-1 text-sm text-foreground-secondary">Detalle comercial y prioridades del elemento seleccionado.</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
              <div className="rounded-md border border-[#8D9DB7]/25 bg-[#D9E3F0]/45 p-3 sm:p-5">
                <div className="mx-auto flex h-48 max-w-xl items-center justify-center sm:h-60 md:h-72 lg:h-auto [&_figure]:flex [&_figure]:h-full [&_figure]:w-full [&_figure]:items-center [&_figure]:justify-center [&_figcaption]:hidden [&_svg]:!h-auto [&_svg]:!max-h-full [&_svg]:!max-w-full [&_svg]:!w-auto lg:[&_svg]:!max-h-[28rem] [&>figure>div]:flex [&>figure>div]:h-full [&>figure>div]:w-full [&>figure>div]:items-center [&>figure>div]:justify-center [&>figure>div]:!overflow-visible [&>figure>div]:border-0 [&>figure>div]:bg-transparent [&>figure>div]:shadow-none">
                  <TechnicalProposalVisualPreview visualModel={item.visualModel} />
                </div>
              </div>

              <div className="space-y-4">
                <Surface variant="subtle" padding="sm" className="border-[#C4D2E6] bg-[#EAF1FB]">
                  <p className="text-sm font-semibold text-foreground">Informacion del elemento</p>
                  <div className="mt-3">
                    <InfoRow label="Ubicacion" value={locationLabel(item)} />
                    <InfoRow label="Tipologia" value={itemTypeLabel(item)} />
                    <InfoRow label="Ancho" value={formatProposalNumber(item.effectiveWidthMm, " mm")} />
                    <InfoRow label="Alto" value={formatProposalNumber(item.effectiveHeightMm, " mm")} />
                    <InfoRow label="Cantidad" value={formatProposalQuantity(item.effectiveQuantity).replace("Cantidad: ", "")} />
                    {item.quantitySource === "ASSUMED_DEFAULT" ? <Badge tone="warning" size="sm">Cantidad asumida</Badge> : null}
                    {hasUncertainExtractedQuantity(item) ? <Badge tone="warning" size="sm">Cantidad por verificar</Badge> : null}
                    <InfoRow label="Area unitaria" value={formatProposalAreaM2(unitArea)} />
                    <InfoRow label="Area total" value={formatProposalAreaM2(totalArea)} />
                  </div>
                </Surface>

                <Surface padding="sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Completitud</p>
                    <Badge tone={item.dataCompleteness.isComplete ? "success" : "warning"} size="sm">
                      {item.dataCompleteness.isComplete ? "Informacion completa" : "Informacion pendiente"}
                    </Badge>
                  </div>
                  {!item.dataCompleteness.isComplete ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(missingFields.length ? missingFields : ["Datos comerciales"]).map((field) => <Badge key={field} tone="warning" size="sm">Falta: {field}</Badge>)}
                    </div>
                  ) : null}
                </Surface>
              </div>
            </div>
          </div>
        </Surface>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
          <Surface padding="lg" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Editar datos comerciales</h3>
              <p className="mt-1 text-sm text-foreground-secondary">Actualiza las medidas y la ubicacion del elemento.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-foreground">
                Ubicacion
                <Input value={locationInput} onChange={(event) => { setLocationInput(event.target.value); setLocationStatus("dirty"); }} placeholder="Sala principal" />
              </label>
              <div className="flex items-end gap-2">
                <Button type="button" className="w-full" disabled={locationStatus === "saving" || locationStatus === "idle"} onClick={() => saveLocation(cleanOptional(locationInput))}>Guardar ubicacion</Button>
                {item.manualLocationOverride ? <Button type="button" variant="outline" title="Usar ubicacion extraida" disabled={locationStatus === "saving"} onClick={() => saveLocation(null)}><RotateCcw aria-hidden="true" size={15} /></Button> : null}
              </div>
              {item.manualLocationOverride && item.extractedLocation ? <p className="lg:col-span-2 text-xs text-foreground-secondary">Origen extraido: {item.extractedLocation}</p> : null}
              <DraftFeedback status={locationStatus} error={locationError} />
            </div>
            <div className="grid gap-4 xl:grid-cols-4">
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Cantidad<Input type="number" min={1} step={1} value={quantityInput} onChange={(event) => { physicalDraft.current.quantity = event.target.value; setQuantityInput(event.target.value); if (!physicalSaving.current) setPhysicalStatus("dirty"); }} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Ancho mm<Input type="number" min={1} step={1} value={widthInput} onChange={(event) => { physicalDraft.current.widthMm = event.target.value; setWidthInput(event.target.value); if (!physicalSaving.current) setPhysicalStatus("dirty"); }} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Alto mm<Input type="number" min={1} step={1} value={heightInput} onChange={(event) => { physicalDraft.current.heightMm = event.target.value; setHeightInput(event.target.value); if (!physicalSaving.current) setPhysicalStatus("dirty"); }} /></label>
              <div className="flex items-end"><Button type="button" className="w-full" disabled={physicalStatus === "saving" || (physicalStatus === "idle" && item.quantitySource !== "ASSUMED_DEFAULT" && !hasUncertainExtractedQuantity(item))} onClick={savePhysical}>Guardar medidas</Button></div>
              {item.quantitySource === "ASSUMED_DEFAULT" ? <p className="text-xs text-foreground-secondary xl:col-span-4">No se encontró una cantidad explícita; se asumió 1.</p> : null}
              {hasUncertainExtractedQuantity(item) ? <p className="text-xs text-foreground-secondary xl:col-span-4">La cantidad fue identificada con incertidumbre. Confírmala si es necesario.</p> : null}
              <div className="xl:col-span-4"><DraftFeedback status={physicalStatus} error={physicalError} /></div>
            </div>
          </Surface>

          <Surface padding="lg" className="space-y-4 border-[#C4D2E6] bg-[#EAF1FB] p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Configuracion resultante</h3>
              <p className="mt-1 text-sm text-foreground-secondary">Solucion resultante segun tus prioridades.</p>
            </div>
            <InfoRow label="Nivel de desempeno" value={resolution?.systemTier === "CLASSIC" ? "Clasico" : resolution?.systemTier === "PREMIUM" ? "Premium" : "Por definir"} />
            <InfoRow label="Familia de vidrio" value={resolution?.glassFamily ?? "Por definir"} />
            <InfoRow label="Estado" value={resolution?.isComplete ? "Prioridades completas" : "Prioridades incompletas"} />
            <Level2TechnicalCard
              kind="system"
              title="Sistema"
              loading={showLevel2Loading}
              loadError={level2Error}
              level2={level2}
              saving={level2Saving !== null}
              onChange={() => setLevel2Dialog("system")}
              onClear={() => saveLevel2Selection("system", null)}
            />
            <Level2TechnicalCard
              kind="glass"
              title="Vidrio"
              loading={showLevel2Loading}
              loadError={level2Error}
              level2={level2}
              saving={level2Saving !== null}
              onChange={() => setLevel2Dialog("glass")}
              onClear={() => saveLevel2Selection("glass", null)}
            />
            <InfoRow label="Acabado" value="Por definir" />
            {level2Error ? <Button type="button" variant="outline" disabled={isLevel2Loading} onClick={() => setLevel2RefreshKey((value) => value + 1)}>Reintentar configuracion</Button> : null}
            {level2Notice ? <p className="text-xs font-semibold text-warning">{level2Notice}</p> : null}
          </Surface>
        </div>

        <Surface padding="lg" className="space-y-4 border-[#C4D2E6] bg-[#EAF1FB] p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prioridades</h3>
              <p className="mt-1 text-sm text-foreground-secondary">La vista general y esta pantalla usan el mismo borrador.</p>
            </div>
            <div className="flex items-center gap-3">
              <DraftFeedback status={draftStatus} error={draftError} />
              <Button type="button" disabled={draftStatus !== "dirty" || !draft || !catalog} onClick={saveDraft}>{draftStatus === "saving" ? "Guardando..." : "Guardar prioridades"}</Button>
            </div>
          </div>
          {catalog && draft ? (
            <div className="rounded-md border border-[#C4D2E6]/80 bg-surface/70 px-3 py-1">
              {catalog.questions.map((question) => (
                <PriorityControl
                  key={question.benefitCode}
                  question={question}
                  selectedOptionCode={draft.answers[question.benefitCode]}
                  disabled={!item.isIncluded || draftStatus === "saving"}
                  onSelect={(optionCode) => changeDraftAnswer(question.benefitCode, optionCode)}
                />
              ))}
            </div>
          ) : <div role="status" className="space-y-2"><p className="text-sm text-foreground-secondary">No fue posible cargar las prioridades.</p><Button type="button" variant="outline" onClick={() => setExperienceRetryKey((value) => value + 1)}>Reintentar</Button></div>}
        </Surface>

        <Surface padding="lg" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Observaciones del item</h3>
              <p className="mt-1 text-sm text-foreground-secondary">Notas internas para conservar contexto comercial de este elemento.</p>
            </div>
            <DraftFeedback status={observationStatus} error={observationError} />
          </div>
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            Observacion manual
            <textarea
              value={observationInput}
              maxLength={500}
              rows={4}
              className="min-h-28 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-foreground-secondary focus:border-[#8D9DB7] focus:ring-2 focus:ring-[#8D9DB7]/25"
              placeholder="Ej. Validar apertura con residente antes de fabricar."
              onChange={(event) => {
                setObservationInput(event.target.value);
                setObservationStatus("dirty");
                setObservationError(null);
              }}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-foreground-secondary">{observationInput.length}/500</span>
            <Button type="button" disabled={observationStatus === "saving" || observationStatus === "idle"} onClick={saveObservation}>
              {observationStatus === "saving" ? "Guardando..." : "Guardar observacion"}
            </Button>
          </div>
        </Surface>
        {inclusionError ? <p className="text-sm font-semibold text-danger">{inclusionError}</p> : null}
        <ExperienceLevel2SelectionDialog
          open={level2Dialog === "system"}
          title="Cambiar sistema"
          subtitle="Elige una alternativa disponible para este elemento. Validaremos su compatibilidad antes de guardar."
          options={systemOptions}
          saving={level2Saving === "system"}
          submittingOptionId={submittingOptionId}
          onClose={() => setLevel2Dialog(null)}
          onSelect={(id) => saveLevel2Selection("system", id)}
        />
        <ExperienceLevel2SelectionDialog
          open={level2Dialog === "glass"}
          title="Cambiar vidrio"
          subtitle="Selecciona una composicion dentro de la familia requerida para este elemento. Algunas alternativas pueden requerir revision tecnica."
          options={glassOptions}
          saving={level2Saving === "glass"}
          submittingOptionId={submittingOptionId}
          onClose={() => setLevel2Dialog(null)}
          onSelect={(id) => saveLevel2Selection("glass", id)}
        />
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <ProjectWorkspaceHeader
        workspace={workspace}
        readOnly={isAdmin}
        userInitials={userInitials}
        isEditDisabled
        isActivationDisabled
        onRequestEdit={() => undefined}
        onRequestActivation={() => undefined}
      />
      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <ProjectWorkspaceNavigation activeStep="configuration" onStepChange={handleStepChange} />
        {content}
      </div>
    </div>
  );
}
