import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  FieldError,
  TextInputField,
} from "@/features/prequotes/components/prequote-draft-editor-fields";
import {
  createManualDraftReference,
  resequenceDraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-mappers";
import type {
  DraftEditModel,
  DraftEditReferenceModel,
} from "@/features/prequotes/prequote-draft-edit-types";

const REFERENCE_FIELDS = [
  { field: "reference", label: "Referencia", maxLength: 200 },
  { field: "description", label: "Descripción", maxLength: 1000 },
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

export function PreQuoteDraftReferencesEditor({
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
                      <TextInputField
                        key={field}
                        id={key}
                        label={label}
                        value={reference[field]}
                        maxLength={maxLength}
                        inputMode={field === "quantity" ? "numeric" : undefined}
                        disabled={disabled}
                        error={errorFor(key)}
                        onChange={(value) =>
                          updateReference(index, {
                            ...reference,
                            [field]: value,
                          })
                        }
                      />
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
