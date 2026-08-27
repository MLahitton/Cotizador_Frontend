import { Surface } from "@/components/ui/surface";
import { TextInputField } from "@/features/prequotes/components/prequote-draft-editor-fields";
import type { DraftEditModel } from "@/features/prequotes/prequote-draft-edit-types";

export function PreQuoteDraftGeneralEditor({
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
          Información general
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <TextInputField
            id="project.projectName"
            label="Proyecto detectado"
            value={model.project.projectName}
            maxLength={500}
            disabled={disabled}
            error={errorFor("project.projectName")}
            onChange={(value) => setProjectField("projectName", value)}
          />
          <TextInputField
            id="project.clientName"
            label="Cliente detectado"
            value={model.project.clientName}
            maxLength={500}
            disabled={disabled}
            error={errorFor("project.clientName")}
            onChange={(value) => setProjectField("clientName", value)}
          />
          <TextInputField
            id="project.location"
            label="Ubicación"
            value={model.project.location}
            maxLength={500}
            disabled={disabled}
            error={errorFor("project.location")}
            onChange={(value) => setProjectField("location", value)}
          />
        </div>
      </section>
    </Surface>
  );
}
