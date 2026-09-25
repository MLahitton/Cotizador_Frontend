"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getExperienceTrendCounts } from "@/features/prequotes/prequote-experience-demo-config";
import type { ItemExperienceDraft, ItemExperienceDrafts } from "@/features/prequotes/prequote-experience-types";
import { formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal, TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

function itemTitle(item: TechnicalProposalItem): string {
  return item.reference ?? item.elementId ?? `Item ${item.sequence}`;
}

function itemSubtitle(item: TechnicalProposalItem, draft: ItemExperienceDraft | undefined): string {
  const values = [
    draft?.selections.view,
    draft?.selections.tranquility,
    draft?.selections.temperature,
    draft?.selections.security,
    item.selected?.system?.displayName ?? item.suggested.system?.displayName,
    item.selected?.glass?.displayName ?? item.suggested.glass?.displayName,
  ].filter((value): value is string => Boolean(value));
  return values.slice(0, 3).join(" · ") || "Configuracion comercial revisada";
}

function formatPriceRange(pricing: RequirementPricing): string | null {
  const { minimum, maximum } = pricing.estimatedSubtotal;
  if (minimum === null || maximum === null) return null;
  return `${formatRequirementMoney(minimum, pricing.currency)} - ${formatRequirementMoney(maximum, pricing.currency)}`;
}

export function PreQuoteExperienceSummaryStep({
  proposal,
  pricing,
  experienceDrafts,
  onBackToConfigure,
}: {
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
  experienceDrafts: ItemExperienceDrafts;
  onBackToConfigure: () => void;
}) {
  const includedItems = proposal.items.filter((item) => item.isIncluded);
  const trends = getExperienceTrendCounts(
    proposal.items
      .map((item) => experienceDrafts[item.itemId])
      .filter((draft): draft is NonNullable<typeof draft> => Boolean(draft)),
  ).slice(0, 4);
  const range = pricing ? formatPriceRange(pricing) : null;
  const confidenceText = pricing
    ? pricing.requiresReview
      ? "Sujeta a revision"
      : pricing.isCompleteTotal
        ? "Completa"
        : "Parcial"
    : "Sin pricing";

  return (
    <section aria-labelledby="experience-summary-items" className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {trends.length > 0 ? trends.map((trend) => (
          <Badge key={trend.value} tone="brand">{trend.value}</Badge>
        )) : (
          <>
            <Badge tone="neutral">Maxima vista</Badge>
            <Badge tone="neutral">Alta tranquilidad</Badge>
            <Badge tone="neutral">Confort termico</Badge>
            <Badge tone="neutral">Seguridad</Badge>
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Surface variant="elevated" padding="lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Resumen por espacios/items</p>
              <h3 id="experience-summary-items" className="mt-2 text-xl font-semibold text-foreground">Elementos incluidos</h3>
            </div>
            <Badge tone="success" size="sm">{includedItems.length} OK</Badge>
          </div>

          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-sm border border-border-subtle bg-surface">
            {includedItems.map((item) => (
              <div key={item.itemId} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">{itemTitle(item)}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">{item.description}</p>
                </div>
                <p className="min-w-0 break-words text-sm leading-6 text-foreground-secondary">
                  {itemSubtitle(item, experienceDrafts[item.itemId])}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                  <CheckCircle2 aria-hidden="true" size={16} strokeWidth={1.75} />
                  OK
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface variant="elevated" padding="lg" className="border-brand/40 bg-brand-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Orden de inversion</p>
              <p className="mt-3 break-words text-3xl font-semibold text-foreground">
                {pricing ? formatRequirementMoney(pricing.estimatedSubtotal.expected, pricing.currency) : "Pendiente"}
              </p>
            </div>
            <WalletCards aria-hidden="true" className="shrink-0 text-brand" size={24} strokeWidth={1.75} />
          </div>

          {range ? (
            <p className="mt-4 text-sm leading-6 text-foreground-secondary">Rango estimado: {range}</p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-foreground-secondary">No hay rango disponible para esta estimacion.</p>
          )}

          <dl className="mt-5 grid gap-3">
            <div className="rounded-sm border border-border-subtle bg-surface p-3">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">Estimacion global</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{pricing ? `${pricing.pricedItemCount}/${pricing.itemCount} items con precio` : "Sin pricing"}</dd>
            </div>
            <div className="rounded-sm border border-border-subtle bg-surface p-3">
              <dt className="text-xs font-semibold uppercase text-foreground-secondary">Confianza</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{confidenceText}</dd>
            </div>
          </dl>

          <Button type="button" disabled className="mt-5 w-full">
            Solicitar propuesta final
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
          </Button>
          <p className="mt-2 text-center text-xs text-foreground-secondary">Proximamente</p>
        </Surface>
      </div>

      <Surface variant="subtle" className="border-border-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles aria-hidden="true" className="text-brand" size={17} strokeWidth={1.75} />
              Lectura final lista
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Puedes volver a configurar sin perder selecciones reales ni preferencias locales del wizard.
            </p>
          </div>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBackToConfigure}>
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a configurar
          </Button>
        </div>
      </Surface>
    </section>
  );
}