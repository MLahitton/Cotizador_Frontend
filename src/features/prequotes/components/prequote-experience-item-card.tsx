"use client";

import { CheckCircle2, CircleAlert, MapPin, MessageCircle, Pencil, Save, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { PreQuoteExperienceItemConfigurator } from "@/features/prequotes/components/prequote-experience-item-configurator";
import { RequirementChatPanel } from "@/features/prequotes/components/requirement-chat-panel";
import { TechnicalProposalSelectionEditor } from "@/features/prequotes/components/technical-proposal-selection-editor";
import { TechnicalProposalVisualPreview } from "@/features/prequotes/components/technical-proposal-visual-preview";
import { formatRequirementMoney } from "@/features/prequotes/requirement-pricing-formatters";
import { getExperienceSelectionsSummary } from "@/features/prequotes/prequote-experience-demo-config";
import type { RequirementPricingItem } from "@/features/prequotes/requirement-pricing-types";
import type { ExperienceLocationField, ItemExperienceDraft } from "@/features/prequotes/prequote-experience-types";
import type { RequirementChatActionPlan } from "@/features/prequotes/requirement-chat-types";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import {
  deriveDisplayAreaM2,
  deriveDisplayTotalAreaM2,
  formatProposalAreaM2,
  formatProposalNumber,
  formatProposalQuantity,
} from "@/features/prequotes/technical-proposal-formatters";
import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";

function itemState(item: TechnicalProposalItem): { label: string; tone: "success" | "warning" | "neutral" } {
  if (!item.isIncluded) return { label: "Excluido", tone: "neutral" };
  if (item.readiness.state === "READY" && !item.requiresReview) return { label: "Completo", tone: "success" };
  if (item.requiresReview || item.readiness.state === "REVIEW_REQUIRED") return { label: "Revision", tone: "warning" };
  if (item.readiness.state === "BLOCKED") return { label: "Pendiente", tone: "warning" };
  return { label: item.readiness.state, tone: "neutral" };
}

function optionName(option: { displayName: string } | null | undefined): string {
  return option?.displayName ?? "Por definir";
}

function locationTone(source: ExperienceLocationField["source"]): "success" | "brand" | "neutral" {
  if (source === "real") return "success";
  if (source === "manual") return "brand";
  return "neutral";
}

function locationLabel(source: ExperienceLocationField["source"]): string {
  if (source === "real") return "Real";
  if (source === "manual") return "Manual";
  if (source === "derived") return "Derivada";
  return "Placeholder";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-sm bg-surface-subtle p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function PricingSnippet({ pricing, currency }: { pricing: RequirementPricingItem | null; currency: string | null }) {
  if (!pricing || !currency) {
    return (
      <div className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
        <p className="text-sm font-semibold text-foreground">Estimacion pendiente</p>
        <p className="mt-1 text-xs text-foreground-secondary">Aun no hay pricing real para este item.</p>
      </div>
    );
  }

  const minimum = pricing.line.minimum;
  const maximum = pricing.line.maximum;
  const expected = pricing.line.expected;

  return (
    <div className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Estimado</p>
        {pricing.requiresReview ? <Badge tone="warning" size="sm">Sujeto a revision</Badge> : null}
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{formatRequirementMoney(expected, currency)}</p>
      <p className="mt-1 text-xs text-foreground-secondary">
        Rango: {formatRequirementMoney(minimum, currency)} - {formatRequirementMoney(maximum, currency)}
      </p>
    </div>
  );
}

export function PreQuoteExperienceItemCard({
  item,
  requirementId,
  pricing,
  currency,
  readOnly = false,
  selectionCatalog,
  selectionCatalogLoading,
  selectionCatalogError,
  onRetrySelectionCatalog,
  isSavingSelection,
  selectionErrorMessage,
  onSaveSelection,
  onClearSelectionError,
  onChatActionExecuted,
  onUpdateInclusion,
  commercialMutationDisabled,
  recentChatActionPricingStatus,
  experienceDraft,
  location,
  experienceDisabled,
  onSaveExperienceDraft,
  onSaveItemLocation,
}: {
  item: TechnicalProposalItem;
  requirementId: string;
  pricing: RequirementPricingItem | null;
  currency: string | null;
  readOnly?: boolean;
  selectionCatalog: TechnicalSelectionCatalog | null;
  selectionCatalogLoading: boolean;
  selectionCatalogError: string | null;
  onRetrySelectionCatalog: () => void;
  isSavingSelection: boolean;
  selectionErrorMessage: string | null;
  onSaveSelection: (request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
  onClearSelectionError: () => void;
  onChatActionExecuted: (result: RequirementChatActionPlan) => void | Promise<void>;
  onUpdateInclusion: (isIncluded: boolean, reason?: string | null) => boolean | Promise<boolean>;
  commercialMutationDisabled: boolean;
  recentChatActionPricingStatus?: string | null;
  experienceDraft: ItemExperienceDraft;
  location: ExperienceLocationField;
  experienceDisabled: boolean;
  onSaveExperienceDraft: (draft: ItemExperienceDraft) => void;
  onSaveItemLocation: (value: string) => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [locationEditing, setLocationEditing] = useState(false);
  const [locationDraft, setLocationDraft] = useState(location.value);
  const [inclusionBusy, setInclusionBusy] = useState(false);
  const state = itemState(item);
  const effectiveSystem = item.selected?.system ?? item.suggested.system;
  const effectiveGlass = item.selected?.glass ?? item.suggested.glass;
  const effectiveFinish = item.selected?.finish ?? item.suggested.finish;
  const unitArea = deriveDisplayAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm);
  const totalArea = deriveDisplayTotalAreaM2(item.areaM2, item.effectiveWidthMm, item.effectiveHeightMm, item.effectiveQuantity);
  const functionalType = item.visualModel?.functionalType ?? item.trace.functionalType ?? item.elementType;
  const disableMutations = readOnly || commercialMutationDisabled || isSavingSelection || inclusionBusy;
  const disableExperienceControls = readOnly || experienceDisabled;
  const experienceSummary = getExperienceSelectionsSummary(experienceDraft, 4);
  const recentActionLabel = recentChatActionPricingStatus
    ? recentChatActionPricingStatus === "PRICING_UPDATED"
      ? "Cambio aplicado · Precio actualizado"
      : "Cambio aplicado · Precio pendiente"
    : null;

  const handleInclusionChange = async () => {
    if (disableMutations) return;
    setInclusionBusy(true);
    try {
      await onUpdateInclusion(!item.isIncluded, null);
    } finally {
      setInclusionBusy(false);
    }
  };

  const saveLocation = () => {
    if (disableExperienceControls) return;
    onSaveItemLocation(locationDraft);
    setLocationEditing(false);
  };

  return (
    <Surface
      padding="md"
      className={item.isIncluded ? "min-w-0 space-y-4" : "min-w-0 space-y-4 border-warning bg-surface-subtle"}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words text-lg font-semibold text-foreground">{item.reference || `Elemento ${item.sequence}`}</h4>
            <Badge tone={state.tone}>{state.label}</Badge>
            {item.source === "MANUAL" ? <Badge tone="brand" size="sm">Manual</Badge> : null}
          </div>
          <p className="mt-1 break-words text-sm leading-6 text-foreground-secondary">
            {item.description || item.elementType}
          </p>
          <div className="mt-2 rounded-sm border border-border-subtle bg-surface-subtle p-3">
            {!locationEditing ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  <MapPin aria-hidden="true" size={15} className="text-foreground-secondary" />
                  <span className="font-semibold text-foreground">Ubicacion:</span>
                  <span className="break-words text-foreground-secondary">{location.value}</span>
                  <Badge tone={locationTone(location.source)} size="sm">{locationLabel(location.source)}</Badge>
                </div>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disableExperienceControls}
                    onClick={() => {
                      setLocationDraft(location.value);
                      setLocationEditing(true);
                    }}
                  >
                    <Pencil aria-hidden="true" size={14} />
                    Editar
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Ubicacion
                  <Input
                    className="mt-1"
                    value={locationDraft}
                    disabled={disableExperienceControls}
                    maxLength={120}
                    onChange={(event) => setLocationDraft(event.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={disableExperienceControls} onClick={saveLocation}>
                    <Save aria-hidden="true" size={14} />
                    Guardar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={disableExperienceControls} onClick={() => setLocationEditing(false)}>
                    <X aria-hidden="true" size={14} />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
          {recentActionLabel ? <p className="mt-2 text-xs font-semibold text-success">{recentActionLabel}</p> : null}
        </div>
        <div className="shrink-0 text-sm font-semibold text-foreground-secondary">
          {formatProposalQuantity(item.effectiveQuantity)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          {item.visualModel ? (
            <TechnicalProposalVisualPreview visualModel={item.visualModel} />
          ) : (
            <div className="flex aspect-[4/3] min-h-40 items-center justify-center rounded-sm border border-dashed border-border bg-surface-subtle p-4 text-center text-sm text-foreground-secondary">
              Visual pendiente
            </div>
          )}
        </div>

        <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
          <Detail label="Medidas" value={`${formatProposalNumber(item.effectiveWidthMm, " mm")} x ${formatProposalNumber(item.effectiveHeightMm, " mm")}`} />
          <Detail label="Area total" value={formatProposalAreaM2(totalArea)} />
          <Detail label="Area unitaria" value={formatProposalAreaM2(unitArea)} />
          <Detail label="Tipologia" value={functionalType || "Por definir"} />
        </dl>
      </div>

      <dl className="grid gap-3 md:grid-cols-3">
        <Detail label="Sistema" value={optionName(effectiveSystem)} />
        <Detail label="Vidrio" value={optionName(effectiveGlass)} />
        <Detail label="Acabado" value={optionName(effectiveFinish)} />
      </dl>

      <div className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-foreground-secondary">Experiencia</p>
              <Badge tone="neutral" size="sm">Placeholder</Badge>
              {experienceDraft.wasReviewedByUser ? <Badge tone="brand" size="sm">Revisado</Badge> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {experienceSummary.map((label) => (
                <Badge key={label} tone="neutral" size="sm">{label}</Badge>
              ))}
            </div>
          </div>
          {!readOnly ? (
            <Button type="button" variant="secondary" size="sm" disabled={disableExperienceControls} onClick={() => setExperienceOpen((value) => !value)}>
              {experienceOpen ? "Cerrar experiencia" : "Configurar experiencia"}
            </Button>
          ) : null}
        </div>
      </div>

      {!readOnly && experienceOpen ? (
        <PreQuoteExperienceItemConfigurator
          item={item}
          draft={experienceDraft}
          disabled={disableExperienceControls}
          onCancel={() => setExperienceOpen(false)}
          onSave={(draft) => {
            onSaveExperienceDraft(draft);
            setExperienceOpen(false);
          }}
          onOpenChat={() => setChatOpen(true)}
        />
      ) : null}

      <PricingSnippet pricing={pricing} currency={currency} />

      {item.readiness.pendingDefinitions.length > 0 || item.reviewReasons.length > 0 ? (
        <div className="rounded-sm border border-warning bg-warning-soft p-3">
          <div className="flex items-start gap-2">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={17} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Revision requerida</p>
              <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                {item.readiness.pendingDefinitions[0]?.message ?? "Este item tiene razones de revision tecnica."}
              </p>
            </div>
          </div>
        </div>
      ) : item.isIncluded ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 aria-hidden="true" size={17} />
          Configuracion tecnica completa
        </p>
      ) : null}

      {!readOnly ? (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-xs text-foreground-secondary">
            {item.selectionState === "MODIFIED" ? "Configuracion modificada" : item.selectionState === "CONFIRMED_AS_SUGGESTED" ? "Sugerencia confirmada" : "Sugerencia sin confirmar"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setChatOpen((value) => !value)}>
              <MessageCircle aria-hidden="true" size={15} />
              {chatOpen ? "Ocultar chat" : "Chat del item"}
            </Button>
            <Button
              type="button"
              variant={item.isIncluded ? "outline" : "secondary"}
              size="sm"
              disabled={disableMutations}
              onClick={handleInclusionChange}
            >
              {inclusionBusy ? "Guardando..." : item.isIncluded ? "Excluir" : "Reactivar"}
            </Button>
          </div>
        </div>
      ) : null}

      {!readOnly && chatOpen ? (
        <RequirementChatPanel
          requirementId={requirementId}
          itemId={item.itemId}
          title={`Asistente de ${item.reference || `Elemento ${item.sequence}`}`}
          compact
          onActionExecuted={onChatActionExecuted}
        />
      ) : null}

      {!readOnly ? (
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
          onClearSelectionError={onClearSelectionError}
          onSave={onSaveSelection}
        />
      ) : null}
    </Surface>
  );
}