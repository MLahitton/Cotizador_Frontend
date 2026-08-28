import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalItemCard } from "@/features/prequotes/components/technical-proposal-item-card";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal, TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import { calculateProposalPhysicalTotals, formatProposalAreaM2 } from "@/features/prequotes/technical-proposal-formatters";

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-sm border border-border bg-brand-soft p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt><dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd></div>;
}
type ReadinessFilter = "ALL" | "BLOCKING" | "WARNING" | "READY";

const readinessFilterLabels: Record<ReadinessFilter, string> = {
  ALL: "Todos",
  BLOCKING: "Conviene revisar",
  WARNING: "Advertencias",
  READY: "Listos",
};

function itemMatchesFilter(item: TechnicalProposalItem, filter: ReadinessFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "BLOCKING") return item.readiness.blockingCount > 0;
  if (filter === "WARNING") return item.readiness.blockingCount === 0 && item.readiness.warningCount > 0;
  return item.readiness.state === "READY";
}

function readinessTone(state: string): "success" | "warning" | "neutral" {
  if (state === "READY") return "success";
  if (state === "BLOCKED" || state === "REVIEW_REQUIRED") return "warning";
  return "neutral";
}

function readinessLabel(state: string): string {
  if (state === "READY") return "Listo";
  if (state === "REVIEW_REQUIRED") return "Revisar";
  if (state === "BLOCKED") return "Conviene revisar";
  return state;
}

function ReadinessSummary({ proposal, onFilterChange, activeFilter }: {
  proposal: TechnicalProposal;
  activeFilter: ReadinessFilter;
  onFilterChange: (filter: ReadinessFilter) => void;
}) {
  const categoryText = Object.entries(proposal.readiness.categories)
    .map(([category, count]) => `${count} ${category.toLowerCase()}`)
    .join(" · ");
  const hasPricingBlockers = proposal.readiness.pricingBlockingDefinitions > 0;
  const hasConfirmationReview = proposal.readiness.blockingDefinitions > 0;

  return (
    <Surface variant="elevated" padding="lg" className={hasConfirmationReview || hasPricingBlockers ? "border-warning" : "border-success"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Estado tecnico comercial</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {hasPricingBlockers
              ? `${proposal.readiness.pricingBlockingItems} items bloquean pricing`
              : hasConfirmationReview
                ? `${proposal.readiness.blockingItems} items conviene revisar`
                : "Configuracion tecnica completa"}
          </h3>
          <p className="mt-2 text-sm text-foreground-secondary">
            {hasPricingBlockers
              ? categoryText || "Hay definiciones necesarias para calcular precio."
              : hasConfirmationReview
                ? categoryText || "Hay definiciones para revisar antes de confirmar."
                : "Ya puedes confirmar y pasar a pricing."}
          </p>
        </div>
        <Badge tone={readinessTone(proposal.readiness.state)}>{readinessLabel(proposal.readiness.state)}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(readinessFilterLabels) as ReadinessFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${activeFilter === filter ? "border-brand bg-brand text-white" : "border-border bg-surface text-foreground-secondary hover:border-brand"}`}
          >
            {readinessFilterLabels[filter]}
          </button>
        ))}
      </div>
    </Surface>
  );
}


export function TechnicalProposalSummary({ proposal, pricing, savingSelectionItemIds, selectionErrorMessages, onSaveSelection }: {
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
  savingSelectionItemIds: string[];
  selectionErrorMessages: Record<string, string>;
  onSaveSelection: (itemId: string, request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
}) {
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("ALL");
  const pricingByProposalItemId = new Map(
    pricing?.items.map((item) => [item.proposalItemId, item]) ?? [],
  );
  const physicalTotals = calculateProposalPhysicalTotals(proposal.items);
  const visibleItems = useMemo(() => proposal.items.filter((item) => itemMatchesFilter(item, readinessFilter)), [proposal.items, readinessFilter]);
  return (
    <section aria-labelledby="technical-proposal-title" className="space-y-4">
      <Surface variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 id="technical-proposal-title" className="text-xl font-semibold text-foreground">Propuesta tecnica</h3></div>
          <Badge tone={proposal.itemsRequiringReview > 0 ? "warning" : "success"}>{proposal.itemsRequiringReview > 0 ? "Requiere revision" : "Lista"}</Badge>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Elementos encontrados" value={proposal.itemCount} />
          <Metric label="Estructuras cotizadas" value={physicalTotals.structureCount} />
          <Metric label="Metros cuadrados totales" value={formatProposalAreaM2(physicalTotals.totalAreaM2)} />
          <Metric label="Tecnicamente completos" value={proposal.technicallyCompleteItems} />
          <Metric label="Listos para cotizar" value={proposal.priceableItems} />
          <Metric label="Requieren revision" value={proposal.itemsRequiringReview} />
        </dl>
      </Surface>
      <ReadinessSummary proposal={proposal} activeFilter={readinessFilter} onFilterChange={setReadinessFilter} />
      <div>
        <h3 className="text-lg font-semibold text-foreground">Elementos</h3>
        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <TechnicalProposalItemCard
              key={item.itemId}
              item={item}
              pricing={pricingByProposalItemId.get(item.itemId) ?? null}
              currency={pricing?.currency ?? null}
              isSavingSelection={savingSelectionItemIds.includes(item.itemId)}
              selectionErrorMessage={selectionErrorMessages[item.itemId] ?? null}
              onSaveSelection={(request) => onSaveSelection(item.itemId, request)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
