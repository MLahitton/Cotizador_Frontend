import { CircleAlert, X } from "lucide-react";

import type { BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  FieldError,
  joinDescribedBy,
  TextArea,
  TextInputField,
} from "@/features/prequotes/components/prequote-draft-editor-fields";
import type { DraftEditItemModel } from "@/features/prequotes/prequote-draft-edit-types";
import { parseNullablePositiveIntegerInput } from "@/features/prequotes/prequote-draft-edit-validation";
import {
  formatPreQuoteDraftDimension,
  formatPreQuoteDraftElementType,
  formatPreQuoteDraftMoney,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftValuationStatus,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftDetails,
  PreQuoteDraftElementType,
  PreQuoteDraftItem,
  PreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-types";

export const ELEMENT_OPTIONS: PreQuoteDraftElementType[] = [
  "WINDOW",
  "DOOR",
  "FACADE",
  "PARTITION",
  "RAILING",
  "SKYLIGHT",
  "OTHER",
];

export function resolutionTone(
  status: PreQuoteDraftResolutionStatus,
): BadgeProps["tone"] {
  if (status === "RESOLVED") return "success";
  if (status === "DISMISSED") return "neutral";
  return "warning";
}

function normalizedChanged(input: string, sourceValue: number | null): boolean {
  const parsed = parseNullablePositiveIntegerInput(input);

  if (parsed.kind === "invalid") {
    return false;
  }

  return parsed.value !== sourceValue;
}

function hasEconomicChange(item: DraftEditItemModel, source: PreQuoteDraftItem | null): boolean {
  if (source?.valuation?.status !== "VALUED") {
    return false;
  }

  return (
    normalizedChanged(item.widthMillimeters, source.widthMillimeters) ||
    normalizedChanged(item.heightMillimeters, source.heightMillimeters) ||
    normalizedChanged(item.quantity, source.quantity)
  );
}

export function PreQuoteDraftItemEditor({
  item,
  index,
  draft,
  disabled,
  errorFor,
  onChange,
  onRemove,
}: {
  item: DraftEditItemModel;
  index: number;
  draft: PreQuoteDraftDetails;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditItemModel) => void;
  onRemove: () => void;
}) {
  const source = item.draftItemId
    ? draft.items.find((draftItem) => draftItem.id === item.draftItemId) ?? null
    : null;
  const prefix = `items.${index}`;
  const widthError = errorFor(`${prefix}.widthMillimeters`);
  const heightError = errorFor(`${prefix}.heightMillimeters`);
  const dimensionsError = errorFor(`${prefix}.dimensions`);
  const economicChange = hasEconomicChange(item, source);

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <article className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              Ítem {formatPreQuoteDraftQuantity(index + 1)}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {item.draftItemId ? "Fila existente" : "Fila manual nueva"}
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={item.isIncluded}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...item, isIncluded: event.target.checked })
                }
                className="h-4 w-4 rounded-sm border-border"
              />
              Incluir este ítem en el borrador
            </label>
            {item.isNew ? (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="w-full sm:w-auto"
                onClick={onRemove}
              >
                <X aria-hidden="true" size={16} strokeWidth={1.75} />
                Quitar
              </Button>
            ) : null}
          </div>
        </div>

        {economicChange ? (
          <div className="flex items-start gap-3 rounded-sm border border-warning bg-warning-soft p-3 text-warning">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            <p className="text-sm leading-6">
              Cambiar medidas o cantidad puede invalidar una valoración vigente.
              El estado final será el que devuelva el Backend después de guardar.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <TextInputField
            id={`${prefix}.reference`}
            label="Referencia"
            value={item.reference}
            maxLength={200}
            disabled={disabled}
            error={errorFor(`${prefix}.reference`)}
            onChange={(value) => onChange({ ...item, reference: value })}
          />

          <div>
            <label htmlFor={`${prefix}.elementType`} className="mb-2 block text-sm font-semibold text-foreground">
              Tipo de elemento
            </label>
            <Select
              id={`${prefix}.elementType`}
              value={item.elementType}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.elementType`)) || undefined}
              aria-describedby={joinDescribedBy(
                errorFor(`${prefix}.elementType`)
                  ? `${prefix}.elementType-error`
                  : undefined,
              )}
              onChange={(event) =>
                onChange({
                  ...item,
                  elementType: event.target.value as PreQuoteDraftElementType | "",
                })
              }
            >
              <option value="">Selecciona...</option>
              {ELEMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatPreQuoteDraftElementType(option)}
                </option>
              ))}
            </Select>
            <FieldError
              id={`${prefix}.elementType-error`}
              message={errorFor(`${prefix}.elementType`)}
            />
          </div>

          <TextInputField
            id={`${prefix}.width`}
            label="Ancho mm"
            value={item.widthMillimeters}
            inputMode="numeric"
            disabled={disabled}
            error={widthError}
            forceInvalid={Boolean(dimensionsError)}
            describedBy={dimensionsError ? `${prefix}.dimensions-error` : undefined}
            onChange={(value) => onChange({ ...item, widthMillimeters: value })}
          />
          <TextInputField
            id={`${prefix}.height`}
            label="Alto mm"
            value={item.heightMillimeters}
            inputMode="numeric"
            disabled={disabled}
            error={heightError}
            forceInvalid={Boolean(dimensionsError)}
            describedBy={dimensionsError ? `${prefix}.dimensions-error` : undefined}
            onChange={(value) => onChange({ ...item, heightMillimeters: value })}
          />
          <TextInputField
            id={`${prefix}.quantity`}
            label="Cantidad"
            value={item.quantity}
            inputMode="numeric"
            disabled={disabled}
            error={errorFor(`${prefix}.quantity`)}
            onChange={(value) => onChange({ ...item, quantity: value })}
          />
          <div className="md:col-span-2 xl:col-span-3">
            <TextInputField
              id={`${prefix}.rawMeasurements`}
              label="Medidas originales"
              value={item.rawMeasurements}
              maxLength={500}
              disabled={disabled}
              error={errorFor(`${prefix}.rawMeasurements`)}
              onChange={(value) => onChange({ ...item, rawMeasurements: value })}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor={`${prefix}.description`} className="mb-2 block text-sm font-semibold text-foreground">
              Descripción
            </label>
            <TextArea
              id={`${prefix}.description`}
              value={item.description}
              disabled={disabled}
              invalid={Boolean(errorFor(`${prefix}.description`))}
              describedBy={joinDescribedBy(
                errorFor(`${prefix}.description`)
                  ? `${prefix}.description-error`
                  : undefined,
              )}
              onChange={(value) => onChange({ ...item, description: value })}
            />
            <FieldError
              id={`${prefix}.description-error`}
              message={errorFor(`${prefix}.description`)}
            />
          </div>
        </div>

        <FieldError id={`${prefix}.dimensions-error`} message={dimensionsError} />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
            <h4 className="text-sm font-semibold text-foreground">Vidrio read-only</h4>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {source?.glass
                ? `${source.glass.rawSpecification ?? "Sin especificación"} / ${source.glass.normalizedCodeSnapshot ?? "sin código"}`
                : "No hay información de vidrio registrada para este ítem."}
            </p>
          </div>
          <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
            <h4 className="text-sm font-semibold text-foreground">Valoración read-only</h4>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {source?.valuation
                ? `${formatPreQuoteDraftValuationStatus(source.valuation.status)} · ${formatPreQuoteDraftMoney(source.valuation.totalAmount, source.valuation.currency)} · ${formatPreQuoteDraftDimension(source.valuation.widthMillimetersUsed)} x ${formatPreQuoteDraftDimension(source.valuation.heightMillimetersUsed)} · Cantidad ${formatPreQuoteDraftQuantity(source.valuation.quantityUsed)}`
                : "No hay una valoración registrada para este ítem."}
            </p>
          </div>
        </div>
      </article>
    </Surface>
  );
}
