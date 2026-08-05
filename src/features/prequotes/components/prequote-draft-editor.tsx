"use client";

import { CircleAlert, Plus, Save, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  buildUpdateDraftRequest,
  createDraftEditModel,
  createManualDraftItem,
  createManualDraftReference,
  createManualDraftRequirement,
  hasDraftChanges,
  resequenceDraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-mappers";
import type {
  DraftEditFindingModel,
  DraftEditItemModel,
  DraftEditModel,
  DraftEditReferenceModel,
} from "@/features/prequotes/prequote-draft-edit-types";
import { validateDraftEditModel } from "@/features/prequotes/prequote-draft-edit-validation";
import {
  formatPreQuoteDraftConflictCode,
  formatPreQuoteDraftDimension,
  formatPreQuoteDraftElementType,
  formatPreQuoteDraftIssueCode,
  formatPreQuoteDraftMoney,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftRequirementCategory,
  formatPreQuoteDraftResolutionStatus,
  formatPreQuoteDraftValuationStatus,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftConflict,
  PreQuoteDraftDetails,
  PreQuoteDraftElementType,
  PreQuoteDraftIssue,
  PreQuoteDraftRequirementCategory,
  PreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-types";
import {
  getUpdatePreQuoteDraftErrorMessage,
  useUpdatePreQuoteDraft,
} from "@/features/prequotes/use-update-prequote-draft";
import { cn } from "@/lib/utils/cn";

const ELEMENT_OPTIONS: PreQuoteDraftElementType[] = [
  "WINDOW",
  "DOOR",
  "FACADE",
  "PARTITION",
  "RAILING",
  "SKYLIGHT",
  "OTHER",
];

const REQUIREMENT_OPTIONS: PreQuoteDraftRequirementCategory[] = [
  "GLASS_SPECIFICATION",
  "PROFILE_SPECIFICATION",
  "FINISH",
  "ACCESSORIES_AND_SEALANTS",
  "GENERAL_NOTE",
];

const RESOLUTION_OPTIONS: PreQuoteDraftResolutionStatus[] = [
  "PENDING",
  "RESOLVED",
  "DISMISSED",
];

const REFERENCE_FIELDS = [
  { field: "reference", label: "Referencia", maxLength: 200 },
  { field: "description", label: "Descripcion", maxLength: 1000 },
  { field: "detail", label: "Detalle", maxLength: 2000 },
  { field: "quantity", label: "Cantidad", maxLength: undefined },
] as const satisfies readonly {
  field: keyof Pick<
    DraftEditReferenceModel,
    "reference" | "description" | "detail" | "quantity"
  >;
  label: string;
  maxLength?: number;
}[];

const GLASS_ISSUE_CODES = new Set([
  "GLASS_TYPE_NOT_IDENTIFIED",
  "GLASS_TYPE_AMBIGUOUS",
  "GLASS_TYPE_CONFLICT",
]);

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {message}
    </p>
  );
}

function TextArea({
  id,
  value,
  rows = 3,
  disabled,
  describedBy,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  rows?: number;
  disabled: boolean;
  describedBy?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted hover:border-border-strong aria-invalid:border-danger",
        "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
      )}
    />
  );
}

function GeneralEditor({
  model,
  disabled,
  errorFor,
  onChange,
}: {
  model: DraftEditModel;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditModel) => void;
}) {
  const setProjectField = (
    field: keyof DraftEditModel["project"],
    value: string,
  ) => {
    onChange({ ...model, project: { ...model.project, [field]: value } });
  };

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <section className="p-5 sm:p-6" aria-labelledby="draft-general-edit-title">
        <h2 id="draft-general-edit-title" className="text-lg font-semibold text-foreground">
          Informacion general
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ["projectName", "Proyecto detectado"],
            ["clientName", "Cliente detectado"],
            ["location", "Ubicacion"],
          ].map(([field, label]) => {
            const key = `project.${field}`;
            const errorId = `${key}-error`;
            return (
              <div key={field}>
                <label htmlFor={key} className="mb-2 block text-sm font-semibold text-foreground">
                  {label}
                </label>
                <Input
                  id={key}
                  value={model.project[field as keyof DraftEditModel["project"]]}
                  maxLength={500}
                  disabled={disabled}
                  aria-invalid={Boolean(errorFor(key)) || undefined}
                  aria-describedby={errorFor(key) ? errorId : undefined}
                  onChange={(event) =>
                    setProjectField(
                      field as keyof DraftEditModel["project"],
                      event.target.value,
                    )
                  }
                />
                <FieldError id={errorId} message={errorFor(key)} />
              </div>
            );
          })}
        </div>
      </section>
    </Surface>
  );
}

function hasEconomicChange(item: DraftEditItemModel, draft: PreQuoteDraftDetails): boolean {
  const source = item.draftItemId
    ? draft.items.find((draftItem) => draftItem.id === item.draftItemId)
    : null;

  return Boolean(
    source?.valuation?.status === "VALUED" &&
      (item.widthMillimeters !== String(source.widthMillimeters ?? "") ||
        item.heightMillimeters !== String(source.heightMillimeters ?? "") ||
        item.quantity !== String(source.quantity ?? "")),
  );
}

function ItemEditor({
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
    ? draft.items.find((draftItem) => draftItem.id === item.draftItemId)
    : null;
  const prefix = `items.${index}`;
  const economicChange = hasEconomicChange(item, draft);

  return (
    <Surface padding="none" className="min-w-0 overflow-hidden">
      <article className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              Item {formatPreQuoteDraftQuantity(index + 1)}
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
              Incluir este item en el borrador
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
              Cambiar medidas o cantidad puede invalidar una valoracion vigente.
              El estado final sera el que devuelva el Backend despues de guardar.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor={`${prefix}.reference`} className="mb-2 block text-sm font-semibold text-foreground">
              Referencia
            </label>
            <Input
              id={`${prefix}.reference`}
              value={item.reference}
              maxLength={200}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.reference`)) || undefined}
              aria-describedby={errorFor(`${prefix}.reference`) ? `${prefix}.reference-error` : undefined}
              onChange={(event) => onChange({ ...item, reference: event.target.value })}
            />
            <FieldError id={`${prefix}.reference-error`} message={errorFor(`${prefix}.reference`)} />
          </div>
          <div>
            <label htmlFor={`${prefix}.elementType`} className="mb-2 block text-sm font-semibold text-foreground">
              Tipo de elemento
            </label>
            <Select
              id={`${prefix}.elementType`}
              value={item.elementType}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.elementType`)) || undefined}
              aria-describedby={errorFor(`${prefix}.elementType`) ? `${prefix}.elementType-error` : undefined}
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
            <FieldError id={`${prefix}.elementType-error`} message={errorFor(`${prefix}.elementType`)} />
          </div>
          <div>
            <label htmlFor={`${prefix}.width`} className="mb-2 block text-sm font-semibold text-foreground">
              Ancho mm
            </label>
            <Input
              id={`${prefix}.width`}
              inputMode="numeric"
              value={item.widthMillimeters}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.widthMillimeters`) || errorFor(`${prefix}.dimensions`)) || undefined}
              aria-describedby={`${prefix}.width-error ${prefix}.dimensions-error`}
              onChange={(event) => onChange({ ...item, widthMillimeters: event.target.value })}
            />
            <FieldError id={`${prefix}.width-error`} message={errorFor(`${prefix}.widthMillimeters`)} />
          </div>
          <div>
            <label htmlFor={`${prefix}.height`} className="mb-2 block text-sm font-semibold text-foreground">
              Alto mm
            </label>
            <Input
              id={`${prefix}.height`}
              inputMode="numeric"
              value={item.heightMillimeters}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.heightMillimeters`) || errorFor(`${prefix}.dimensions`)) || undefined}
              aria-describedby={`${prefix}.height-error ${prefix}.dimensions-error`}
              onChange={(event) => onChange({ ...item, heightMillimeters: event.target.value })}
            />
            <FieldError id={`${prefix}.height-error`} message={errorFor(`${prefix}.heightMillimeters`)} />
          </div>
          <div>
            <label htmlFor={`${prefix}.quantity`} className="mb-2 block text-sm font-semibold text-foreground">
              Cantidad
            </label>
            <Input
              id={`${prefix}.quantity`}
              inputMode="numeric"
              value={item.quantity}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.quantity`)) || undefined}
              aria-describedby={errorFor(`${prefix}.quantity`) ? `${prefix}.quantity-error` : undefined}
              onChange={(event) => onChange({ ...item, quantity: event.target.value })}
            />
            <FieldError id={`${prefix}.quantity-error`} message={errorFor(`${prefix}.quantity`)} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label htmlFor={`${prefix}.rawMeasurements`} className="mb-2 block text-sm font-semibold text-foreground">
              Medidas originales
            </label>
            <Input
              id={`${prefix}.rawMeasurements`}
              value={item.rawMeasurements}
              maxLength={500}
              disabled={disabled}
              aria-invalid={Boolean(errorFor(`${prefix}.rawMeasurements`)) || undefined}
              aria-describedby={errorFor(`${prefix}.rawMeasurements`) ? `${prefix}.rawMeasurements-error` : undefined}
              onChange={(event) => onChange({ ...item, rawMeasurements: event.target.value })}
            />
            <FieldError id={`${prefix}.rawMeasurements-error`} message={errorFor(`${prefix}.rawMeasurements`)} />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor={`${prefix}.description`} className="mb-2 block text-sm font-semibold text-foreground">
              Descripcion
            </label>
            <TextArea
              id={`${prefix}.description`}
              value={item.description}
              disabled={disabled}
              invalid={Boolean(errorFor(`${prefix}.description`))}
              describedBy={errorFor(`${prefix}.description`) ? `${prefix}.description-error` : undefined}
              onChange={(value) => onChange({ ...item, description: value })}
            />
            <FieldError id={`${prefix}.description-error`} message={errorFor(`${prefix}.description`)} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
            <h4 className="text-sm font-semibold text-foreground">Vidrio read-only</h4>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {source?.glass
                ? `${source.glass.rawSpecification ?? "Sin especificacion"} / ${source.glass.normalizedCodeSnapshot ?? "sin codigo"}`
                : "No hay informacion de vidrio registrada para este item."}
            </p>
          </div>
          <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
            <h4 className="text-sm font-semibold text-foreground">Valoracion read-only</h4>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {source?.valuation
                ? `${formatPreQuoteDraftValuationStatus(source.valuation.status)} · ${formatPreQuoteDraftMoney(source.valuation.totalAmount, source.valuation.currency)} · ${formatPreQuoteDraftDimension(source.valuation.widthMillimetersUsed)} x ${formatPreQuoteDraftDimension(source.valuation.heightMillimetersUsed)} · Cantidad ${formatPreQuoteDraftQuantity(source.valuation.quantityUsed)}`
                : "No hay una valoracion registrada para este item."}
            </p>
          </div>
        </div>
        <FieldError id={`${prefix}.dimensions-error`} message={errorFor(`${prefix}.dimensions`)} />
      </article>
    </Surface>
  );
}

function ItemsEditor({
  model,
  draft,
  disabled,
  errorFor,
  onChange,
}: {
  model: DraftEditModel;
  draft: PreQuoteDraftDetails;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditModel) => void;
}) {
  const updateItem = (index: number, nextItem: DraftEditItemModel) => {
    onChange({
      ...model,
      items: model.items.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item,
      ),
    });
  };

  const removeItem = (index: number) => {
    onChange(
      resequenceDraftEditModel(
        { ...model, items: model.items.filter((_, itemIndex) => itemIndex !== index) },
        "items",
      ),
    );
  };

  return (
    <section id="draft-items" aria-labelledby="draft-items-title" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="draft-items-title" className="text-lg font-semibold text-foreground">
            Items
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            El tipo de vidrio y la valoracion de los items manuales se completaran en una fase posterior.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full sm:w-auto"
          onClick={() =>
            onChange({
              ...model,
              items: [...model.items, createManualDraftItem(model.items.length + 1)],
            })
          }
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Agregar item manual
        </Button>
      </div>
      <FieldError id="items.form-error" message={errorFor("items.form")} />
      <ul className="space-y-4">
        {model.items.map((item, index) => (
          <li key={item.localId}>
            <ItemEditor
              item={item}
              index={index}
              draft={draft}
              disabled={disabled}
              errorFor={errorFor}
              onChange={(nextItem) => updateItem(index, nextItem)}
              onRemove={() => removeItem(index)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequirementsEditor({
  model,
  disabled,
  errorFor,
  onChange,
}: {
  model: DraftEditModel;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditModel) => void;
}) {
  return (
    <section id="draft-requirements" aria-labelledby="draft-requirements-title" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="draft-requirements-title" className="text-lg font-semibold text-foreground">
          Requisitos
        </h2>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full sm:w-auto"
          onClick={() =>
            onChange({
              ...model,
              requirements: [
                ...model.requirements,
                createManualDraftRequirement(model.requirements.length + 1),
              ],
            })
          }
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Agregar requisito manual
        </Button>
      </div>
      <FieldError id="requirements.form-error" message={errorFor("requirements.form")} />
      <ul className="space-y-3">
        {model.requirements.map((requirement, index) => {
          const prefix = `requirements.${index}`;
          return (
            <li key={requirement.localId}>
              <Surface>
                <article className="grid gap-5 md:grid-cols-2">
                  <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground md:col-span-2">
                    <input
                      type="checkbox"
                      checked={requirement.isIncluded}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange({
                          ...model,
                          requirements: model.requirements.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...requirement, isIncluded: event.target.checked }
                              : item,
                          ),
                        })
                      }
                      className="h-4 w-4 rounded-sm border-border"
                    />
                    Incluir este requisito en el borrador
                  </label>
                  <div>
                    <label htmlFor={`${prefix}.category`} className="mb-2 block text-sm font-semibold text-foreground">
                      Categoria
                    </label>
                    <Select
                      id={`${prefix}.category`}
                      value={requirement.category}
                      disabled={disabled}
                      aria-invalid={Boolean(errorFor(`${prefix}.category`)) || undefined}
                      onChange={(event) =>
                        onChange({
                          ...model,
                          requirements: model.requirements.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...requirement,
                                  category: event.target.value as PreQuoteDraftRequirementCategory | "",
                                }
                              : item,
                          ),
                        })
                      }
                    >
                      <option value="">Selecciona...</option>
                      {REQUIREMENT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {formatPreQuoteDraftRequirementCategory(option)}
                        </option>
                      ))}
                    </Select>
                    <FieldError id={`${prefix}.category-error`} message={errorFor(`${prefix}.category`)} />
                  </div>
                  <div>
                    <label htmlFor={`${prefix}.value`} className="mb-2 block text-sm font-semibold text-foreground">
                      Valor
                    </label>
                    <Input
                      id={`${prefix}.value`}
                      value={requirement.value}
                      maxLength={1000}
                      disabled={disabled}
                      aria-invalid={Boolean(errorFor(`${prefix}.value`)) || undefined}
                      onChange={(event) =>
                        onChange({
                          ...model,
                          requirements: model.requirements.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...requirement, value: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                    <FieldError id={`${prefix}.value-error`} message={errorFor(`${prefix}.value`)} />
                  </div>
                  {requirement.isNew ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      className="w-full md:w-fit"
                      onClick={() =>
                        onChange(
                          resequenceDraftEditModel(
                            {
                              ...model,
                              requirements: model.requirements.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            },
                            "requirements",
                          ),
                        )
                      }
                    >
                      <X aria-hidden="true" size={16} strokeWidth={1.75} />
                      Quitar
                    </Button>
                  ) : null}
                </article>
              </Surface>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReferencesEditor({
  model,
  disabled,
  errorFor,
  onChange,
}: {
  model: DraftEditModel;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditModel) => void;
}) {
  const updateReference = (index: number, next: DraftEditReferenceModel) => {
    onChange({
      ...model,
      references: model.references.map((reference, itemIndex) =>
        itemIndex === index ? next : reference,
      ),
    });
  };

  return (
    <section id="draft-references" aria-labelledby="draft-references-title" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="draft-references-title" className="text-lg font-semibold text-foreground">
          Referencias documentales
        </h2>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full sm:w-auto"
          onClick={() =>
            onChange({
              ...model,
              references: [
                ...model.references,
                createManualDraftReference(model.references.length + 1),
              ],
            })
          }
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
          Agregar referencia manual
        </Button>
      </div>
      <FieldError id="references.form-error" message={errorFor("references.form")} />
      <ul className="space-y-3">
        {model.references.map((reference, index) => {
          const prefix = `references.${index}`;
          return (
            <li key={reference.localId}>
              <Surface>
                <article className="grid gap-5 md:grid-cols-2">
                  <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground md:col-span-2">
                    <input
                      type="checkbox"
                      checked={reference.isIncluded}
                      disabled={disabled}
                      onChange={(event) =>
                        updateReference(index, {
                          ...reference,
                          isIncluded: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded-sm border-border"
                    />
                    Incluir esta referencia en el borrador
                  </label>
                  {REFERENCE_FIELDS.map(({ field, label, maxLength }) => {
                    const key = `${prefix}.${field}`;
                    return (
                      <div key={field}>
                        <label htmlFor={key} className="mb-2 block text-sm font-semibold text-foreground">
                          {label}
                        </label>
                        <Input
                          id={key}
                          value={reference[field]}
                          maxLength={maxLength}
                          inputMode={field === "quantity" ? "numeric" : undefined}
                          disabled={disabled}
                          aria-invalid={Boolean(errorFor(key)) || undefined}
                          onChange={(event) =>
                            updateReference(index, {
                              ...reference,
                              [field]: event.target.value,
                            })
                          }
                        />
                        <FieldError id={`${key}-error`} message={errorFor(key)} />
                      </div>
                    );
                  })}
                  {reference.isNew ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      className="w-full md:w-fit"
                      onClick={() =>
                        onChange(
                          resequenceDraftEditModel(
                            {
                              ...model,
                              references: model.references.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            },
                            "references",
                          ),
                        )
                      }
                    >
                      <X aria-hidden="true" size={16} strokeWidth={1.75} />
                      Quitar
                    </Button>
                  ) : null}
                </article>
              </Surface>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FindingEditor({
  kind,
  finding,
  index,
  source,
  disabled,
  errorFor,
  onChange,
}: {
  kind: "issues" | "conflicts";
  finding: DraftEditFindingModel;
  index: number;
  source: PreQuoteDraftIssue | PreQuoteDraftConflict;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditFindingModel) => void;
}) {
  const prefix = `${kind}.${index}`;
  const isGlassIssue = kind === "issues" && GLASS_ISSUE_CODES.has(source.code);

  return (
    <Surface>
      <article className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              {kind === "issues" ? "Observacion" : "Conflicto"} {formatPreQuoteDraftQuantity(source.sequence)}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {kind === "issues"
                ? formatPreQuoteDraftIssueCode(source.code)
                : formatPreQuoteDraftConflictCode(source.code)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              {source.message}
            </p>
          </div>
          <Badge tone={finding.resolutionStatus === "PENDING" ? "warning" : "success"} size="sm">
            {formatPreQuoteDraftResolutionStatus(finding.resolutionStatus)}
          </Badge>
        </div>
        {isGlassIssue ? (
          <div className="rounded-sm border border-warning bg-warning-soft p-3 text-sm leading-6 text-warning">
            Cambiar el estado de esta observacion registra la revision, pero no
            cambia el tipo de vidrio ni recalcula su valoracion.
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor={`${prefix}.resolutionStatus`} className="mb-2 block text-sm font-semibold text-foreground">
              Estado
            </label>
            <Select
              id={`${prefix}.resolutionStatus`}
              value={finding.resolutionStatus}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...finding,
                  resolutionStatus: event.target.value as PreQuoteDraftResolutionStatus,
                  resolutionNote:
                    event.target.value === "PENDING" ? "" : finding.resolutionNote,
                })
              }
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatPreQuoteDraftResolutionStatus(option)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor={`${prefix}.resolutionNote`} className="mb-2 block text-sm font-semibold text-foreground">
              Nota
            </label>
            <TextArea
              id={`${prefix}.resolutionNote`}
              value={finding.resolutionNote}
              disabled={disabled || finding.resolutionStatus === "PENDING"}
              invalid={Boolean(errorFor(`${prefix}.resolutionNote`))}
              describedBy={errorFor(`${prefix}.resolutionNote`) ? `${prefix}.resolutionNote-error` : undefined}
              onChange={(value) => onChange({ ...finding, resolutionNote: value })}
            />
            <FieldError id={`${prefix}.resolutionNote-error`} message={errorFor(`${prefix}.resolutionNote`)} />
          </div>
        </div>
      </article>
    </Surface>
  );
}

function FindingsEditor({
  model,
  draft,
  disabled,
  errorFor,
  onChange,
}: {
  model: DraftEditModel;
  draft: PreQuoteDraftDetails;
  disabled: boolean;
  errorFor: (key: string) => string | undefined;
  onChange: (next: DraftEditModel) => void;
}) {
  const updateIssue = (index: number, next: DraftEditFindingModel) => {
    onChange({
      ...model,
      issues: model.issues.map((issue, itemIndex) =>
        itemIndex === index ? next : issue,
      ),
    });
  };
  const updateConflict = (index: number, next: DraftEditFindingModel) => {
    onChange({
      ...model,
      conflicts: model.conflicts.map((conflict, itemIndex) =>
        itemIndex === index ? next : conflict,
      ),
    });
  };

  return (
    <section id="draft-findings" aria-labelledby="draft-findings-title" className="space-y-5">
      <h2 id="draft-findings-title" className="text-lg font-semibold text-foreground">
        Hallazgos
      </h2>
      <section className="space-y-3" aria-labelledby="draft-issues-edit-title">
        <h3 id="draft-issues-edit-title" className="text-base font-semibold text-foreground">
          Issues
        </h3>
        <FieldError id="issues.form-error" message={errorFor("issues.form")} />
        {model.issues.map((issue, index) => {
          const source = draft.issues.find((item) => item.draftIssueId === issue.id);
          return source ? (
            <FindingEditor
              key={issue.id}
              kind="issues"
              finding={issue}
              index={index}
              source={source}
              disabled={disabled}
              errorFor={errorFor}
              onChange={(next) => updateIssue(index, next)}
            />
          ) : null;
        })}
      </section>
      <section className="space-y-3" aria-labelledby="draft-conflicts-edit-title">
        <h3 id="draft-conflicts-edit-title" className="text-base font-semibold text-foreground">
          Conflicts
        </h3>
        <FieldError id="conflicts.form-error" message={errorFor("conflicts.form")} />
        {model.conflicts.map((conflict, index) => {
          const source = draft.conflicts.find(
            (item) => item.draftConflictId === conflict.id,
          );
          return source ? (
            <FindingEditor
              key={conflict.id}
              kind="conflicts"
              finding={conflict}
              index={index}
              source={source}
              disabled={disabled}
              errorFor={errorFor}
              onChange={(next) => updateConflict(index, next)}
            />
          ) : null;
        })}
      </section>
    </section>
  );
}

export function PreQuoteDraftEditor({
  draft,
  preQuoteId,
  onCancel,
  onUpdated,
  onDiscardAndReload,
}: {
  draft: PreQuoteDraftDetails;
  preQuoteId: string;
  onCancel: () => void;
  onUpdated: (draft: PreQuoteDraftDetails) => void;
  onDiscardAndReload: () => void;
}) {
  const initialModel = useMemo(() => createDraftEditModel(draft), [draft]);
  const [model, setModel] = useState<DraftEditModel>(() => initialModel);
  const [showValidation, setShowValidation] = useState(false);
  const [versionConflict, setVersionConflict] = useState(false);
  const updateDraft = useUpdatePreQuoteDraft();
  const errors = useMemo(
    () => validateDraftEditModel(model, draft),
    [draft, model],
  );
  const isDirty = hasDraftChanges(model, initialModel);
  const hasErrors = Object.keys(errors).length > 0;
  const disabled = updateDraft.isSubmitting || draft.status === "APPROVED";
  const errorFor = (key: string) => errors[key];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);
    setVersionConflict(false);
    updateDraft.resetError();

    if (!isDirty || hasErrors || draft.status === "APPROVED") {
      return;
    }

    const result = await updateDraft.submit(
      preQuoteId,
      buildUpdateDraftRequest(model, draft),
    );

    if (result.status === "updated") {
      onUpdated(result.draft);
      return;
    }

    if (result.status === "version-conflict") {
      setVersionConflict(true);
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-busy={updateDraft.isSubmitting}>
      <div className="min-w-0 space-y-6">
        <Surface>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Badge tone="warning">Modo edicion</Badge>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                Guarda para enviar un PUT completo del borrador. Cancelar descarta
                solo los cambios locales.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={updateDraft.isSubmitting}
                className="w-full sm:w-auto"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={disabled || !isDirty || hasErrors}
                className="w-full sm:w-auto"
              >
                <Save aria-hidden="true" size={16} strokeWidth={1.75} />
                {updateDraft.isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </Surface>

        {showValidation && hasErrors ? (
          <div role="alert" className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium text-danger">
            Revisa los campos marcados antes de guardar.
          </div>
        ) : null}

        {versionConflict ? (
          <div role="alert" className="rounded-sm border border-warning bg-warning-soft p-4 text-warning">
            <p className="text-sm font-semibold">
              El borrador fue modificado por otra sesion.
            </p>
            <p className="mt-2 text-sm leading-6">
              Tus cambios locales siguen aqui. Puedes seguir revisandolos o
              descartarlos para cargar la version actual.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setVersionConflict(false)}>
                Seguir revisando mis cambios
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onDiscardAndReload}>
                Descartar mis cambios y cargar version actual
              </Button>
            </div>
          </div>
        ) : null}

        {updateDraft.error && !versionConflict ? (
          <div role="alert" className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium text-danger">
            {getUpdatePreQuoteDraftErrorMessage(updateDraft.error.cause)}
          </div>
        ) : null}

        <GeneralEditor model={model} disabled={disabled} errorFor={errorFor} onChange={setModel} />
        <ItemsEditor model={model} draft={draft} disabled={disabled} errorFor={errorFor} onChange={setModel} />
        <RequirementsEditor model={model} disabled={disabled} errorFor={errorFor} onChange={setModel} />
        <ReferencesEditor model={model} disabled={disabled} errorFor={errorFor} onChange={setModel} />
        <FindingsEditor model={model} draft={draft} disabled={disabled} errorFor={errorFor} onChange={setModel} />
      </div>
    </form>
  );
}
