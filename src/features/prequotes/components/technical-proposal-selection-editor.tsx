"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TechnicalProposalSelectionRequest } from "@/features/prequotes/technical-proposal-selection-api";
import type {
  TechnicalProposalFinishOption,
  TechnicalProposalGlassOption,
  TechnicalProposalItem,
  TechnicalProposalSystemOption,
} from "@/features/prequotes/technical-proposal-types";

function uniqueOptions<T extends { id: string }>(options: Array<T | null>): T[] {
  return Array.from(new Map(options.filter((option): option is T => option !== null).map((option) => [option.id, option])).values());
}

function Field<T extends { id: string; displayName: string }>({ label, value, options, disabled, allowEmpty, onChange }: {
  label: string;
  value: string;
  options: T[];
  disabled: boolean;
  allowEmpty: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-foreground">
      {label}
      <Select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled={!allowEmpty}>Por definir</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.displayName}</option>)}
      </Select>
    </label>
  );
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

export function TechnicalProposalSelectionEditor({ item, isSaving, errorMessage, submitLabel = "Guardar seleccion", savingLabel = "Guardando...", onSave }: {
  item: TechnicalProposalItem;
  isSaving: boolean;
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
  const systems = useMemo(() => uniqueOptions<TechnicalProposalSystemOption>([
    item.selected?.system ?? null, item.suggested.system, ...item.alternatives.systems.map(({ option }) => option),
  ]), [item]);
  const glass = useMemo(() => uniqueOptions<TechnicalProposalGlassOption>([
    item.selected?.glass ?? null, item.suggested.glass, ...item.alternatives.glass.map(({ option }) => option),
  ]), [item]);
  const finishes = useMemo(() => uniqueOptions<TechnicalProposalFinishOption>([
    item.selected?.finish ?? null, item.suggested.finish, ...item.alternatives.finishes.map(({ option }) => option),
  ]), [item]);

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
        <Button type="button" size="sm" variant="secondary" disabled={isSaving} onClick={beginEditing}>Modificar configuracion</Button>
        {errorMessage ? <p role="alert" className="w-full text-sm text-danger">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border-subtle pt-3">
      <p className="text-sm font-semibold text-foreground">Configuracion seleccionada</p>
      <div className="grid gap-3 md:grid-cols-3">
        <NumericField label="Cantidad" value={quantity} disabled={isSaving} onChange={setDraftQuantity} />
        <NumericField label="Ancho" suffix="mm" value={widthMm} disabled={isSaving} onChange={setDraftWidthMm} />
        <NumericField label="Alto" suffix="mm" value={heightMm} disabled={isSaving} onChange={setDraftHeightMm} />
      </div>
      <div className="grid gap-3">
        <Field label="Sistema" value={systemId} options={systems} disabled={isSaving} allowEmpty={!effective.system} onChange={setDraftSystemId} />
        <Field label="Vidrio" value={glassId} options={glass} disabled={isSaving} allowEmpty={!effective.glass} onChange={setDraftGlassId} />
        <Field label="Acabado" value={finishId} options={finishes} disabled={isSaving} allowEmpty={!effective.finish} onChange={setDraftFinishId} />
      </div>
      {submitLabel === "Aplicar cambio" ? <p className="text-xs text-foreground-secondary">Al aplicar cambios, el precio del item puede cambiar.</p> : null}
      {errorMessage ? <p role="alert" className="text-sm text-danger">{errorMessage}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={isSaving} onClick={cancel}>Cancelar</Button>
        <Button type="button" size="sm" disabled={isSaving} onClick={save}>{isSaving ? savingLabel : submitLabel}</Button>
      </div>
    </div>
  );
}