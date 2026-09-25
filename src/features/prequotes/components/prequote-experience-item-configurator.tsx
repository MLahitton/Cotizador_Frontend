"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { EXPERIENCE_DIMENSIONS, formatExperienceSpaceType, getExperienceSelectionsSummary } from "@/features/prequotes/prequote-experience-demo-config";
import type { ExperienceDimensionKey, ExperienceSelections, ItemExperienceDraft } from "@/features/prequotes/prequote-experience-types";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import { cn } from "@/lib/utils/cn";

function cloneSelections(selections: ExperienceSelections): ExperienceSelections {
  return { ...selections };
}

function DimensionQuestion({
  dimensionKey,
  selections,
  disabled,
  onSelect,
}: {
  dimensionKey: ExperienceDimensionKey;
  selections: ExperienceSelections;
  disabled: boolean;
  onSelect: (dimension: keyof ExperienceSelections, value: string) => void;
}) {
  const config = EXPERIENCE_DIMENSIONS[dimensionKey];
  const currentValue = selections[dimensionKey];

  return (
    <div
      role="group"
      aria-labelledby={`experience-${dimensionKey}-title`}
      className="flex min-h-[210px] min-w-0 flex-col rounded-sm border border-border-subtle bg-surface p-4"
    >
      <p id={`experience-${dimensionKey}-title`} className="text-sm font-semibold text-foreground">{config.label}</p>
      <p className="mt-1.5 text-sm leading-6 text-foreground-secondary">{config.question}</p>
      <div className="mt-4 flex flex-col items-start gap-2">
        {config.options.map((option) => {
          const selected = option === currentValue;
          return (
            <button
              key={option}
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
              onClick={() => onSelect(dimensionKey, option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PreQuoteExperienceItemConfigurator({
  item,
  draft,
  disabled = false,
  onCancel,
  onSave,
  onOpenChat,
}: {
  item: TechnicalProposalItem;
  draft: ItemExperienceDraft;
  disabled?: boolean;
  onCancel: () => void;
  onSave: (draft: ItemExperienceDraft) => void;
  onOpenChat: () => void;
}) {
  const [selections, setSelections] = useState<ExperienceSelections>(() => cloneSelections(draft.selections));
  const selectedSummary = getExperienceSelectionsSummary({ ...draft, selections }, 3);
  const blocks = [
    { type: "visual" as const },
    ...draft.relevantDimensions.map((dimensionKey) => ({ type: "dimension" as const, dimensionKey })),
  ];

  const selectValue = (dimension: keyof ExperienceSelections, value: string) => {
    if (disabled) return;
    setSelections((current) => ({ ...current, [dimension]: value }));
  };

  const save = () => {
    if (disabled) return;
    onSave({
      ...draft,
      selections,
      wasReviewedByUser: true,
    });
  };

  return (
    <Surface variant="subtle" className="space-y-4 border-brand">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles aria-hidden="true" className="text-brand" size={18} strokeWidth={1.75} />
            <h5 className="font-semibold text-foreground">Configurar experiencia</h5>
            <Badge tone="neutral" size="sm">Demo local</Badge>
          </div>
          <p className="mt-1 break-words text-sm text-foreground-secondary">
            {item.reference || `Elemento ${item.sequence}`} · {formatExperienceSpaceType(draft.spaceType)}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenChat}>
          <MessageCircle aria-hidden="true" size={15} />
          Consultar sobre este item
        </Button>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {blocks.map((block) => {
          if (block.type === "visual") {
            return (
              <div key="visual" className="min-w-0 self-start rounded-sm border border-border-subtle bg-surface p-3">
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
            );
          }

          return (
            <DimensionQuestion
              key={block.dimensionKey}
              dimensionKey={block.dimensionKey}
              selections={selections}
              disabled={disabled}
              onSelect={selectValue}
            />
          );
        })}
      </div>

      <div className="rounded-sm border border-border-subtle bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">Recomendacion SNG</p>
          <Badge tone="neutral" size="sm">Placeholder</Badge>
        </div>
        <p className="mt-2 text-sm text-foreground-secondary">
          {selectedSummary.length > 0 ? selectedSummary.join(" · ") : "Selecciona prioridades de experiencia."}
        </p>
        <p className="mt-1 text-xs text-foreground-secondary">
          Recomendamos esta combinacion por el tipo de vano y sus dimensiones. Es una guia demo y no altera la propuesta tecnica.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={disabled} onClick={save}>Guardar configuracion</Button>
      </div>
    </Surface>
  );
}