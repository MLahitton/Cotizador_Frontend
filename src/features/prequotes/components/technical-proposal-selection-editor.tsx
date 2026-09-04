"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableCatalogCombobox, type SearchableCatalogOption } from "@/components/ui/searchable-catalog-combobox";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";
import type {
  TechnicalProposalItem,
} from "@/features/prequotes/technical-proposal-types";

type Recommendation = SearchableCatalogOption["recommendation"];

function recommendationFor(id: string, selectedId: string | null, suggestedId: string | null, alternativeIds: Set<string>): Recommendation {
  if (id === selectedId) return "selected";
  if (id === suggestedId) return "suggested";
  if (alternativeIds.has(id)) return "alternative";
  return null;
}

function recommendationRank(value: Recommendation): number {
  return value === "selected" ? 0 : value === "suggested" ? 1 : value === "alternative" ? 2 : 3;
}

function ordered(options: SearchableCatalogOption[]): SearchableCatalogOption[] {
  return options.sort((left, right) => recommendationRank(left.recommendation) - recommendationRank(right.recommendation) || left.title.localeCompare(right.title, "es"));
}

function NumericField({ label, suffix, value, disabled, onChange }: {
  label: string;
  suffix?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-foreground">
      {label}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="text-sm text-foreground-secondary">{suffix}</span> : null}
      </div>
    </label>
  );
}

function toInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function parsePositiveInteger(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function TechnicalProposalSelectionEditor({ item, catalog, catalogLoading, catalogError, onRetryCatalog, isSaving, disabled = false, errorMessage, submitLabel = "Guardar seleccion", savingLabel = "Guardando...", onSave }: {
  item: TechnicalProposalItem;
  catalog: TechnicalSelectionCatalog | null;
  catalogLoading: boolean;
  catalogError: string | null;
  onRetryCatalog: () => void;
  isSaving: boolean;
  disabled?: boolean;
  errorMessage: string | null;
  submitLabel?: string;
  savingLabel?: string;
  onSave: (request: TechnicalProposalSelectionRequest) => boolean | Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const effective = item.selected ?? item.suggested;
  const [systemId, setSystemId] = useState(effective.system?.id ?? "");
  const [glassId, setGlassId] = useState(effective.glass?.id ?? "");
  const [finishId, setFinishId] = useState(effective.finish?.id ?? "");
  const [quantity, setQuantity] = useState(toInput(item.effectiveQuantity));
  const [widthMm, setWidthMm] = useState(toInput(item.effectiveWidthMm));
  const [heightMm, setHeightMm] = useState(toInput(item.effectiveHeightMm));
  const draftRef = useRef({
    systemId: effective.system?.id ?? "",
    glassId: effective.glass?.id ?? "",
    finishId: effective.finish?.id ?? "",
    quantity: toInput(item.effectiveQuantity),
    widthMm: toInput(item.effectiveWidthMm),
    heightMm: toInput(item.effectiveHeightMm),
  });
  const systems = useMemo(() => {
    const selectedId = item.selected?.system?.id ?? null;
    const suggestedId = item.suggested.system?.id ?? null;
    const alternatives = new Set(item.alternatives.systems.map(({ option }) => option.id));
    const values = new Map<string, SearchableCatalogOption>();
    for (const option of catalog?.systems ?? []) values.set(option.id, {
      id: option.id,
      title: option.name,
      subtitle: [option.functionalType, option.commercialLine, option.variant].filter(Boolean).join(" · "),
      searchText: [option.displayName, option.code, option.name, option.technicalName, option.commercialName, option.functionalType, option.family, option.series, option.variant].filter(Boolean).join(" "),
      recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives),
    });
    for (const option of [item.selected?.system ?? null, item.suggested.system, ...item.alternatives.systems.map(({ option }) => option)]) if (option && !values.has(option.id)) values.set(option.id, {
      id: option.id, title: option.displayName,
      subtitle: [option.functionalType, option.commercialLine, option.variant].filter(Boolean).join(" · "),
      searchText: [option.displayName, option.code, option.technicalName, option.commercialName, option.functionalType, option.family, option.series, option.variant].filter(Boolean).join(" "),
      recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives),
    });
    return ordered([...values.values()]);
  }, [catalog, item]);
  const glass = useMemo(() => {
    const selectedId = item.selected?.glass?.id ?? null;
    const suggestedId = item.suggested.glass?.id ?? null;
    const alternatives = new Set(item.alternatives.glass.map(({ option }) => option.id));
    const values = new Map<string, SearchableCatalogOption>();
    for (const option of catalog?.glasses ?? []) values.set(option.id, { id: option.id, title: option.displayName, subtitle: option.code, searchText: [option.displayName, option.code, option.description].filter(Boolean).join(" "), recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives) });
    for (const option of [item.selected?.glass ?? null, item.suggested.glass, ...item.alternatives.glass.map(({ option }) => option)]) if (option && !values.has(option.id)) values.set(option.id, { id: option.id, title: option.displayName, subtitle: option.code, searchText: [option.displayName, option.code, option.family, option.composition, option.treatment, option.productToken].filter(Boolean).join(" "), recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives) });
    return ordered([...values.values()]);
  }, [catalog, item]);
  const controlsDisabled = isSaving || disabled;

  const finishes = useMemo(() => {
    const selectedId = item.selected?.finish?.id ?? null;
    const suggestedId = item.suggested.finish?.id ?? null;
    const alternatives = new Set(item.alternatives.finishes.map(({ option }) => option.id));
    const values = new Map<string, SearchableCatalogOption>();
    for (const option of catalog?.finishes ?? []) values.set(option.id, { id: option.id, title: option.displayName, subtitle: option.code, searchText: `${option.displayName} ${option.code}`, recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives) });
    for (const option of [item.selected?.finish ?? null, item.suggested.finish, ...item.alternatives.finishes.map(({ option }) => option)]) if (option && !values.has(option.id)) values.set(option.id, { id: option.id, title: option.displayName, subtitle: option.code, searchText: [option.displayName, option.code, option.commercialCode, option.normalizedType, option.color].filter(Boolean).join(" "), recommendation: recommendationFor(option.id, selectedId, suggestedId, alternatives) });
    return ordered([...values.values()]);
  }, [catalog, item]);

  const setDraftSystemId = (value: string) => { draftRef.current.systemId = value; setSystemId(value); };
  const setDraftGlassId = (value: string) => { draftRef.current.glassId = value; setGlassId(value); };
  const setDraftFinishId = (value: string) => { draftRef.current.finishId = value; setFinishId(value); };
  const setDraftQuantity = (value: string) => { draftRef.current.quantity = value; setQuantity(value); };
  const setDraftWidthMm = (value: string) => { draftRef.current.widthMm = value; setWidthMm(value); };
  const setDraftHeightMm = (value: string) => { draftRef.current.heightMm = value; setHeightMm(value); };

  const reset = () => {
    const next = {
      systemId: effective.system?.id ?? "",
      glassId: effective.glass?.id ?? "",
      finishId: effective.finish?.id ?? "",
      quantity: toInput(item.effectiveQuantity),
      widthMm: toInput(item.effectiveWidthMm),
      heightMm: toInput(item.effectiveHeightMm),
    };
    draftRef.current = next;
    setSystemId(next.systemId);
    setGlassId(next.glassId);
    setFinishId(next.finishId);
    setQuantity(next.quantity);
    setWidthMm(next.widthMm);
    setHeightMm(next.heightMm);
  };

  const beginEditing = () => {
    reset();
    setIsEditing(true);
  };

  const cancel = () => {
    reset();
    setIsEditing(false);
  };

  const save = async () => {
    const draft = draftRef.current;
    const parsedQuantity = parsePositiveInteger(draft.quantity);
    const parsedWidthMm = parsePositiveInteger(draft.widthMm);
    const parsedHeightMm = parsePositiveInteger(draft.heightMm);
    const request: TechnicalProposalSelectionRequest = {
      systemId: draft.systemId || null,
      glassId: draft.glassId || null,
      finishId: draft.finishId || null,
      quantity: parsedQuantity,
      widthMm: parsedWidthMm,
      heightMm: parsedHeightMm,
    };
    const changed = request.systemId !== (effective.system?.id ?? null) ||
      request.glassId !== (effective.glass?.id ?? null) ||
      request.finishId !== (effective.finish?.id ?? null) ||
      request.quantity !== item.effectiveQuantity ||
      request.widthMm !== item.effectiveWidthMm ||
      request.heightMm !== item.effectiveHeightMm;
    if (!changed) { setIsEditing(false); return; }
    const saved = await onSave(request);
    if (saved) setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
        <Button type="button" size="sm" variant="secondary" disabled={controlsDisabled} onClick={beginEditing}>Modificar configuracion</Button>
        {errorMessage ? <p role="alert" className="w-full text-sm text-danger">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border-subtle pt-3">
      <p className="text-sm font-semibold text-foreground">Configuracion seleccionada</p>
      <div className="grid gap-3 lg:grid-cols-3">
        <NumericField label="Cantidad" value={quantity} disabled={controlsDisabled} onChange={setDraftQuantity} />
        <NumericField label="Ancho" suffix="mm" value={widthMm} disabled={controlsDisabled} onChange={setDraftWidthMm} />
        <NumericField label="Alto" suffix="mm" value={heightMm} disabled={controlsDisabled} onChange={setDraftHeightMm} />
      </div>
      <div className="grid gap-3">
        <SearchableCatalogCombobox label="Sistema" value={systemId} options={systems} disabled={controlsDisabled || Boolean(catalogError)} loading={catalogLoading} searchPlaceholder="Buscar sistema por nombre, código o contexto" allowEmpty={!effective.system} onChange={setDraftSystemId} />
        <SearchableCatalogCombobox label="Vidrio" value={glassId} options={glass} disabled={controlsDisabled || Boolean(catalogError)} loading={catalogLoading} searchPlaceholder="Buscar vidrio" allowEmpty={!effective.glass} onChange={setDraftGlassId} />
        <SearchableCatalogCombobox label="Acabado" value={finishId} options={finishes} disabled={controlsDisabled || Boolean(catalogError)} loading={catalogLoading} searchPlaceholder="Buscar acabado" allowEmpty={!effective.finish} onChange={setDraftFinishId} />
      </div>
      {catalogError ? <div className="flex items-center justify-between gap-3 rounded-sm border border-danger/30 bg-danger-soft p-3"><p role="alert" className="text-sm text-danger">{catalogError}</p><Button type="button" size="sm" variant="outline" onClick={onRetryCatalog}>Reintentar</Button></div> : null}
      {submitLabel === "Aplicar cambio" ? <p className="text-xs text-foreground-secondary">Al aplicar cambios, el precio del item puede cambiar.</p> : null}
      {errorMessage ? <p role="alert" className="text-sm text-danger">{errorMessage}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={controlsDisabled} onClick={cancel}>Cancelar</Button>
        <Button type="button" size="sm" disabled={controlsDisabled} onClick={save}>{isSaving ? savingLabel : submitLabel}</Button>
      </div>
    </div>
  );
}
