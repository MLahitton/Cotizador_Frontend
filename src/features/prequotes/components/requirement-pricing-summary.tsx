import { CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";

export function RequirementPricingSummary({ pricing }: { pricing: RequirementPricing }) {
  return (
    <section aria-labelledby="requirement-pricing-title">
      <Surface variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand">Precotización</p>
            <h3 id="requirement-pricing-title" className="mt-1 text-xl font-semibold text-foreground">Estimación económica</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {!pricing.isCompleteTotal ? <Badge tone="warning">Total parcial</Badge> : null}
            {pricing.requiresReview ? <Badge tone="warning">Sujeta a revisión</Badge> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-sm bg-brand-soft p-4">
            <p className="text-xs font-semibold uppercase text-foreground-secondary">Subtotal esperado</p>
            <p className="mt-2 break-words text-2xl font-semibold text-foreground">
              {formatRequirementMoney(pricing.estimatedSubtotal.expected, pricing.currency)}
            </p>
            <p className="mt-2 text-sm text-foreground-secondary">
              Rango estimado: {formatRequirementMoney(pricing.estimatedSubtotal.minimum, pricing.currency)} – {formatRequirementMoney(pricing.estimatedSubtotal.maximum, pricing.currency)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">Items con precio</dt><dd className="mt-1 text-xl font-semibold text-foreground">{pricing.pricedItemCount}</dd></div>
            <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">Pendientes</dt><dd className="mt-1 text-xl font-semibold text-foreground">{pricing.notPriceableItemCount}</dd></div>
          </dl>
        </div>

        <p className="mt-4 text-sm text-foreground-secondary">
          {pricing.pricedItemCount} de {pricing.itemCount} items con precio · {pricing.notPriceableItemCount} pendientes
        </p>
        {!pricing.isCompleteTotal ? (
          <p className="mt-3 flex items-start gap-2 rounded-sm border border-warning bg-warning-soft p-3 text-sm leading-6 text-warning">
            <CircleAlert aria-hidden="true" className="mt-1 shrink-0" size={16} />
            El total es parcial porque algunos elementos aún no tienen una configuración completa.
          </p>
        ) : null}
      </Surface>
    </section>
  );
}
