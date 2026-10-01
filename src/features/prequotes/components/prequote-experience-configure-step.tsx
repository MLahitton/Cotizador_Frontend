"use client";

import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { TechnicalProposalSummary } from "@/features/prequotes/components/technical-proposal-summary";
import type { ExperienceLocationFields, ItemExperienceDraft, ItemExperienceDrafts, RequirementExperienceCatalog } from "@/features/prequotes/prequote-experience-types";

type TechnicalProposalSummaryProps = ComponentProps<typeof TechnicalProposalSummary>;

type PreQuoteExperienceConfigureStepProps = TechnicalProposalSummaryProps & {
  experienceCatalog: RequirementExperienceCatalog | null;
  experienceDrafts: ItemExperienceDrafts;
  itemLocations: ExperienceLocationFields;
  experienceDisabled: boolean;
  finalAction: ReactNode;
  experienceDraftStatuses: Record<string, "idle" | "dirty" | "saving" | "saved" | "error" | "conflict" | "loading">;
  experienceDraftErrors: Record<string, string | null>;
  onChangeExperienceDraft: (draft: ItemExperienceDraft) => void;
  onSaveExperienceDraft: (draft: ItemExperienceDraft) => boolean | Promise<boolean>;
  onReloadExperienceDraft: (itemId: string) => void;
  onSaveItemLocation: (itemId: string, value: string) => void;
};

export function PreQuoteExperienceConfigureStep({
  experienceCatalog,
  experienceDrafts,
  itemLocations,
  experienceDisabled,
  finalAction,
  experienceDraftStatuses,
  experienceDraftErrors,
  onChangeExperienceDraft,
  onSaveExperienceDraft,
  onReloadExperienceDraft,
  onSaveItemLocation,
  ...props
}: PreQuoteExperienceConfigureStepProps) {
  const reviewedCount = props.proposal.items.filter((item) => experienceDrafts[item.itemId]?.hasServerDraft).length;

  return (
    <section aria-labelledby="experience-configure-title" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Paso 3 de 4 Â· Items 1-4 / {props.proposal.items.length}
          </p>
          <h3 id="experience-configure-title" className="mt-2 text-xl font-semibold text-foreground">Elementos del proyecto</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Revisados {reviewedCount} de {props.proposal.items.length}</Badge>
          <Badge tone="neutral">Preferencias backend</Badge>
        </div>
      </div>

      <TechnicalProposalSummary
        {...props}
        itemListVariant="experience"
        experienceCatalog={experienceCatalog}
        experienceDrafts={experienceDrafts}
        itemLocations={itemLocations}
        experienceDisabled={experienceDisabled}
        experienceFinalAction={finalAction}
        experienceDraftStatuses={experienceDraftStatuses}
        experienceDraftErrors={experienceDraftErrors}
        onChangeExperienceDraft={onChangeExperienceDraft}
        onSaveExperienceDraft={onSaveExperienceDraft}
        onReloadExperienceDraft={onReloadExperienceDraft}
        onSaveItemLocation={onSaveItemLocation}
      />
    </section>
  );
}
