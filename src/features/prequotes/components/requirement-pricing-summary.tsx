import { CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";

function formatDeltaMoney(value: number | null, currency: string): string {
  if (value === null) return "No disponible";
  if (value === 0) return "$0";
  const formatted = formatRequirementMoney(Math.abs(value), currency);
  return `${value > 0 ? "+" : "-"}${formatted}`;
}

function deltaTone(value: number | null): string {
  if (value === null || value === 0) return "text-foreground";
  return value > 0 ? "text-warning" : "text-success";
}

export function RequirementPricingSummary({ pricing }: { pricing: RequirementPricing }) {
  const subtotalLabel = pricing.isCompleteTotal ? "Subtotal esperado" : "Subtotal parcial esperado";
  const hasSnapshot = pricing.originalGrandTotal !== null || pricing.currentGrandTotal !== null || pricing.deltaGrandTotal !== null;
  return (
    <section aria-labelledby="requirement-pricing-title">
      <Surface variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand">Precotizacion</p>
            <h3 id="requirement-pricing-title" className="mt-1 text-xl font-semibold text-foreground">Estimacion economica</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {!pricing.isCompleteTotal ? <Badge tone="warning">Total parcial</Badge> : null}
            {pricing.requiresReview ? <Badge tone="warning">Sujeta a revision</Badge> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-sm bg-brand-soft p-4">
            {hasSnapshot ? (
              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase text-foreground-secondary">Total original</dt>
                  <dd className="mt-2 break-words text-2xl font-semibold text-foreground">{formatRequirementMoney(pricing.originalGrandTotal, pricing.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-foreground-secondary">Total actual</dt>
                  <dd className="mt-2 break-words text-2xl font-semibold text-foreground">{formatRequirementMoney(pricing.currentGrandTotal, pricing.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-foreground-secondary">Variacion total</dt>
                  <dd className={`mt-2 break-words text-2xl font-semibold ${deltaTone(pricing.deltaGrandTotal)}`}>{formatDeltaMoney(pricing.deltaGrandTotal, pricing.currency)}</dd>
                </div>
              </dl>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase text-foreground-secondary">{subtotalLabel}</p>
                <p className="mt-2 break-words text-2xl font-semibold text-foreground">
                  {formatRequirementMoney(pricing.estimatedSubtotal.expected, pricing.currency)}
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-foreground-secondary">
              Rango estimado: {formatRequirementMoney(pricing.estimatedSubtotal.minimum, pricing.currency)} - {formatRequirementMoney(pricing.estimatedSubtotal.maximum, pricing.currency)}
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
            El subtotal es parcial: los elementos pendientes no estan incluidos en este valor.
          </p>
        ) : null}
      </Surface>
    </section>
  );
}
