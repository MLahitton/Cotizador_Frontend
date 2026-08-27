"use client";

import { Save } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  DraftEditNotice,
  type DraftEditBlockingNotice,
  DraftSubmitErrorAlert,
  DraftValidationAlert,
} from "@/features/prequotes/components/prequote-draft-edit-alerts";
import { PreQuoteDraftFindingsEditor } from "@/features/prequotes/components/prequote-draft-findings-editor";
import { PreQuoteDraftGeneralEditor } from "@/features/prequotes/components/prequote-draft-general-editor";
import { PreQuoteDraftItemsEditor } from "@/features/prequotes/components/prequote-draft-items-editor";
import { PreQuoteDraftReferencesEditor } from "@/features/prequotes/components/prequote-draft-references-editor";
import { PreQuoteDraftRequirementsEditor } from "@/features/prequotes/components/prequote-draft-requirements-editor";
import {
  buildUpdateDraftRequest,
  createDraftEditModel,
  hasDraftChanges,
} from "@/features/prequotes/prequote-draft-edit-mappers";
import type { DraftEditModel } from "@/features/prequotes/prequote-draft-edit-types";
import { validateDraftEditModel } from "@/features/prequotes/prequote-draft-edit-validation";
import type { PreQuoteDraftDetails } from "@/features/prequotes/prequote-draft-types";
import {
  getUpdatePreQuoteDraftErrorMessage,
  useUpdatePreQuoteDraft,
} from "@/features/prequotes/use-update-prequote-draft";

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
  const [blockingNotice, setBlockingNotice] =
    useState<DraftEditBlockingNotice>(null);
  const updateDraft = useUpdatePreQuoteDraft();
  const errors = useMemo(
    () => validateDraftEditModel(model, draft),
    [draft, model],
  );
  const isDirty = hasDraftChanges(model, initialModel);
  const hasErrors = Object.keys(errors).length > 0;
  const disabled = updateDraft.isSubmitting || draft.status === "APPROVED";
  const errorFor = (key: string) => errors[key];

  const clearBlockingNotice = () => {
    setBlockingNotice(null);
    updateDraft.resetError();
  };

  const discardAndReload = () => {
    setBlockingNotice(null);
    updateDraft.resetError();
    onDiscardAndReload();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);
    setBlockingNotice(null);
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
      setBlockingNotice("version-conflict");
      return;
    }

    if (result.status === "already-approved") {
      setBlockingNotice("already-approved");
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-busy={updateDraft.isSubmitting}>
      <div className="min-w-0 space-y-6">
        <Surface>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Badge tone="warning">Modo edición</Badge>
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
                {updateDraft.isSubmitting
                  ? "Guardando cambios..."
                  : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </Surface>

        <DraftValidationAlert visible={showValidation && hasErrors} />
        <DraftEditNotice
          notice={blockingNotice}
          onContinue={clearBlockingNotice}
          onDiscardAndReload={discardAndReload}
        />
        <DraftSubmitErrorAlert
          visible={Boolean(updateDraft.error) && blockingNotice === null}
          message={
            updateDraft.error
              ? getUpdatePreQuoteDraftErrorMessage(updateDraft.error.cause)
              : null
          }
        />

        <PreQuoteDraftGeneralEditor
          model={model}
          disabled={disabled}
          errorFor={errorFor}
          onChange={setModel}
        />
        <PreQuoteDraftItemsEditor
          model={model}
          draft={draft}
          disabled={disabled}
          errorFor={errorFor}
          onChange={setModel}
        />
        <PreQuoteDraftRequirementsEditor
          model={model}
          disabled={disabled}
          errorFor={errorFor}
          onChange={setModel}
        />
        <PreQuoteDraftReferencesEditor
          model={model}
          disabled={disabled}
          errorFor={errorFor}
          onChange={setModel}
        />
        <PreQuoteDraftFindingsEditor
          model={model}
          draft={draft}
          disabled={disabled}
          errorFor={errorFor}
          onChange={setModel}
        />
      </div>
    </form>
  );
}
