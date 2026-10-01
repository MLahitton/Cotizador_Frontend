"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { formatExperienceSpaceType, getExperienceSelectionsSummary } from "@/features/prequotes/prequote-experience-demo-config";
import type { ItemExperienceDraft, RequirementExperienceCatalog, RequirementExperienceCatalogQuestion } from "@/features/prequotes/prequote-experience-types";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import { cn } from "@/lib/utils/cn";

type DraftStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict" | "loading";

function priorityForQuestion(catalog: RequirementExperienceCatalog, draft: ItemExperienceDraft, benefitCode: string): number | null {
  if (!draft.spaceTypeCode) return null;
  return catalog.spaces.find((space) => space.code === draft.spaceTypeCode)?.priorities[benefitCode] ?? null;
}

function splitQuestions(catalog: RequirementExperienceCatalog, draft: ItemExperienceDraft) {
  if (!draft.spaceTypeCode) return { primary: catalog.questions, secondary: [] };
  const primary: RequirementExperienceCatalogQuestion[] = [];
  const secondary: RequirementExperienceCatalogQuestion[] = [];

  catalog.questions.forEach((question) => {
    const answered = Boolean(draft.answers[question.benefitCode]);
    const priority = priorityForQuestion(catalog, draft, question.benefitCode) ?? 0;
    if (answered || priority >= 2) primary.push(question);
    else secondary.push(question);
  });

  return { primary, secondary };
}

function DimensionQuestion({
  question,
  value,
  priority,
  disabled,
  onSelect,
  onClear,
}: {
  question: RequirementExperienceCatalogQuestion;
  value: string | null;
  priority: number | null;
  disabled: boolean;
  onSelect: (benefitCode: string, optionCode: string) => void;
  onClear: (benefitCode: string) => void;
}) {
  return (
    <div
      role="group"
      aria-labelledby={`experience-${question.benefitCode}-title`}
      className="flex min-h-[210px] min-w-0 flex-col rounded-sm border border-border-subtle bg-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p id={`experience-${question.benefitCode}-title`} className="text-sm font-semibold text-foreground">{question.label}</p>
          <p className="mt-1.5 text-sm leading-6 text-foreground-secondary">{question.question}</p>
        </div>
        {priority !== null ? <Badge tone="neutral" size="sm">Prioridad {priority}</Badge> : null}
      </div>
      <div className="mt-4 flex flex-col items-start gap-2">
        {question.options.map((option) => {
          const selected = option.optionCode === value;
          const label = option.optionLabel;
          return (
            <button
              key={option.optionCode}
              type="button"
              disabled={disabled}
              className={cn(
                "max-w-full rounded-full border px-3 py-1.5 text-left text-sm font-semibold leading-5 transition",
                selected
                  ? "border-brand bg-brand text-white"
                  : disabled
                    ? "border-border bg-surface-subtle text-foreground-secondary opacity-60"
                    : "border-border bg-surface-subtle text-foreground-secondary hover:border-brand hover:text-foreground",
              )}
              onClick={() => onSelect(question.benefitCode, option.optionCode)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value ? (
        <Button type="button" variant="ghost" size="sm" disabled={disabled} className="mt-auto self-start" onClick={() => onClear(question.benefitCode)}>
          Quitar respuesta
        </Button>
      ) : null}
    </div>
  );
}

function statusLabel(status: DraftStatus, draft: ItemExperienceDraft): string {
  if (status === "loading") return "Cargando preferencias";
  if (status === "saving") return "Guardando";
  if (status === "dirty") return "Cambios sin guardar";
  if (status === "conflict") return "Version mas reciente disponible";
  if (status === "error") return "Error al guardar";
  if (draft.hasServerDraft) {
    return Object.keys(draft.answers).length > 0
      ? "Preferencias guardadas · Resolucion tecnica pendiente"
      : "Guardado sin respuestas · Resolucion tecnica pendiente";
  }
  return "Sin responder";
}

export function PreQuoteExperienceItemConfigurator({
  item,
  catalog,
  draft,
  status = "idle",
  errorMessage = null,
  disabled = false,
  onCancel,
  onDraftChange,
  onSave,
  onReload,
  onOpenChat,
}: {
  item: TechnicalProposalItem;
  catalog: RequirementExperienceCatalog;
  draft: ItemExperienceDraft;
  status?: DraftStatus;
  errorMessage?: string | null;
  disabled?: boolean;
  onCancel: () => void;
  onDraftChange: (draft: ItemExperienceDraft) => void;
  onSave: (draft: ItemExperienceDraft) => void | Promise<boolean>;
  onReload: () => void;
  onOpenChat: () => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const selectedSummary = getExperienceSelectionsSummary(draft, catalog, 3);
  const { primary, secondary } = useMemo(() => splitQuestions(catalog, draft), [catalog, draft]);
  const isSaving = status === "saving";
  const effectiveDisabled = disabled || isSaving;

  const updateSpace = (spaceTypeCode: string) => {
    if (effectiveDisabled) return;
    onDraftChange({ ...draft, spaceTypeCode: spaceTypeCode || null });
  };

  const selectValue = (benefitCode: string, optionCode: string) => {
    if (effectiveDisabled) return;
    onDraftChange({
      ...draft,
      answers: { ...draft.answers, [benefitCode]: optionCode },
    });
  };

  const clearValue = (benefitCode: string) => {
    if (effectiveDisabled) return;
    const answers = { ...draft.answers };
    delete answers[benefitCode];
    onDraftChange({ ...draft, answers });
  };

  const save = async () => {
    if (effectiveDisabled) return;
    await onSave(draft);
  };

  return (
    <Surface variant="subtle" className="space-y-4 border-brand">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles aria-hidden="true" className="text-brand" size={18} strokeWidth={1.75} />
            <h5 className="font-semibold text-foreground">Configurar experiencia</h5>
            <Badge tone={status === "dirty" ? "warning" : draft.hasServerDraft ? "brand" : "neutral"} size="sm">
              {statusLabel(status, draft)}
            </Badge>
          </div>
          <p className="mt-1 break-words text-sm text-foreground-secondary">
            {item.reference || `Elemento ${item.sequence}`} · {formatExperienceSpaceType(catalog, draft.spaceTypeCode)}
          </p>
          {draft.catalogVersion && draft.catalogVersion !== catalog.version ? (
            <p className="mt-2 text-sm text-warning">Este borrador usa una version de catalogo distinta y debe revisarse antes de guardar.</p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenChat}>
          <MessageCircle aria-hidden="true" size={15} />
          Consultar sobre este item
        </Button>
      </div>

      <label className="block text-sm font-semibold text-foreground">
        Tipo de espacio
        <select
          className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          value={draft.spaceTypeCode ?? ""}
          disabled={effectiveDisabled}
          onChange={(event) => updateSpace(event.target.value)}
        >
          <option value="">Espacio pendiente</option>
          {catalog.spaces.map((space) => (
            <option key={space.code} value={space.code}>{space.label}</option>
          ))}
        </select>
      </label>
      <p className="text-xs text-foreground-secondary">
        La ubicacion libre del item permanece local en esta pantalla; este guardado solo persiste el tipo de espacio del catalogo.
      </p>

      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 self-start rounded-sm border border-border-subtle bg-surface p-3">
          {item.visualModel ? (
            <div className="h-fit max-h-[320px] overflow-hidden rounded-sm">
              <TechnicalProposalVisualPreview visualModel={item.visualModel} />
            </div>
          ) : (
            <div className="flex aspect-[4/3] min-h-36 items-center justify-center rounded-sm border border-dashed border-border bg-surface-subtle p-4 text-center text-sm text-foreground-secondary">
              Visual pendiente
            </div>
          )}
        </div>
        {primary.map((question) => (
          <DimensionQuestion
            key={question.benefitCode}
            question={question}
            value={draft.answers[question.benefitCode] ?? null}
            priority={priorityForQuestion(catalog, draft, question.benefitCode)}
            disabled={effectiveDisabled}
            onSelect={selectValue}
            onClear={clearValue}
          />
        ))}
      </div>

      {secondary.length > 0 ? (
        <div className="rounded-sm border border-border-subtle bg-surface p-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowOther((value) => !value)}>
            {showOther ? "Ocultar otras preferencias" : `Otras preferencias (${secondary.length})`}
          </Button>
          {showOther ? (
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {secondary.map((question) => (
                <DimensionQuestion
                  key={question.benefitCode}
                  question={question}
                  value={draft.answers[question.benefitCode] ?? null}
                  priority={priorityForQuestion(catalog, draft, question.benefitCode)}
                  disabled={effectiveDisabled}
                  onSelect={selectValue}
                  onClear={clearValue}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-sm border border-border-subtle bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">Preferencias guardables</p>
          <Badge tone="neutral" size="sm">No altera seleccion ni precios</Badge>
        </div>
        <p className="mt-2 text-sm text-foreground-secondary">
          {selectedSummary.length > 0 ? selectedSummary.join(" · ") : "Sin respuestas seleccionadas."}
        </p>
        <p className="mt-1 text-xs text-foreground-secondary">
          El estado {draft.resolutionState} significa que la resolucion tecnica sigue pendiente; guardar preferencias no recalcula la propuesta.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-sm border border-warning bg-warning-soft p-3 text-sm text-foreground-secondary">
          {errorMessage}
          {status === "conflict" ? (
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={onReload}>Recargar version guardada</Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={effectiveDisabled} onClick={save}>{isSaving ? "Guardando..." : "Guardar preferencias"}</Button>
      </div>
    </Surface>
  );
}
