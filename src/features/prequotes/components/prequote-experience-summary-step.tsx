"use client";

import { ArrowLeft, CheckCircle2, Eye, ShieldCheck, Sparkles, Thermometer, Volume2, WalletCards } from "lucide-react";
import { useState, type ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getExperienceTrendCounts } from "@/features/prequotes/prequote-experience-demo-config";
import type { ExperienceLocationFields, ItemExperienceDraft, ItemExperienceDrafts } from "@/features/prequotes/prequote-experience-types";
import { formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal, TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

const SUMMARY_ITEMS_PER_PAGE = 6;

type TrendIcon = ComponentType<{ "aria-hidden": true; size: number; strokeWidth?: number; className?: string }>;

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

function trendIcon(value: string): TrendIcon {
  const normalized = value.toLowerCase();
  if (normalized.includes("vista") || normalized.includes("amplitud")) return Eye;
  if (normalized.includes("tranquil") || normalized.includes("ruido")) return Volume2;
  if (normalized.includes("confort") || normalized.includes("temperatura")) return Thermometer;
  if (normalized.includes("segur") || normalized.includes("reforz") || normalized === "alta") return ShieldCheck;
  return Sparkles;
}

export function PreQuoteExperienceSummaryStep({
  proposal,
  pricing,
  experienceDrafts,
  itemLocations,
  onBackToConfigure,
}: {
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
  experienceDrafts: ItemExperienceDrafts;
  itemLocations: ExperienceLocationFields;
  onBackToConfigure: () => void;
}) {
  const [page, setPage] = useState(0);
  const includedItems = proposal.items.filter((item) => item.isIncluded);
  const pageCount = Math.max(1, Math.ceil(includedItems.length / SUMMARY_ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const startIndex = safePage * SUMMARY_ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + SUMMARY_ITEMS_PER_PAGE, includedItems.length);
  const visibleItems = includedItems.slice(startIndex, endIndex);
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

  const goPrevious = () => setPage((current) => Math.max(0, Math.min(current, pageCount - 1) - 1));
  const goNext = () => setPage((current) => Math.min(pageCount - 1, Math.min(current, pageCount - 1) + 1));

  return (
    <section aria-labelledby="experience-summary-items" className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trends.length > 0 ? trends.map((trend) => {
          const Icon = trendIcon(trend.value);
          return (
            <div key={trend.value} className="rounded-sm border border-border-subtle bg-surface p-3">
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon aria-hidden={true} size={16} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-foreground">{trend.value}</p>
                  <p className="mt-1 text-xs text-foreground-secondary">{trend.count} {trend.count === 1 ? "item" : "items"}</p>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="rounded-sm border border-border-subtle bg-surface p-3 sm:col-span-2 lg:col-span-4">
            <p className="text-sm font-semibold text-foreground">Sin tendencias seleccionadas</p>
            <p className="mt-1 text-xs text-foreground-secondary">Configura experiencia por item para ver agregaciones reales.</p>
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Surface variant="elevated" padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Resumen por espacios/items</p>
              <h3 id="experience-summary-items" className="mt-2 text-xl font-semibold text-foreground">Elementos incluidos</h3>
              <p className="mt-1 text-sm text-foreground-secondary">Items {startIndex + 1}-{endIndex} de {includedItems.length}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={safePage === 0} onClick={goPrevious}>Anterior</Button>
              <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={goNext}>Siguiente</Button>
            </div>
          </div>

          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-sm border border-border-subtle bg-surface">
            {visibleItems.map((item) => (
              <div key={item.itemId} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">{itemTitle(item)}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">{itemLocations[item.itemId]?.value ?? "Ubicacion por confirmar"}</p>
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

        <Surface variant="elevated" padding="lg" className="h-fit self-start border-brand/40 bg-brand-soft">
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