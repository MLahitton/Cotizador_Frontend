import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/features/prequotes/components/prequote-draft-editor-fields";
import { PreQuoteDraftItemEditor } from "@/features/prequotes/components/prequote-draft-item-editor";
import {
  createManualDraftItem,
  resequenceDraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-mappers";
import type {
  DraftEditItemModel,
  DraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-types";
import type { PreQuoteDraftDetails } from "@/features/prequotes/prequote-draft-types";

export function PreQuoteDraftItemsEditor({
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
        {
          ...model,
          items: model.items.filter((_, itemIndex) => itemIndex !== index),
        },
        "items",
      ),
    );
  };

  return (
    <section id="draft-items" aria-labelledby="draft-items-title" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="draft-items-title" className="text-lg font-semibold text-foreground">
            Ítems
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            El tipo de vidrio y la valoración de los ítems manuales se completarán en una fase posterior.
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
          Agregar ítem manual
        </Button>
      </div>
      <FieldError id="items.form-error" message={errorFor("items.form")} />
      <ul className="space-y-4">
        {model.items.map((item, index) => (
          <li key={item.localId}>
            <PreQuoteDraftItemEditor
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
