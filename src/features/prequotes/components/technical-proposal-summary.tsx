import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalItemCard } from "@/features/prequotes/components/technical-proposal-item-card";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import { calculateProposalPhysicalTotals, formatProposalAreaM2 } from "@/features/prequotes/technical-proposal-formatters";

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-sm border border-border bg-brand-soft p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt><dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd></div>;
}

export function TechnicalProposalSummary({ proposal, pricing, savingSelectionItemIds, selectionErrorMessages, onSaveSelection }: {
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
  savingSelectionItemIds: string[];
  selectionErrorMessages: Record<string, string>;
  onSaveSelection: (itemId: string, request: TechnicalProposalSelectionRequest) => void;
}) {
  const pricingByProposalItemId = new Map(
    pricing?.items.map((item) => [item.proposalItemId, item]) ?? [],
  );
  const physicalTotals = calculateProposalPhysicalTotals(proposal.items);
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
      <div>
        <h3 className="text-lg font-semibold text-foreground">Elementos</h3>
        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
          {proposal.items.map((item) => (
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
