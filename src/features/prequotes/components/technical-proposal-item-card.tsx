import { CheckCircle2, CircleAlert, MessageCircle } from "lucide-react";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { RequirementChatPanel } from "@/features/prequotes/components/requirement-chat-panel";
import { TechnicalProposalSelectionEditor } from "@/features/prequotes/components/technical-proposal-selection-editor";
import {
  deriveDisplayAreaM2,
  deriveDisplayTotalAreaM2,
  formatProposalAreaM2,
  formatHistoricalEvidenceSummary,
  formatProposalConfidence,
  formatProposalNumber,
  formatProposalQuantity,
} from "@/features/prequotes/technical-proposal-formatters";
import { formatPricingWarning, formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import type { RequirementPricingItem } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";

function SuggestedValue({ label, value, note }: { label: string; value: string | null; note?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">{value || "Por definir"}</dd>
      {note ? <dd className="mt-1 text-xs text-foreground-secondary">{note}</dd> : null}
    </div>
  );
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
function pricingStatusLabel(status: string): string {
  if (status === "NO_ESTIMATE") return "Sin estimacion";
  if (status === "NOT_PRICEABLE") return "Precio pendiente";
  return "Precio estimado";
}

function actionLabel(field: string): string {
  if (field === "system" || field === "glass" || field === "finish") return "Modificar configuracion";
  if (field.includes("Geometry") || field === "measurements") return "Modificar configuracion";
  if (field === "quantity") return "Modificar configuracion";
  if (field === "evidence") return "Revisar evidencia";
  return "Revisar configuracion";
}

function readinessStatus(state: string): { label: string; tone: "success" | "warning" | "neutral" } {
  if (state === "READY") return { label: "Listo", tone: "success" };
  if (state === "BLOCKED") return { label: "Conviene revisar", tone: "warning" };
  if (state === "REVIEW_REQUIRED") return { label: "Revisar", tone: "warning" };
  return { label: state, tone: "neutral" };
}

function pendingBadge(definition: { blocksConfirmation: boolean; blocksPricing: boolean }): string {
  if (definition.blocksPricing) return "Bloquea pricing";
  if (definition.blocksConfirmation) return "Revisar antes de confirmar";
  return "Advertencia";
}

export function TechnicalProposalItemCard({ item, requirementId, pricing, currency, selectionCatalog, selectionCatalogLoading, selectionCatalogError, onRetrySelectionCatalog, isSavingSelection, selectionErrorMessage, onSaveSelection, onUpdateInclusion, commercialMutationDisabled }: {
  item: TechnicalProposalItem;
  requirementId: string;
  pricing: RequirementPricingItem | null;
  currency: string | null;
  selectionCatalog: TechnicalSelectionCatalog | null;
  selectionCatalogLoading: boolean;
  selectionCatalogError: string | null;
  onRetrySelectionCatalog: () => void;
  isSavingSelection: boolean;
  selectionErrorMessage: string | null;
  onSaveSelection: (request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
  onUpdateInclusion: (isIncluded: boolean, reason?: string | null) => boolean | Promise<boolean>;
  commercialMutationDisabled: boolean;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const status = readinessStatus(item.readiness.state);
  const provenance = sourceLabel(item);
  const pricingIssues = pricing ? [...pricing.mappingWarnings, ...pricing.missingData] : [];
  const hasPriceEstimate = pricing?.status === "PRICEABLE";
  const hasPricingSnapshot = Boolean(pricing?.originalLine || pricing?.currentLine || pricing?.deltaLine);
  const displayAreaM2 = deriveDisplayAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm);
  const displayTotalAreaM2 = deriveDisplayTotalAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm, item.effectiveQuantity);
  const handleInclusionChange = () => {
    if (commercialMutationDisabled) return;
    void onUpdateInclusion(!item.isIncluded, null);
  };

  return (
    <Surface padding="md" className={`min-w-0 space-y-4 ${item.isIncluded ? "" : "border-warning bg-surface-subtle opacity-90"}`}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="break-words font-semibold text-foreground">{item.reference || `Elemento ${item.sequence}`}</h4>
          {provenance ? <p className="mt-1 break-words text-xs text-foreground-secondary">{provenance}</p> : null}
          <p className="mt-1 break-words text-sm text-foreground-secondary">
            {formatProposalQuantity(item.effectiveQuantity)} · Ancho: {formatProposalNumber(item.effectiveWidthMm, " mm")} · Alto: {formatProposalNumber(item.effectiveHeightMm, " mm")}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground-secondary">
            Área unitaria: {formatProposalAreaM2(displayAreaM2)} · Área total: {formatProposalAreaM2(displayTotalAreaM2)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {!item.isIncluded ? <Badge tone="warning">Excluido</Badge> : null}
          <Badge tone={item.isIncluded ? status.tone : "neutral"}>{item.isIncluded ? status.label : "Fuera del alcance"}</Badge>
          <span className="text-xs text-foreground-secondary">
            {item.selectionState === "UNCONFIRMED" ? "Sugerencia sin confirmar" : item.selectionState === "CONFIRMED_AS_SUGGESTED" ? "Sugerencia confirmada" : "Configuracion modificada"}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap justify-start gap-2 sm:justify-end">
          <Button type="button" variant={item.isIncluded ? "outline" : "secondary"} size="sm" disabled={isSavingSelection || commercialMutationDisabled} onClick={handleInclusionChange}>
            {item.isIncluded ? "Excluir" : "Reactivar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setChatOpen((value) => !value)}><MessageCircle aria-hidden="true" size={15} />{chatOpen ? "Ocultar chat" : "Consultar"}</Button>
        </div>
      </div>

      {chatOpen ? <RequirementChatPanel requirementId={requirementId} itemId={item.itemId} title={`Asistente de ${item.reference || `Elemento ${item.sequence}`}`} compact /> : null}

      <dl className="grid gap-4 border-t border-border-subtle pt-4">
        <SuggestedValue label="Sistema sugerido S&G" value={item.suggested.system?.displayName ?? null} />
        <SuggestedValue label="Vidrio sugerido S&G" value={item.suggested.glass?.displayName ?? null} note={resolutionNote(item.glassResolutionReasons, "HISTORICAL_DEFAULT_GLASS", "Referencia historica - requiere validacion")} />
        <SuggestedValue label="Acabado sugerido S&G" value={item.suggested.finish?.displayName ?? null} note={resolutionNote(item.finishResolutionReasons, "HISTORICAL_DEFAULT_FINISH", "Predeterminado historico")} />
      </dl>

      {item.selected ? (
        <dl className="grid gap-4 rounded-sm border border-brand bg-brand-soft p-3">
          <SuggestedValue label="Sistema seleccionado" value={item.selected.system?.displayName ?? null} />
          <SuggestedValue label="Vidrio seleccionado" value={item.selected.glass?.displayName ?? null} />
          <SuggestedValue label="Acabado seleccionado" value={item.selected.finish?.displayName ?? null} />
        </dl>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
        <span>{formatProposalConfidence(item.confidence.overall)}</span>
        {item.isIncluded && item.isPriceable ? <span className="flex items-center gap-1"><CheckCircle2 aria-hidden="true" size={14} /> Configuracion lista para cotizar</span> : null}
        <span>{formatHistoricalEvidenceSummary(item.historicalEvidence)}</span>
      </div>

      {!item.isIncluded ? (
        <div className="rounded-sm border border-warning bg-warning/10 p-3">
          <p className="text-sm font-semibold text-foreground">Excluido del alcance</p>
          <p className="mt-1 text-sm text-foreground-secondary">Este elemento conserva su configuracion y evidencia, pero no participa en readiness global, pricing ni totales actuales.</p>
          {item.exclusionReason ? <p className="mt-2 break-words text-xs text-foreground-secondary">Motivo: {item.exclusionReason}</p> : null}
        </div>
      ) : pricing && currency ? (
        <div className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
          <p className="mb-2 text-xs text-foreground-secondary">Configuracion usada: {pricing.configurationSource === "SELECTED" ? "seleccionada" : "sugerida"}</p>
          {!hasPriceEstimate ? (
            <div>
              <p className="text-sm font-semibold text-foreground">{pricingStatusLabel(pricing.status)}</p>
              <p className="mt-1 text-sm text-foreground-secondary">No hay suficiente referencia historica para calcular el precio actual de esta configuracion.</p>
              {hasPricingSnapshot ? (
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div><dt className="text-xs text-foreground-secondary">Antes</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.originalLine?.expected ?? null, currency)}</dd></div>
                  <div><dt className="text-xs text-foreground-secondary">Ahora</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.currentLine?.expected ?? null, currency)}</dd></div>
                  <div><dt className="text-xs text-foreground-secondary">Diferencia</dt><dd className={`mt-1 font-semibold ${deltaTone(pricing.deltaLine?.expected ?? null)}`}>{formatDeltaMoney(pricing.deltaLine?.expected ?? null, currency)}</dd></div>
                </dl>
              ) : null}
              {pricingIssues.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-warning">
                  {pricingIssues.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{formatPricingWarning(warning)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Precio estimado</p>
                {pricing.requiresReview ? <span className="text-xs font-medium text-warning">Estimacion sujeta a revision</span> : null}
              </div>
              {hasPricingSnapshot ? (
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div><dt className="text-xs text-foreground-secondary">Antes</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.originalLine?.expected ?? null, currency)}</dd></div>
                  <div><dt className="text-xs text-foreground-secondary">Ahora</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.currentLine?.expected ?? null, currency)}</dd></div>
                  <div><dt className="text-xs text-foreground-secondary">Diferencia</dt><dd className={`mt-1 font-semibold ${deltaTone(pricing.deltaLine?.expected ?? null)}`}>{formatDeltaMoney(pricing.deltaLine?.expected ?? null, currency)}</dd></div>
                </dl>
              ) : (
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><dt className="text-xs text-foreground-secondary">Precio unitario</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.unit.expected, currency)}</dd></div>
                  <div><dt className="text-xs text-foreground-secondary">Total del elemento</dt><dd className="mt-1 font-semibold text-foreground">{formatRequirementMoney(pricing.line.expected, currency)}</dd></div>
                </dl>
              )}
              <p className="mt-2 text-xs text-foreground-secondary">
                Rango estimado: {formatRequirementMoney(pricing.line.minimum, currency)} - {formatRequirementMoney(pricing.line.maximum, currency)}
              </p>
              {pricing.comparables.length > 0 ? <p className="mt-2 text-xs text-foreground-secondary">Basado en {pricing.comparables.length} referencias historicas</p> : null}
            </div>
          )}
        </div>
      ) : null}

      {item.readiness.pendingDefinitions.length > 0 ? (
        <section className="rounded-sm border border-warning bg-warning/10 p-3" aria-label="Pendientes del item">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Pendientes accionables</p>
            <Badge tone={item.readiness.pendingDefinitions.some((definition) => definition.blocksPricing) ? "warning" : "neutral"}>{item.readiness.pendingDefinitions.some((definition) => definition.blocksPricing) ? "Bloquea pricing" : "Revisar antes de confirmar"}</Badge>
          </div>
          <ul className="mt-3 divide-y divide-border-subtle rounded-sm border border-border-subtle bg-surface">
            {item.readiness.pendingDefinitions.map((definition) => (
              <li key={`${definition.code}-${definition.field}`} className="p-3">
                <div className="flex items-start gap-2">
                  <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={16} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{definition.title}</p>
                      <Badge tone={definition.blocksPricing ? "warning" : "neutral"}>{pendingBadge(definition)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground-secondary">{definition.message}</p>
                    {definition.currentValue ? <p className="mt-1 text-xs text-foreground-secondary">Valor actual: {definition.currentValue}</p> : null}
                    <p className="mt-2 text-xs font-semibold text-foreground">{definition.requiredAction}</p>
                    <p className="mt-1 text-xs text-foreground-secondary">Accion sugerida: {actionLabel(definition.field)}</p>
                    {definition.relatedReasonCodes.length > 0 ? (
                      <details className="mt-2 text-xs text-foreground-secondary">
                        <summary className="cursor-pointer font-medium text-foreground-secondary">Ver detalle tecnico</summary>
                        <p className="mt-1 break-words text-[11px]">{definition.relatedReasonCodes.join(", ")}</p>
                      </details>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <TechnicalProposalSelectionEditor
        item={item}
        catalog={selectionCatalog}
        catalogLoading={selectionCatalogLoading}
        catalogError={selectionCatalogError}
        onRetryCatalog={onRetrySelectionCatalog}
        isSaving={isSavingSelection}
        disabled={commercialMutationDisabled}
        errorMessage={selectionErrorMessage}
        submitLabel={pricing ? "Aplicar cambio" : "Guardar seleccion"}
        savingLabel={pricing ? "Recalculando..." : "Guardando..."}
        onSave={onSaveSelection}
      />

    </Surface>
  );
}
