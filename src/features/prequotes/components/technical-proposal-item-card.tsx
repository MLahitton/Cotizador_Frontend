import { CheckCircle2, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatProposalConfidence, formatProposalNumber, formatReviewReason } from "@/features/prequotes/technical-proposal-formatters";
import { formatPricingWarning, formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricingItem } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

function SuggestedValue({ label, value, note }: { label: string; value: string | null; note?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">{value || "Por definir"}</dd>
      {note ? <dd className="mt-1 text-xs text-foreground-secondary">{note}</dd> : null}
    </div>
  );
}

function uniqueVisibleReviewReasons(reasons: string[]): string[] {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const message = formatReviewReason(reason);
    if (seen.has(message)) return false;
    seen.add(message);
    return true;
  });
}

function sourceLabel(item: TechnicalProposalItem): string | null {
  const first = item.evidence.find((evidence) => evidence.contextLabel || evidence.sourceFileName);
  if (!first) return null;
  if (first.contextLabel && first.sourceFileName) return `${first.contextLabel} - ${first.sourceFileName}`;
  return first.contextLabel ?? first.sourceFileName;
}

function resolutionNote(reasons: string[], code: string, message: string): string | null {
  return reasons.includes(code) ? message : null;
}

export function TechnicalProposalItemCard({ item, pricing, currency }: {
  item: TechnicalProposalItem;
  pricing: RequirementPricingItem | null;
  currency: string | null;
}) {
  const status = item.requiresReview ? "Requiere revision" : item.isTechnicallyComplete ? "Listo" : "Incompleto";
  const visibleReviewReasons = uniqueVisibleReviewReasons(item.reviewReasons);
  const provenance = sourceLabel(item);
  return (
    <Surface padding="md" className="min-w-0 space-y-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-foreground">{item.reference || `Elemento ${item.sequence}`}</h4>
          {provenance ? <p className="mt-1 text-xs text-foreground-secondary">{provenance}</p> : null}
          <p className="mt-1 text-sm text-foreground-secondary">
            {formatProposalNumber(item.quantity)} unidades · {formatProposalNumber(item.widthMm, " mm")} × {formatProposalNumber(item.heightMm, " mm")} · {formatProposalNumber(item.areaM2, " m²")}
          </p>
        </div>
        <Badge tone={item.requiresReview ? "warning" : item.isTechnicallyComplete ? "success" : "neutral"}>{status}</Badge>
      </div>

      <dl className="grid gap-4 border-t border-border-subtle pt-4">
        <SuggestedValue label="Sistema sugerido S&G" value={item.suggested.system?.displayName ?? null} />
        <SuggestedValue label="Vidrio sugerido S&G" value={item.suggested.glass?.displayName ?? null} note={resolutionNote(item.glassResolutionReasons, "HISTORICAL_DEFAULT_GLASS", "Referencia historica - requiere validacion")} />
        <SuggestedValue label="Acabado sugerido S&G" value={item.suggested.finish?.displayName ?? null} note={resolutionNote(item.finishResolutionReasons, "HISTORICAL_DEFAULT_FINISH", "Predeterminado historico")} />
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
        <span>{formatProposalConfidence(item.confidence.overall)}</span>
        {item.isPriceable ? <span className="flex items-center gap-1"><CheckCircle2 aria-hidden="true" size={14} /> Configuración lista para cotizar</span> : null}
        {item.historicalEvidence.supportCount > 0 ? (
          <span>{item.historicalEvidence.supportCount} referencias históricas{item.historicalEvidence.bestSimilarity === null ? "" : ` · Mejor similitud ${Math.round(item.historicalEvidence.bestSimilarity * 100)}%`}</span>
        ) : null}
      </div>

      {pricing && currency ? (
        <div className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
          {pricing.status === "NOT_PRICEABLE" ? (
            <div>
              <p className="text-sm font-semibold text-foreground">Precio pendiente</p>
              <ul className="mt-2 space-y-1 text-sm text-warning">
                {[...pricing.mappingWarnings, ...pricing.missingData].map((warning, index) => (
                  <li key={`${warning}-${index}`}>{formatPricingWarning(warning)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Precio estimado</p>
                {pricing.requiresReview ? <span className="text-xs font-medium text-warning">Estimación sujeta a revisión</span> : null}
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><dt className="text-xs text-foreground-secondary">Precio unitario</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.unit.expected, currency)}</dd></div>
                <div><dt className="text-xs text-foreground-secondary">Total del elemento</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.line.expected, currency)}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-foreground-secondary">
                Rango estimado: {formatRequirementMoney(pricing.line.minimum, currency)} – {formatRequirementMoney(pricing.line.maximum, currency)}
              </p>
              {pricing.comparables.length > 0 ? <p className="mt-2 text-xs text-foreground-secondary">Basado en {pricing.comparables.length} referencias históricas</p> : null}
            </div>
          )}
        </div>
      ) : null}

      {visibleReviewReasons.length > 0 ? (
        <ul className="space-y-2 border-t border-border-subtle pt-3">
          {visibleReviewReasons.map((reason, index) => (
            <li key={`${reason}-${index}`} className="flex items-start gap-2 text-sm leading-6 text-warning">
              <CircleAlert aria-hidden="true" className="mt-1 shrink-0" size={15} />
              {formatReviewReason(reason)}
            </li>
          ))}
        </ul>
      ) : null}
    </Surface>
  );
}
