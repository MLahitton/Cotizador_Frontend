"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { EXPERIENCE_DIMENSIONS, formatExperienceSpaceType, getExperienceSelectionsSummary } from "@/features/prequotes/prequote-experience-demo-config";
import type { ExperienceSelections, ItemExperienceDraft } from "@/features/prequotes/prequote-experience-types";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import { cn } from "@/lib/utils/cn";

function cloneSelections(selections: ExperienceSelections): ExperienceSelections {
  return { ...selections };
}

export function PreQuoteExperienceItemConfigurator({
  item,
  draft,
  onCancel,
  onSave,
  onOpenChat,
}: {
  item: TechnicalProposalItem;
  draft: ItemExperienceDraft;
  onCancel: () => void;
  onSave: (draft: ItemExperienceDraft) => void;
  onOpenChat: () => void;
}) {
  const [selections, setSelections] = useState<ExperienceSelections>(() => cloneSelections(draft.selections));
  const selectedSummary = getExperienceSelectionsSummary({ ...draft, selections }, 3);

  const selectValue = (dimension: keyof ExperienceSelections, value: string) => {
    setSelections((current) => ({ ...current, [dimension]: value }));
  };

  const save = () => {
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

      <div className="grid gap-4 xl:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)]">
        <div className="min-w-0">
          {item.visualModel ? (
            <TechnicalProposalVisualPreview visualModel={item.visualModel} />
          ) : (
            <div className="flex aspect-[4/3] min-h-36 items-center justify-center rounded-sm border border-dashed border-border bg-surface p-4 text-center text-sm text-foreground-secondary">
              Visual pendiente
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {draft.relevantDimensions.map((dimensionKey) => {
            const config = EXPERIENCE_DIMENSIONS[dimensionKey];
            const currentValue = selections[dimensionKey];

            return (
              <fieldset key={dimensionKey} className="min-w-0 rounded-sm border border-border-subtle bg-surface p-3">
                <legend className="px-1 text-sm font-semibold text-foreground">{config.label}</legend>
                <p className="mt-1 text-sm leading-6 text-foreground-secondary">{config.question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.options.map((option) => {
                    const selected = option === currentValue;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                          selected
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-surface-subtle text-foreground-secondary hover:border-brand hover:text-foreground",
                        )}
                        onClick={() => selectValue(dimensionKey, option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
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
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="button" onClick={save}>Guardar configuracion</Button>
      </div>
    </Surface>
  );
}