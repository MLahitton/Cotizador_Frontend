import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatAggregationIssue,
  formatAreaSquareMeters,
  formatMoneyRange,
  formatNullableText,
} from "@/features/prequotes/structured-extraction-formatters";
import type { StructuredSummary } from "@/features/prequotes/structured-extraction-types";

function hasGlassSummaryContract(summary: StructuredSummary): boolean {
  return (
    "identifiedGlassItemCount" in summary ||
    "glassItemsRequiringReview" in summary ||
    "valuedItemCount" in summary ||
    "notValuedItemCount" in summary ||
    "totalGlassAreaSquareMeters" in summary ||
    "minimumGlassAmount" in summary ||
    "maximumGlassAmount" in summary ||
    "currency" in summary ||
    "isAggregable" in summary ||
    "aggregationIssue" in summary
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-sm bg-surface-subtle p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function StructuredGlassSummary({
  summary,
}: {
  summary: StructuredSummary;
}) {
  if (!hasGlassSummaryContract(summary)) {
    return null;
  }

  const isAggregable = summary.isAggregable ?? true;
  const range = formatMoneyRange(
    summary.minimumGlassAmount ?? null,
    null,
    summary.maximumGlassAmount ?? null,
    summary.currency ?? null,
  );

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="glass-summary-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="glass-summary-title"
              className="text-lg font-semibold text-foreground"
            >
              Vidrio y valoración
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Resumen de la identificación de vidrio y los valores calculados
              por el Backend.
            </p>
          </div>
          <Badge tone={isAggregable ? "success" : "warning"} size="sm">
            {isAggregable ? "Agregable" : "No agregable"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <div className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4">
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              Rango económico
            </p>
            <p className="mt-2 break-words text-2xl font-semibold text-foreground">
              {range}
            </p>
            {!isAggregable ? (
              <p className="mt-3 text-sm leading-6 text-warning">
                {formatAggregationIssue(summary.aggregationIssue ?? null)}
              </p>
            ) : null}
          </div>

          <dl className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <SummaryMetric
              label="Área total"
              value={formatAreaSquareMeters(
                summary.totalGlassAreaSquareMeters ?? null,
              )}
            />
            <SummaryMetric
              label="Moneda"
              value={formatNullableText(summary.currency ?? null)}
            />
          </dl>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetric
            label="Vidrios identificados"
            value={
              summary.identifiedGlassItemCount === null ||
              summary.identifiedGlassItemCount === undefined
                ? "—"
                : summary.identifiedGlassItemCount
            }
          />
          <SummaryMetric
            label="Requieren revisión"
            value={
              summary.glassItemsRequiringReview === null ||
              summary.glassItemsRequiringReview === undefined
                ? "—"
                : summary.glassItemsRequiringReview
            }
          />
          <SummaryMetric
            label="Ítems valorados"
            value={summary.valuedItemCount ?? "—"}
          />
          <SummaryMetric
            label="Ítems no valorados"
            value={summary.notValuedItemCount ?? "—"}
          />
        </dl>
      </section>
    </Surface>
  );
}
