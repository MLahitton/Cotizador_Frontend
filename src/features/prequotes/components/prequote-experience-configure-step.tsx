"use client";

import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { TechnicalProposalSummary } from "@/features/prequotes/components/technical-proposal-summary";
import type { ExperienceLocationFields, ItemExperienceDraft, ItemExperienceDrafts } from "@/features/prequotes/prequote-experience-types";

type TechnicalProposalSummaryProps = ComponentProps<typeof TechnicalProposalSummary>;

type PreQuoteExperienceConfigureStepProps = TechnicalProposalSummaryProps & {
  experienceDrafts: ItemExperienceDrafts;
  itemLocations: ExperienceLocationFields;
  experienceDisabled: boolean;
  finalAction: ReactNode;
  onSaveExperienceDraft: (draft: ItemExperienceDraft) => void;
  onSaveItemLocation: (itemId: string, value: string) => void;
};

export function PreQuoteExperienceConfigureStep({
  experienceDrafts,
  itemLocations,
  experienceDisabled,
  finalAction,
  onSaveExperienceDraft,
  onSaveItemLocation,
  ...props
}: PreQuoteExperienceConfigureStepProps) {
  const reviewedCount = props.proposal.items.filter((item) => experienceDrafts[item.itemId]?.wasReviewedByUser).length;

  return (
    <section aria-labelledby="experience-configure-title" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Paso 3 de 4 · Items 1-4 / {props.proposal.items.length}
          </p>
          <h3 id="experience-configure-title" className="mt-2 text-xl font-semibold text-foreground">Elementos del proyecto</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Revisados {reviewedCount} de {props.proposal.items.length}</Badge>
          <Badge tone="neutral">Demo local</Badge>
        </div>
      </div>

      <TechnicalProposalSummary
        {...props}
        itemListVariant="experience"
        experienceDrafts={experienceDrafts}
        itemLocations={itemLocations}
        experienceDisabled={experienceDisabled}
        experienceFinalAction={finalAction}
        onSaveExperienceDraft={onSaveExperienceDraft}
        onSaveItemLocation={onSaveItemLocation}
      />
    </section>
  );
}