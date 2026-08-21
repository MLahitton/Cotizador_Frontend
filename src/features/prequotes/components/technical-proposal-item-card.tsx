import { CheckCircle2, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { formatProposalConfidence, formatProposalNumber, formatReviewReason } from "@/features/prequotes/technical-proposal-formatters";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

function SuggestedValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">{value || "Por definir"}</dd>
    </div>
  );
}

export function TechnicalProposalItemCard({ item }: { item: TechnicalProposalItem }) {
  const status = item.requiresReview ? "Requiere revisión" : item.isTechnicallyComplete ? "Listo" : "Incompleto";
  return (
    <Surface padding="md" className="min-w-0 space-y-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-foreground">{item.reference || `Elemento ${item.sequence}`}</h4>
          <p className="mt-1 text-sm text-foreground-secondary">
            {formatProposalNumber(item.quantity)} unidades · {formatProposalNumber(item.widthMm, " mm")} × {formatProposalNumber(item.heightMm, " mm")} · {formatProposalNumber(item.areaM2, " m²")}
          </p>
        </div>
        <Badge tone={item.requiresReview ? "warning" : item.isTechnicallyComplete ? "success" : "neutral"}>{status}</Badge>
      </div>

      <dl className="grid gap-4 border-t border-border-subtle pt-4">
        <SuggestedValue label="Sistema sugerido S&G" value={item.suggested.system?.displayName ?? null} />
        <SuggestedValue label="Vidrio sugerido S&G" value={item.suggested.glass?.displayName ?? null} />
        <SuggestedValue label="Acabado sugerido S&G" value={item.suggested.finish?.displayName ?? null} />
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
        <span>{formatProposalConfidence(item.confidence.overall)}</span>
        {item.isPriceable ? <span className="flex items-center gap-1"><CheckCircle2 aria-hidden="true" size={14} /> Configuración lista para cotizar</span> : null}
        {item.historicalEvidence.supportCount > 0 ? (
          <span>{item.historicalEvidence.supportCount} referencias históricas{item.historicalEvidence.bestSimilarity === null ? "" : ` · Mejor similitud ${Math.round(item.historicalEvidence.bestSimilarity * 100)}%`}</span>
        ) : null}
      </div>

      {item.reviewReasons.length > 0 ? (
        <ul className="space-y-2 border-t border-border-subtle pt-3">
          {item.reviewReasons.map((reason, index) => (
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
