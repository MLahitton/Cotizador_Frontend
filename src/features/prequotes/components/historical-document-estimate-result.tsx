import { AlertTriangle, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatEstimateConfidence,
  formatEstimateMoney,
  formatEstimateNumber,
  formatEstimateStatus,
  formatEstimateWarning,
} from "@/features/prequotes/historical-document-estimate-formatters";
import type { HistoricalDocumentEstimate } from "@/features/prequotes/historical-document-estimate-types";

function NoteList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <section>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-foreground-secondary">
        {values.map((value, index) => <li key={`${value}-${index}`}>• {formatEstimateWarning(value)}</li>)}
      </ul>
    </section>
  );
}

export function HistoricalDocumentEstimateResult({ estimate }: { estimate: HistoricalDocumentEstimate }) {
  return (
    <Surface variant="elevated" padding="lg" className="space-y-6" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Precotización estimada</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {formatEstimateMoney(estimate.expected, estimate.currency)}
          </p>
          <p className="mt-2 text-sm text-foreground-secondary">
            {formatEstimateMoney(estimate.minimum, estimate.currency)} — {formatEstimateMoney(estimate.maximum, estimate.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={estimate.confidenceLevel === "HIGH" || estimate.confidenceLevel === "GOOD" ? "success" : "warning"}>
            {formatEstimateConfidence(estimate.confidenceLevel, estimate.confidenceScore)}
          </Badge>
          {estimate.isPartial ? <Badge tone="warning">Precotización parcial</Badge> : null}
          {estimate.requiresReview ? <Badge tone="warning">Requiere revisión</Badge> : null}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">Detectados</dt><dd className="mt-1 text-xl font-semibold">{estimate.extractedElementCount} elementos</dd></div>
        <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">Estimados</dt><dd className="mt-1 text-xl font-semibold">{estimate.pricedItemCount}</dd></div>
        <div className="rounded-sm bg-surface-subtle p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">Sin precio</dt><dd className="mt-1 text-xl font-semibold">{estimate.notPriceableItemCount}</dd></div>
      </dl>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">Elementos ({estimate.itemCount})</h3>
        {estimate.items.map((item) => (
          <details key={item.elementId} className="rounded-sm border border-border-subtle bg-surface p-3">
            <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{item.reference || `Elemento ${item.elementId}`}</p>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {item.category || "Tipo no especificado"} · {formatEstimateNumber(item.widthMm, " mm")} × {formatEstimateNumber(item.heightMm, " mm")} · Cant. {formatEstimateNumber(item.quantity)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
                <div><span className="block text-xs text-foreground-secondary">Unitario esperado</span><strong>{formatEstimateMoney(item.unitExpected, estimate.currency)}</strong></div>
                <div><span className="block text-xs text-foreground-secondary">Total de línea</span><strong>{formatEstimateMoney(item.lineExpected, estimate.currency)}</strong></div>
              </div>
              <Badge tone={item.pricingStatus === "PRICEABLE" ? "success" : "warning"}>{formatEstimateStatus(item.pricingStatus)}</Badge>
              <ChevronDown aria-hidden="true" className="shrink-0 text-foreground-secondary" size={18} />
            </summary>
            <div className="mt-4 space-y-4 border-t border-border-subtle pt-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[["Referencia", item.reference], ["Tipo", item.category], ["Sistema", item.system], ["Vidrio", item.glass], ["Configuración", item.configuration], ["Área", formatEstimateNumber(item.areaM2, " m²")], ["Cantidad", formatEstimateNumber(item.quantity)], ["Acabado", item.finish]].map(([label, value]) => (
                  <div key={label}><dt className="text-foreground-secondary">{label}</dt><dd className="mt-1 font-medium text-foreground">{value || "—"}</dd></div>
                ))}
              </dl>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-sm bg-surface-subtle p-3"><h4 className="text-sm font-semibold">Precio unitario</h4><p className="mt-2 text-sm">{formatEstimateMoney(item.unitMinimum, estimate.currency)} · <strong>{formatEstimateMoney(item.unitExpected, estimate.currency)}</strong> · {formatEstimateMoney(item.unitMaximum, estimate.currency)}</p></div>
                <div className="rounded-sm bg-surface-subtle p-3"><h4 className="text-sm font-semibold">Total de línea</h4><p className="mt-2 text-sm">{formatEstimateMoney(item.lineMinimum, estimate.currency)} · <strong>{formatEstimateMoney(item.lineExpected, estimate.currency)}</strong> · {formatEstimateMoney(item.lineMaximum, estimate.currency)}</p></div>
              </div>
              <p className="text-sm text-foreground-secondary">{formatEstimateConfidence(item.confidenceLevel, item.confidenceScore)} · {item.candidateCount ?? "—"} comparables · {item.strongComparableCount ?? "—"} sólidos</p>
              {item.requiresReview ? <p className="flex items-center gap-2 text-sm font-medium text-warning"><AlertTriangle size={16} /> Requiere revisión</p> : null}
              <NoteList title="Advertencias" values={item.mappingWarnings} />
              <NoteList title="Supuestos" values={item.assumptions} />
              <NoteList title="Datos faltantes" values={item.missingData} />
            </div>
          </details>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <NoteList title="Advertencias generales" values={estimate.warnings} />
        <NoteList title="Supuestos" values={estimate.assumptions} />
        <NoteList title="Datos faltantes" values={estimate.missingData} />
      </div>
    </Surface>
  );
}
