"use client";

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
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { useAuth } from "@/features/auth/auth-context";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { defaultDraftForItem, itemDraftFromServer } from "@/features/prequotes/prequote-experience-demo-config";
import type {
  ItemExperienceDraft,
  RequirementExperienceCatalog,
  RequirementExperienceCatalogQuestion,
  RequirementExperienceLevel2Response,
  RequirementExperienceLevel2State,
} from "@/features/prequotes/prequote-experience-types";
import {
  getRequirementExperienceLevel2,
  getRequirementExperienceCatalog,
  getRequirementExperienceDrafts,
  getRequirementExperienceErrorMessage,
  updateRequirementExperienceDraft,
} from "@/features/prequotes/requirement-experience-api";
import {
  getTechnicalProposalItemLocationErrorMessage,
  getTechnicalProposalItemObservationErrorMessage,
  updateTechnicalProposalItemLocation,
  updateTechnicalProposalItemObservation,
} from "@/features/prequotes/technical-proposal-api";
import {
  getTechnicalProposalSelectionErrorMessage,
  updateTechnicalProposalItemInclusion,
  updateTechnicalProposalItemSelection,
  type TechnicalProposalItemInclusionResponse,
  type TechnicalProposalSelectionRequest,
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
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function optionLabel(option: RequirementExperienceCatalogQuestion["options"][number]): string {
  return option.shortLabel?.trim() || option.optionLabel;
}

function isUvQuestion(question: RequirementExperienceCatalogQuestion): boolean {
  return question.options.map((option) => option.optionCode).sort().join("|") === "NO|YES";
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
    const noOption = question.options.find((option) => option.optionCode === "NO") ?? question.options[0];
    const yesOption = question.options.find((option) => option.optionCode === "YES") ?? question.options[1];
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

function level2StatusLabel(state: RequirementExperienceLevel2State): string | null {
  if (state === "REQUIRES_REVIEW") return "Requiere revision";
  if (state === "BLOCKED") return "No disponible";
  if (state === "PENDING") return "Pendiente";
  return null;
}

function level2StatusTone(state: RequirementExperienceLevel2State): "neutral" | "warning" | "danger" {
  if (state === "BLOCKED") return "danger";
  if (state === "REQUIRES_REVIEW") return "warning";
  return "neutral";
}

function level2DisplayValue(state: RequirementExperienceLevel2State, suggestedName: string | null | undefined): string {
  if (state === "RESOLVED" && suggestedName) return suggestedName;
  if (state === "REQUIRES_REVIEW") return "Pendiente de definicion";
  if (state === "BLOCKED") return "No disponible";
  return "Por definir";
}

function TechnicalConfigRow({
  label,
  value,
  secondary,
  state,
  loading,
}: {
  label: string;
  value: string;
  secondary?: string | null;
  state?: RequirementExperienceLevel2State;
  loading?: boolean;
}) {
  const badgeLabel = state ? level2StatusLabel(state) : null;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2 text-sm last:border-b-0">
      <span className="shrink-0 font-semibold text-foreground">{label}</span>
      <div className="min-w-0 text-right">
        {loading ? (
          <span className="inline-flex items-center justify-end gap-1 font-semibold text-foreground-secondary">
            <Loader2 aria-hidden="true" size={13} className="animate-spin" />
            Cargando
          </span>
        ) : (
          <>
            <p className="break-words text-foreground-secondary">{value}</p>
            {secondary ? <p className="mt-0.5 break-words text-xs text-foreground-secondary">{secondary}</p> : null}
            {badgeLabel && state ? <Badge tone={level2StatusTone(state)} size="sm" className="mt-1">{badgeLabel}</Badge> : null}
          </>
        )}
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
  const [level2RefreshKey, setLevel2RefreshKey] = useState(0);

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
  }, []);

  useEffect(() => {
    if (!proposal?.technicalProposalId || !item) {
      queueMicrotask(() => setDraft(null));
      return;
    }
    let cancelled = false;
    void getRequirementExperienceDrafts(proposal.technicalProposalId)
      .then((response) => {
        if (cancelled) return;
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
  }, [catalog, item, proposal?.technicalProposalId]);

  useEffect(() => {
    if (!proposal?.technicalProposalId || !item) {
      queueMicrotask(() => {
        setLevel2(null);
        setLevel2Error(null);
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
    queueMicrotask(() => {
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
  }, [item]);

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
    if (!proposal || !item) return;
    const quantity = parsePositiveInteger(quantityInput);
    const widthMm = parsePositiveInteger(widthInput);
    const heightMm = parsePositiveInteger(heightInput);
    if (!quantity || !widthMm || !heightMm) {
      setPhysicalError("Completa cantidad, ancho y alto con valores mayores a cero.");
      setPhysicalStatus("error");
      return;
    }
    const request: TechnicalProposalSelectionRequest = { quantity, widthMm, heightMm };
    setPhysicalStatus("saving");
    setPhysicalError(null);
    try {
      await updateTechnicalProposalItemSelection(proposal.technicalProposalId, item.itemId, request);
      applyItemPhysicalUpdate(item.itemId, request);
      retryProposal();
      setPhysicalStatus("saved");
    } catch (error) {
      setPhysicalError(getTechnicalProposalSelectionErrorMessage(error));
      setPhysicalStatus("error");
    }
  }, [applyItemPhysicalUpdate, heightInput, item, proposal, quantityInput, retryProposal, widthInput]);

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
    const systemDisplay = level2Error
      ? "No disponible"
      : level2DisplayValue(level2?.system.state ?? "PENDING", level2?.system.suggested?.name);
    const glassDisplay = level2Error
      ? "No disponible"
      : level2DisplayValue(level2?.glass.state ?? "PENDING", level2?.glass.suggested?.name);
    const systemSecondary = !level2Error && level2?.system.state === "RESOLVED" ? level2.system.suggested?.code : null;
    const glassSecondary = !level2Error && level2?.glass.state === "RESOLVED" ? level2.glass.suggested?.code : null;
    const showLevel2Loading = isLevel2Loading || (!level2 && !level2Error);

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
              <p className="mt-1 text-sm text-foreground-secondary">Estos cambios actualizan los valores efectivos del item.</p>
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
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Cantidad<Input type="number" min={1} step={1} value={quantityInput} onChange={(event) => { setQuantityInput(event.target.value); setPhysicalStatus("dirty"); }} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Ancho mm<Input type="number" min={1} step={1} value={widthInput} onChange={(event) => { setWidthInput(event.target.value); setPhysicalStatus("dirty"); }} /></label>
              <label className="space-y-1.5 text-sm font-semibold text-foreground">Alto mm<Input type="number" min={1} step={1} value={heightInput} onChange={(event) => { setHeightInput(event.target.value); setPhysicalStatus("dirty"); }} /></label>
              <div className="flex items-end"><Button type="button" className="w-full" disabled={physicalStatus === "saving" || physicalStatus === "idle"} onClick={savePhysical}>Guardar medidas</Button></div>
              <div className="xl:col-span-4"><DraftFeedback status={physicalStatus} error={physicalError} /></div>
            </div>
          </Surface>

          <Surface padding="lg" className="space-y-4 border-[#C4D2E6] bg-[#EAF1FB] p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Configuracion resultante</h3>
              <p className="mt-1 text-sm text-foreground-secondary">Level 1 real y campos tecnicos aun pendientes.</p>
            </div>
            <InfoRow label="Linea de sistema" value={resolution?.systemTier ?? "Por definir"} />
            <InfoRow label="Familia de vidrio" value={resolution?.glassFamily ?? "Por definir"} />
            <InfoRow label="Estado" value={resolution?.isComplete ? "Prioridades completas" : "Prioridades incompletas"} />
            <TechnicalConfigRow
              label="Sistema exacto"
              value={systemDisplay}
              secondary={systemSecondary}
              state={level2Error ? "BLOCKED" : level2?.system.state}
              loading={showLevel2Loading}
            />
            <TechnicalConfigRow
              label="Composicion de vidrio"
              value={glassDisplay}
              secondary={glassSecondary}
              state={level2Error ? "BLOCKED" : level2?.glass.state}
              loading={showLevel2Loading}
            />
            <InfoRow label="Acabado" value="Por definir" />
            {level2Error ? <p className="text-xs font-semibold text-warning">{level2Error}</p> : null}
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
          ) : <p className="text-sm text-foreground-secondary">Catalogo de experiencia no disponible.</p>}
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
