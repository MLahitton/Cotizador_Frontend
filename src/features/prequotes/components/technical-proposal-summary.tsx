import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalItemCard } from "@/features/prequotes/components/technical-proposal-item-card";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal } from "@/features/prequotes/technical-proposal-types";

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt><dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd></div>;
}

export function TechnicalProposalSummary({ proposal, pricing }: {
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
}) {
  const pricingByProposalItemId = new Map(
    pricing?.items.map((item) => [item.proposalItemId, item]) ?? [],
  );
  return (
    <section aria-labelledby="technical-proposal-title" className="space-y-4">
      <Surface variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm font-medium text-brand">NEWPIPE</p><h3 id="technical-proposal-title" className="mt-1 text-xl font-semibold text-foreground">Propuesta técnica</h3></div>
          <Badge tone={proposal.itemsRequiringReview > 0 ? "warning" : "success"}>{proposal.itemsRequiringReview > 0 ? "Requiere revisión" : "Lista"}</Badge>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Elementos encontrados" value={proposal.itemCount} />
          <Metric label="Técnicamente completos" value={proposal.technicallyCompleteItems} />
          <Metric label="Listos para cotizar" value={proposal.priceableItems} />
          <Metric label="Requieren revisión" value={proposal.itemsRequiringReview} />
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
