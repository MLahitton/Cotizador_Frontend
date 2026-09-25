"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PreQuoteExperienceItemCard } from "@/features/prequotes/components/prequote-experience-item-card";
import { mergeExperienceDraftWithItem } from "@/features/prequotes/prequote-experience-demo-config";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { ItemExperienceDraft, ItemExperienceDrafts } from "@/features/prequotes/prequote-experience-types";
import type { RequirementChatActionPlan } from "@/features/prequotes/requirement-chat-types";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";

const ITEMS_PER_PAGE = 4;

export function PreQuoteExperienceItemPager({
  items,
  requirementId,
  pricing,
  readOnly = false,
  selectionCatalog,
  selectionCatalogLoading,
  selectionCatalogError,
  onRetrySelectionCatalog,
  savingSelectionItemIds,
  selectionErrorMessages,
  onSaveSelection,
  onClearSelectionError,
  onChatActionExecuted,
  onUpdateInclusion,
  commercialMutationDisabled,
  recentChatAction,
  experienceDrafts,
  finalAction,
  onSaveExperienceDraft,
}: {
  items: TechnicalProposalItem[];
  requirementId: string;
  pricing: RequirementPricing | null;
  readOnly?: boolean;
  selectionCatalog: TechnicalSelectionCatalog | null;
  selectionCatalogLoading: boolean;
  selectionCatalogError: string | null;
  onRetrySelectionCatalog: () => void;
  savingSelectionItemIds: string[];
  selectionErrorMessages: Record<string, string>;
  onSaveSelection: (itemId: string, request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
  onClearSelectionError: (itemId: string) => void;
  onChatActionExecuted: (result: RequirementChatActionPlan) => void | Promise<void>;
  onUpdateInclusion: (itemId: string, isIncluded: boolean, reason?: string | null) => boolean | Promise<boolean>;
  commercialMutationDisabled: boolean;
  recentChatAction: { itemIds: string[]; pricingStatus: string | null } | null;
  experienceDrafts: ItemExperienceDrafts;
  finalAction?: ReactNode;
  onSaveExperienceDraft: (draft: ItemExperienceDraft) => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
  const pricingByProposalItemId = useMemo(
    () => new Map(pricing?.items.map((item) => [item.proposalItemId, item]) ?? []),
    [pricing],
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const isLastPage = safePage >= pageCount - 1;

  const goPrevious = () => setPage((current) => Math.max(0, Math.min(current, pageCount - 1) - 1));
  const goNext = () => setPage((current) => Math.min(pageCount - 1, Math.min(current, pageCount - 1) + 1));

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4 text-sm text-foreground-secondary">
        No hay elementos para mostrar con el filtro actual.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground-secondary">
          Items {startIndex + 1}-{endIndex} de {items.length}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={safePage === 0} onClick={goPrevious}>
            <ChevronLeft aria-hidden="true" size={16} />
            Anterior
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={goNext}>
            Siguiente
            <ChevronRight aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {visibleItems.map((item) => (
          <PreQuoteExperienceItemCard
            key={item.itemId}
            item={item}
            requirementId={requirementId}
            pricing={pricingByProposalItemId.get(item.itemId) ?? null}
            currency={pricing?.currency ?? null}
            readOnly={readOnly}
            selectionCatalog={selectionCatalog}
            selectionCatalogLoading={selectionCatalogLoading}
            selectionCatalogError={selectionCatalogError}
            onRetrySelectionCatalog={onRetrySelectionCatalog}
            isSavingSelection={savingSelectionItemIds.includes(item.itemId)}
            selectionErrorMessage={selectionErrorMessages[item.itemId] ?? null}
            onSaveSelection={(request) => onSaveSelection(item.itemId, request)}
            onClearSelectionError={() => onClearSelectionError(item.itemId)}
            onChatActionExecuted={onChatActionExecuted}
            onUpdateInclusion={(isIncluded, reason) => onUpdateInclusion(item.itemId, isIncluded, reason)}
            commercialMutationDisabled={commercialMutationDisabled}
            recentChatActionPricingStatus={recentChatAction?.itemIds.includes(item.itemId) ? recentChatAction.pricingStatus : undefined}
            experienceDraft={mergeExperienceDraftWithItem(item, experienceDrafts[item.itemId])}
            onSaveExperienceDraft={onSaveExperienceDraft}
          />
        ))}
      </div>

      {isLastPage && finalAction ? (
        <div className="border-t border-border-subtle pt-5">
          {finalAction}
        </div>
      ) : null}
    </div>
  );
}