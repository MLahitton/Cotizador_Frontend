import { Plus } from "lucide-react";

import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableCatalogCombobox, type SearchableCatalogOption } from "@/components/ui/searchable-catalog-combobox";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { TechnicalProposalItemCard } from "@/features/prequotes/components/technical-proposal-item-card";
import type { RequirementPricing } from "@/features/prequotes/requirement-pricing-types";
import type { TechnicalProposal, TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { CreateManualTechnicalProposalItemRequest } from "@/features/prequotes/technical-proposal-api";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";
import type { RequirementChatActionPlan } from "@/features/prequotes/requirement-chat-types";
import { getCreateManualTechnicalProposalItemErrorMessage } from "@/features/prequotes/technical-proposal-api";
import { calculateProposalPhysicalTotals, formatProposalAreaM2 } from "@/features/prequotes/technical-proposal-formatters";


const elementTypeOptions = [
  ["WINDOW", "Ventana"],
  ["DOOR", "Puerta"],
  ["FACADE", "Fachada"],
  ["PARTITION", "Division"],
  ["RAILING", "Baranda"],
  ["SKYLIGHT", "Lucernario"],
  ["SHOWER_DIVISION", "Division de bano"],
  ["OTHER", "Otro"],
] as const;

interface ManualItemDraft {
  reference: string;
  description: string;
  elementType: string;
  quantity: string;
  widthMillimeters: string;
  heightMillimeters: string;
  systemId: string;
  glassTypeId: string;
  finishTypeId: string;
  note: string;
}

const emptyManualItemDraft: ManualItemDraft = {
  reference: "",
  description: "",
  elementType: "WINDOW",
  quantity: "1",
  widthMillimeters: "",
  heightMillimeters: "",
  systemId: "",
  glassTypeId: "",
  finishTypeId: "",
  note: "",
};

function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function catalogOptions(catalog: TechnicalSelectionCatalog | null, kind: "systems" | "glasses" | "finishes"): SearchableCatalogOption[] {
  if (!catalog) return [];
  if (kind === "systems") {
    return catalog.systems
      .filter((item) => item.isActive && item.isSelectable)
      .map((item) => ({
        id: item.id,
        title: item.displayName,
        subtitle: item.code,
        searchText: [item.displayName, item.code, item.name, item.technicalName, item.commercialName, item.functionalType, item.family, item.series]
          .filter(Boolean)
          .join(" "),
      }));
  }

  const values = kind === "glasses" ? catalog.glasses : catalog.finishes;
  return values
    .filter((item) => item.isActive && item.isSelectable)
    .map((item) => ({
      id: item.id,
      title: item.displayName,
      subtitle: item.code,
      searchText: [item.displayName, item.code, item.description].filter(Boolean).join(" "),
    }));
}

function ManualTechnicalProposalItemForm({ catalog, catalogLoading, catalogError, disabled, isSaving, error, onRetryCatalog, onCreate }: {
  catalog: TechnicalSelectionCatalog | null;
  catalogLoading: boolean;
  catalogError: string | null;
  disabled: boolean;
  isSaving: boolean;
  error: unknown | null;
  onRetryCatalog: () => void;
  onCreate: (request: CreateManualTechnicalProposalItemRequest) => boolean | Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ManualItemDraft>(emptyManualItemDraft);
  const [validationError, setValidationError] = useState<string | null>(null);
  const systemOptions = useMemo(() => catalogOptions(catalog, "systems"), [catalog]);
  const glassOptions = useMemo(() => catalogOptions(catalog, "glasses"), [catalog]);
  const finishOptions = useMemo(() => catalogOptions(catalog, "finishes"), [catalog]);
  const controlsDisabled = disabled || isSaving;
  const canUseCatalog = !catalogError && Boolean(catalog);

  const update = (field: keyof ManualItemDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reference = draft.reference.trim();
    const description = draft.description.trim();
    const note = draft.note.trim();
    const quantity = parsePositiveInteger(draft.quantity);
    const widthMillimeters = parsePositiveInteger(draft.widthMillimeters);
    const heightMillimeters = parsePositiveInteger(draft.heightMillimeters);
    if (!reference || !quantity || !widthMillimeters || !heightMillimeters || !draft.systemId || !draft.glassTypeId || !draft.finishTypeId) {
      setValidationError("Completa referencia, medidas, cantidad y configuracion tecnica.");
      return;
    }

    const created = await onCreate({
      reference,
      description: description || null,
      elementType: draft.elementType,
      quantity,
      widthMillimeters,
      heightMillimeters,
      systemId: draft.systemId,
      glassTypeId: draft.glassTypeId,
      finishTypeId: draft.finishTypeId,
      note: note || null,
    });
    if (created) {
      setDraft(emptyManualItemDraft);
      setOpen(false);
      setValidationError(null);
    }
  };

  return (
    <Surface variant="subtle" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Items manuales</h3>
          <p className="mt-1 text-sm text-foreground-secondary">Agrega elementos que no fueron detectados por el analisis.</p>
        </div>
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => setOpen((value) => !value)}>
          <Plus aria-hidden="true" size={16} />
          {open ? "Cerrar" : "Agregar item manual"}
        </Button>
      </div>
      {open ? (
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-sm font-medium text-foreground">
              Referencia
              <Input value={draft.reference} disabled={controlsDisabled} maxLength={200} onChange={(event) => update("reference", event.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Tipo
              <Select value={draft.elementType} disabled={controlsDisabled} onChange={(event) => update("elementType", event.target.value)}>
                {elementTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Cantidad
              <Input type="number" min={1} step={1} value={draft.quantity} disabled={controlsDisabled} onChange={(event) => update("quantity", event.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Ancho mm
              <Input type="number" min={1} step={1} value={draft.widthMillimeters} disabled={controlsDisabled} onChange={(event) => update("widthMillimeters", event.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Alto mm
              <Input type="number" min={1} step={1} value={draft.heightMillimeters} disabled={controlsDisabled} onChange={(event) => update("heightMillimeters", event.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground md:col-span-2 xl:col-span-1">
              Descripcion
              <Input value={draft.description} disabled={controlsDisabled} maxLength={1000} onChange={(event) => update("description", event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SearchableCatalogCombobox label="Sistema" value={draft.systemId} options={systemOptions} disabled={controlsDisabled || !canUseCatalog} loading={catalogLoading} searchPlaceholder="Buscar sistema" onChange={(value) => update("systemId", value)} />
            <SearchableCatalogCombobox label="Vidrio" value={draft.glassTypeId} options={glassOptions} disabled={controlsDisabled || !canUseCatalog} loading={catalogLoading} searchPlaceholder="Buscar vidrio" onChange={(value) => update("glassTypeId", value)} />
            <SearchableCatalogCombobox label="Acabado" value={draft.finishTypeId} options={finishOptions} disabled={controlsDisabled || !canUseCatalog} loading={catalogLoading} searchPlaceholder="Buscar acabado" onChange={(value) => update("finishTypeId", value)} />
          </div>
          <label className="block space-y-1 text-sm font-medium text-foreground">
            Nota
            <Input value={draft.note} disabled={controlsDisabled} maxLength={1000} onChange={(event) => update("note", event.target.value)} />
          </label>
          {catalogError ? <div className="flex items-center justify-between gap-3 rounded-sm border border-danger/30 bg-danger-soft p-3"><p role="alert" className="text-sm text-danger">{catalogError}</p><Button type="button" size="sm" variant="outline" onClick={onRetryCatalog}>Reintentar</Button></div> : null}
          {validationError ? <p role="alert" className="text-sm text-danger">{validationError}</p> : null}
          {error ? <p role="alert" className="text-sm text-danger">{getCreateManualTechnicalProposalItemErrorMessage(error)}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" disabled={controlsDisabled} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={controlsDisabled || !canUseCatalog}>{isSaving ? "Agregando..." : "Agregar item"}</Button>
          </div>
        </form>
      ) : null}
    </Surface>
  );
}
function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-sm border border-border bg-brand-soft p-3"><dt className="text-xs font-semibold uppercase text-foreground-secondary">{label}</dt><dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd></div>;
}
type ReadinessFilter = "ALL" | "BLOCKING" | "WARNING" | "READY";

const readinessFilterLabels: Record<ReadinessFilter, string> = {
  ALL: "Todos",
  BLOCKING: "Conviene revisar",
  WARNING: "Advertencias",
  READY: "Listos",
};

function itemMatchesFilter(item: TechnicalProposalItem, filter: ReadinessFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "BLOCKING") return item.readiness.blockingCount > 0;
  if (filter === "WARNING") return item.readiness.blockingCount === 0 && item.readiness.warningCount > 0;
  return item.readiness.state === "READY";
}

function readinessTone(state: string): "success" | "warning" | "neutral" {
  if (state === "READY") return "success";
  if (state === "BLOCKED" || state === "REVIEW_REQUIRED") return "warning";
  return "neutral";
}

function readinessLabel(state: string): string {
  if (state === "READY") return "Listo";
  if (state === "REVIEW_REQUIRED") return "Revisar";
  if (state === "BLOCKED") return "Conviene revisar";
  return state;
}

function ReadinessSummary({ proposal, onFilterChange, activeFilter }: {
  proposal: TechnicalProposal;
  activeFilter: ReadinessFilter;
  onFilterChange: (filter: ReadinessFilter) => void;
}) {
  const categoryText = Object.entries(proposal.readiness.categories)
    .map(([category, count]) => `${count} ${category.toLowerCase()}`)
    .join(" · ");
  const hasPricingBlockers = proposal.readiness.pricingBlockingDefinitions > 0;
  const hasConfirmationReview = proposal.readiness.blockingDefinitions > 0;

  return (
    <Surface variant="elevated" padding="lg" className={hasConfirmationReview || hasPricingBlockers ? "border-warning" : "border-success"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Estado tecnico comercial</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {hasPricingBlockers
              ? `${proposal.readiness.pricingBlockingItems} items bloquean pricing`
              : hasConfirmationReview
                ? `${proposal.readiness.blockingItems} items conviene revisar`
                : "Configuracion tecnica completa"}
          </h3>
          <p className="mt-2 text-sm text-foreground-secondary">
            {hasPricingBlockers
              ? categoryText || "Hay definiciones necesarias para calcular precio."
              : hasConfirmationReview
                ? categoryText || "Hay definiciones para revisar antes de confirmar."
                : "Ya puedes confirmar y pasar a pricing."}
          </p>
        </div>
        <Badge tone={readinessTone(proposal.readiness.state)}>{readinessLabel(proposal.readiness.state)}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(readinessFilterLabels) as ReadinessFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${activeFilter === filter ? "border-brand bg-brand text-white" : "border-border bg-surface text-foreground-secondary hover:border-brand"}`}
          >
            {readinessFilterLabels[filter]}
          </button>
        ))}
      </div>
    </Surface>
  );
}


export function TechnicalProposalSummary({ requirementId, proposal, pricing, selectionCatalog, selectionCatalogLoading, selectionCatalogError, onRetrySelectionCatalog, savingSelectionItemIds, selectionErrorMessages, manualItemCreating, manualItemError, onSaveSelection, onChatActionExecuted, onCreateManualItem, onUpdateInclusion, commercialMutationDisabled, recentChatAction }: {
  requirementId: string;
  proposal: TechnicalProposal;
  pricing: RequirementPricing | null;
  selectionCatalog: TechnicalSelectionCatalog | null;
  selectionCatalogLoading: boolean;
  selectionCatalogError: string | null;
  onRetrySelectionCatalog: () => void;
  savingSelectionItemIds: string[];
  selectionErrorMessages: Record<string, string>;
  manualItemCreating: boolean;
  manualItemError: unknown | null;
  onSaveSelection: (itemId: string, request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
  onChatActionExecuted: (result: RequirementChatActionPlan) => void | Promise<void>;
  onCreateManualItem: (request: CreateManualTechnicalProposalItemRequest) => boolean | Promise<boolean>;
  onUpdateInclusion: (itemId: string, isIncluded: boolean, reason?: string | null) => boolean | Promise<boolean>;
  commercialMutationDisabled: boolean;
  recentChatAction: { itemIds: string[]; pricingStatus: string | null } | null;
}) {
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("ALL");
  const pricingByProposalItemId = new Map(
    pricing?.items.map((item) => [item.proposalItemId, item]) ?? [],
  );
  const includedItems = useMemo(() => proposal.items.filter((item) => item.isIncluded), [proposal.items]);
  const physicalTotals = calculateProposalPhysicalTotals(includedItems);
  const visibleItems = useMemo(() => proposal.items.filter((item) => itemMatchesFilter(item, readinessFilter)), [proposal.items, readinessFilter]);
  return (
    <section aria-labelledby="technical-proposal-title" className="space-y-4">
      <Surface variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 id="technical-proposal-title" className="text-xl font-semibold text-foreground">Propuesta tecnica</h3></div>
          <Badge tone={proposal.itemsRequiringReview > 0 ? "warning" : "success"}>{proposal.itemsRequiringReview > 0 ? "Requiere revision" : "Lista"}</Badge>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Items encontrados" value={proposal.detectedItemCount} />
          <Metric label="Estructuras cotizadas" value={physicalTotals.structureCount} />
          <Metric label="Metros cuadrados totales" value={formatProposalAreaM2(physicalTotals.totalAreaM2)} />
          <Metric label="Tecnicamente completos" value={proposal.technicallyCompleteItems} />
          <Metric label="Listos para cotizar" value={proposal.priceableItems} />
          <Metric label="Requieren revision" value={proposal.itemsRequiringReview} />
        </dl>
        {proposal.manualItemCount > 0 ? <p className="mt-3 text-sm text-foreground-secondary">{proposal.manualItemCount} {proposal.manualItemCount === 1 ? "item manual agregado" : "items manuales agregados"}</p> : null}
      </Surface>
      {includedItems.length === 0 ? (
        <Surface variant="subtle" className="border-warning bg-warning/10">
          <p className="text-sm font-semibold text-foreground">No hay elementos incluidos en la propuesta.</p>
          <p className="mt-1 text-sm text-foreground-secondary">Reactiva al menos un elemento para confirmar configuraciones y calcular precios.</p>
        </Surface>
      ) : null}
      <ReadinessSummary proposal={proposal} activeFilter={readinessFilter} onFilterChange={setReadinessFilter} />
      <ManualTechnicalProposalItemForm
        catalog={selectionCatalog}
        catalogLoading={selectionCatalogLoading}
        catalogError={selectionCatalogError}
        disabled={commercialMutationDisabled}
        isSaving={manualItemCreating}
        error={manualItemError}
        onRetryCatalog={onRetrySelectionCatalog}
        onCreate={onCreateManualItem}
      />
      <div>
        <h3 className="text-lg font-semibold text-foreground">Elementos</h3>
        <div className="mt-3 grid min-w-0 gap-4 xl:grid-cols-2">
          {visibleItems.map((item) => (
            <TechnicalProposalItemCard
              key={item.itemId}
              item={item}
              requirementId={requirementId}
              pricing={pricingByProposalItemId.get(item.itemId) ?? null}
              currency={pricing?.currency ?? null}
              selectionCatalog={selectionCatalog}
              selectionCatalogLoading={selectionCatalogLoading}
              selectionCatalogError={selectionCatalogError}
              onRetrySelectionCatalog={onRetrySelectionCatalog}
              isSavingSelection={savingSelectionItemIds.includes(item.itemId)}
              selectionErrorMessage={selectionErrorMessages[item.itemId] ?? null}
              onSaveSelection={(request) => onSaveSelection(item.itemId, request)}
              onChatActionExecuted={onChatActionExecuted}
              onUpdateInclusion={(isIncluded, reason) => onUpdateInclusion(item.itemId, isIncluded, reason)}
              commercialMutationDisabled={commercialMutationDisabled}
              recentChatActionPricingStatus={recentChatAction?.itemIds.includes(item.itemId) ? recentChatAction.pricingStatus : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
