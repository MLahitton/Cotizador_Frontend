import { CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatEconomicCompleteness,
  formatNullableDraftText,
  formatPreQuoteDraftArea,
  formatPreQuoteDraftConfidenceScore,
  formatPreQuoteDraftMoney,
  formatPreQuoteDraftNumber,
  formatPreQuotePricingConfidenceLevel,
  formatPreQuotePricingNoteCode,
} from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftEconomicSummary as PreQuoteDraftEconomicSummaryModel } from "@/features/prequotes/prequote-draft-types";
import { cn } from "@/lib/utils/cn";

type AmountRange = {
  label: string;
  minimum: number | null;
  expected: number | null;
  maximum: number | null;
  emphasis?: boolean;
};

function AmountValue({
  label,
  value,
  currency,
  emphasis = false,
}: {
  label: string;
  value: number | null;
  currency: string | null;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 break-words font-semibold text-foreground [overflow-wrap:anywhere]",
          emphasis ? "text-xl sm:text-2xl" : "text-base",
        )}
      >
        {formatPreQuoteDraftMoney(value, currency)}
      </dd>
    </div>
  );
}

function RangeCard({
  currency,
  expected,
  maximum,
  minimum,
  label,
  emphasis = false,
}: AmountRange & { currency: string | null }) {
  return (
    <article
      className={cn(
        "min-w-0 rounded-sm border border-border-subtle bg-surface p-4",
        emphasis && "bg-brand-soft",
      )}
    >
      <h3 className="break-words text-sm font-semibold text-foreground">
        {label}
      </h3>
      <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
        <AmountValue label="Minimo" value={minimum} currency={currency} />
        <AmountValue
          label="Esperado"
          value={expected}
          currency={currency}
          emphasis={emphasis}
        />
        <AmountValue label="Maximo" value={maximum} currency={currency} />
      </dl>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-sm bg-surface-subtle p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-lg font-semibold text-foreground [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

function WarningMessage({ children }: { children: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-sm border border-warning bg-warning-soft p-3 text-warning">
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        size={18}
        strokeWidth={1.75}
      />
      <p className="min-w-0 break-words text-sm leading-6 [overflow-wrap:anywhere]">
        {children}
      </p>
    </div>
  );
}

function PricingNoteList({
  emptyMessage,
  tone,
  values,
}: {
  emptyMessage: string;
  tone: "neutral" | "warning";
  values: string[];
}) {
  if (values.length === 0) {
    return (
      <p className="text-sm leading-6 text-foreground-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {values.map((code, index) => (
        <li
          key={`${code}-${index}`}
          className={cn(
            "min-w-0 rounded-sm bg-surface-subtle p-3 text-sm leading-6",
            tone === "warning" ? "text-warning" : "text-foreground-secondary",
          )}
        >
          <span className="block break-words text-foreground [overflow-wrap:anywhere]">
            {formatPreQuotePricingNoteCode(code)}
          </span>
          <code className="mt-1 block break-words text-xs text-foreground-secondary [overflow-wrap:anywhere]">
            Codigo: {code}
          </code>
        </li>
      ))}
    </ul>
  );
}

export function PreQuoteDraftEconomicSummary({
  economicSummary,
}: {
  economicSummary: PreQuoteDraftEconomicSummaryModel;
}) {
  const finalRange = {
    label: "Total estimado de la precotizacion",
    minimum: economicSummary.finalMinimum,
    expected: economicSummary.finalExpected,
    maximum: economicSummary.finalMaximum,
    emphasis: true,
  } satisfies AmountRange;

  const breakdown = [
    {
      label: "Subtotal tecnico",
      minimum: economicSummary.minimumTechnicalSubtotal,
      expected: economicSummary.expectedTechnicalSubtotal,
      maximum: economicSummary.maximumTechnicalSubtotal,
    },
    {
      label: "Transporte",
      minimum: economicSummary.transportMinimum,
      expected: economicSummary.transportExpected,
      maximum: economicSummary.transportMaximum,
    },
    {
      label: "Administracion",
      minimum: economicSummary.administrationMinimum,
      expected: economicSummary.administrationExpected,
      maximum: economicSummary.administrationMaximum,
    },
    {
      label: "Contingencia",
      minimum: economicSummary.contingencyMinimum,
      expected: economicSummary.contingencyExpected,
      maximum: economicSummary.contingencyMaximum,
    },
    {
      label: "Utilidad",
      minimum: economicSummary.profitMinimum,
      expected: economicSummary.profitExpected,
      maximum: economicSummary.profitMaximum,
    },
    {
      label: "IVA",
      minimum: economicSummary.vatMinimum,
      expected: economicSummary.vatExpected,
      maximum: economicSummary.vatMaximum,
    },
    {
      label: "Total final",
      minimum: economicSummary.finalMinimum,
      expected: economicSummary.finalExpected,
      maximum: economicSummary.finalMaximum,
      emphasis: true,
    },
  ] satisfies AmountRange[];

  const metrics = [
    ["Items incluidos", formatPreQuoteDraftNumber(economicSummary.includedItemCount)],
    [
      "Unidades conocidas",
      formatPreQuoteDraftNumber(economicSummary.includedKnownQuoteableUnitCount),
    ],
    ["Items valorados", formatPreQuoteDraftNumber(economicSummary.valuedItemCount)],
    [
      "Pendientes",
      formatPreQuoteDraftNumber(economicSummary.pendingValuationItemCount),
    ],
    [
      "Desactualizados",
      formatPreQuoteDraftNumber(economicSummary.staleValuationItemCount),
    ],
    [
      "No cotizables",
      formatPreQuoteDraftNumber(economicSummary.notPriceableItemCount),
    ],
    [
      "Estado no cotizable",
      economicSummary.hasNotPriceableItems
        ? "Con items no cotizables"
        : "Sin items no cotizables",
    ],
    [
      "Requieren revision",
      formatPreQuoteDraftNumber(economicSummary.itemsRequiringReviewCount),
    ],
    ["Area total", formatPreQuoteDraftArea(economicSummary.totalAreaSquareMeters)],
    ["Moneda", formatNullableDraftText(economicSummary.currency)],
  ] as const;

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-economic-title">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="draft-economic-title"
              className="text-lg font-semibold text-foreground"
            >
              Resumen economico
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Valores globales entregados por Backend para este borrador.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <Badge
              tone={
                economicSummary.isEconomicallyComplete ? "success" : "warning"
              }
              size="sm"
            >
              {formatEconomicCompleteness(
                economicSummary.isEconomicallyComplete,
              )}
            </Badge>
            {economicSummary.hasLimitedPricingScope ? (
              <Badge tone="warning" size="sm">
                Alcance limitado
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <RangeCard {...finalRange} currency={economicSummary.currency} />
        </div>

        <dl className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Confianza global"
            value={`${formatPreQuoteDraftConfidenceScore(
              economicSummary.overallConfidence,
            )} · ${formatPreQuotePricingConfidenceLevel(
              economicSummary.confidenceLevel,
            )}`}
          />
          <Metric
            label="Completitud"
            value={formatEconomicCompleteness(
              economicSummary.isEconomicallyComplete,
            )}
          />
          <Metric
            label="Subtotal de vidrio"
            value={formatPreQuoteDraftMoney(
              economicSummary.glassSubtotal,
              economicSummary.currency,
            )}
          />
        </dl>

        <div className="mt-5 grid min-w-0 gap-3">
          {economicSummary.hasLimitedPricingScope ? (
            <WarningMessage>
              El alcance economico es limitado.
            </WarningMessage>
          ) : null}
          {economicSummary.hasNotPriceableItems ? (
            <WarningMessage>
              El borrador contiene items que actualmente no tienen valoracion
              cotizable.
            </WarningMessage>
          ) : null}
        </div>

        <section className="mt-6 min-w-0" aria-labelledby="draft-economic-state">
          <h3
            id="draft-economic-state"
            className="text-sm font-semibold text-foreground"
          >
            Estado de la valoracion
          </h3>
          <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {metrics.map(([label, value]) => (
              <Metric key={label} label={label} value={value} />
            ))}
          </dl>
        </section>

        <section
          className="mt-6 min-w-0"
          aria-labelledby="draft-economic-breakdown"
        >
          <h3
            id="draft-economic-breakdown"
            className="text-sm font-semibold text-foreground"
          >
            Desglose economico
          </h3>
          <div className="mt-3 grid min-w-0 gap-3">
            {breakdown.map((item) => (
              <RangeCard
                key={item.label}
                {...item}
                currency={economicSummary.currency}
              />
            ))}
          </div>
        </section>

        <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-2">
          <section className="min-w-0" aria-labelledby="draft-assumptions">
            <h3
              id="draft-assumptions"
              className="text-sm font-semibold text-foreground"
            >
              Supuestos economicos
            </h3>
            <div className="mt-3">
              <PricingNoteList
                emptyMessage="Sin supuestos economicos globales registrados."
                tone="neutral"
                values={economicSummary.assumptions}
              />
            </div>
          </section>

          <section className="min-w-0" aria-labelledby="draft-missing-data">
            <h3
              id="draft-missing-data"
              className="text-sm font-semibold text-foreground"
            >
              Datos economicos faltantes
            </h3>
            <div className="mt-3">
              <PricingNoteList
                emptyMessage="Sin datos economicos faltantes registrados."
                tone="warning"
                values={economicSummary.missingData}
              />
            </div>
          </section>
        </div>
      </section>
    </Surface>
  );
}
