import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  FieldError,
  joinDescribedBy,
  TextInputField,
} from "@/features/prequotes/components/prequote-draft-editor-fields";
import {
  createManualDraftRequirement,
  resequenceDraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-mappers";
import type { DraftEditModel } from "@/features/prequotes/prequote-draft-edit-types";
import { formatPreQuoteDraftRequirementCategory } from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftRequirementCategory } from "@/features/prequotes/prequote-draft-types";

const REQUIREMENT_OPTIONS: PreQuoteDraftRequirementCategory[] = [
  "GLASS_SPECIFICATION",
  "PROFILE_SPECIFICATION",
  "FINISH",
  "ACCESSORIES_AND_SEALANTS",
  "GENERAL_NOTE",
];

export function PreQuoteDraftRequirementsEditor({
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
          const categoryError = errorFor(`${prefix}.category`);
          const valueError = errorFor(`${prefix}.value`);

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
                      Categoría
                    </label>
                    <Select
                      id={`${prefix}.category`}
                      value={requirement.category}
                      disabled={disabled}
                      aria-invalid={Boolean(categoryError) || undefined}
                      aria-describedby={joinDescribedBy(
                        categoryError ? `${prefix}.category-error` : undefined,
                      )}
                      onChange={(event) =>
                        onChange({
                          ...model,
                          requirements: model.requirements.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...requirement,
                                  category: event.target.value as
                                    | PreQuoteDraftRequirementCategory
                                    | "",
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
                    <FieldError id={`${prefix}.category-error`} message={categoryError} />
                  </div>
                  <TextInputField
                    id={`${prefix}.value`}
                    label="Valor"
                    value={requirement.value}
                    maxLength={1000}
                    disabled={disabled}
                    error={valueError}
                    onChange={(value) =>
                      onChange({
                        ...model,
                        requirements: model.requirements.map((item, itemIndex) =>
                          itemIndex === index ? { ...requirement, value } : item,
                        ),
                      })
                    }
                  />
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
