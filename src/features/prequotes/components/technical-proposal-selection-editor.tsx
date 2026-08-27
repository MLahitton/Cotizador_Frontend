"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
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

export function TechnicalProposalSelectionEditor({ item, isSaving, errorMessage, onSave }: {
  item: TechnicalProposalItem;
  isSaving: boolean;
  errorMessage: string | null;
  onSave: (request: TechnicalProposalSelectionRequest) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const effective = item.selected ?? item.suggested;
  const [systemId, setSystemId] = useState(effective.system?.id ?? "");
  const [glassId, setGlassId] = useState(effective.glass?.id ?? "");
  const [finishId, setFinishId] = useState(effective.finish?.id ?? "");
  const systems = useMemo(() => uniqueOptions<TechnicalProposalSystemOption>([
    item.selected?.system ?? null, item.suggested.system, ...item.alternatives.systems.map(({ option }) => option),
  ]), [item]);
  const glass = useMemo(() => uniqueOptions<TechnicalProposalGlassOption>([
    item.selected?.glass ?? null, item.suggested.glass, ...item.alternatives.glass.map(({ option }) => option),
  ]), [item]);
  const finishes = useMemo(() => uniqueOptions<TechnicalProposalFinishOption>([
    item.selected?.finish ?? null, item.suggested.finish, ...item.alternatives.finishes.map(({ option }) => option),
  ]), [item]);

  const beginEditing = () => {
    setSystemId(effective.system?.id ?? "");
    setGlassId(effective.glass?.id ?? "");
    setFinishId(effective.finish?.id ?? "");
    setIsEditing(true);
  };

  const cancel = () => {
    setSystemId(effective.system?.id ?? "");
    setGlassId(effective.glass?.id ?? "");
    setFinishId(effective.finish?.id ?? "");
    setIsEditing(false);
  };

  const save = () => {
    const request: TechnicalProposalSelectionRequest = {};
    if (systemId !== (effective.system?.id ?? "")) request.systemId = systemId || null;
    if (glassId !== (effective.glass?.id ?? "")) request.glassId = glassId || null;
    if (finishId !== (effective.finish?.id ?? "")) request.finishId = finishId || null;
    if (Object.keys(request).length === 0) { setIsEditing(false); return; }
    onSave(request);
    setIsEditing(false);
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
      <div className="grid gap-3">
        <Field label="Sistema" value={systemId} options={systems} disabled={isSaving} allowEmpty={!effective.system} onChange={setSystemId} />
        <Field label="Vidrio" value={glassId} options={glass} disabled={isSaving} allowEmpty={!effective.glass} onChange={setGlassId} />
        <Field label="Acabado" value={finishId} options={finishes} disabled={isSaving} allowEmpty={!effective.finish} onChange={setFinishId} />
      </div>
      {errorMessage ? <p role="alert" className="text-sm text-danger">{errorMessage}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" disabled={isSaving} onClick={cancel}>Cancelar</Button>
        <Button type="button" size="sm" disabled={isSaving} onClick={save}>{isSaving ? "Guardando..." : "Guardar seleccion"}</Button>
      </div>
    </div>
  );
}
