import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  FieldError,
  joinDescribedBy,
  TextArea,
} from "@/features/prequotes/components/prequote-draft-editor-fields";
import { resolutionTone } from "@/features/prequotes/components/prequote-draft-item-editor";
import type {
  DraftEditFindingModel,
  DraftEditModel,
} from "@/features/prequotes/prequote-draft-edit-types";
import {
  formatPreQuoteDraftConflictCode,
  formatPreQuoteDraftIssueCode,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftConflict,
  PreQuoteDraftDetails,
  PreQuoteDraftIssue,
  PreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-types";

const RESOLUTION_OPTIONS: PreQuoteDraftResolutionStatus[] = [
  "PENDING",
  "RESOLVED",
  "DISMISSED",
];

const GLASS_ISSUE_CODES = new Set([
  "GLASS_TYPE_NOT_IDENTIFIED",
  "GLASS_TYPE_AMBIGUOUS",
  "GLASS_TYPE_CONFLICT",
]);

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
  const statusError = errorFor(`${prefix}.resolutionStatus`);
  const noteError = errorFor(`${prefix}.resolutionNote`);
  const isGlassIssue = kind === "issues" && GLASS_ISSUE_CODES.has(source.code);

  return (
    <Surface>
      <article className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              {kind === "issues" ? "Observación" : "Conflicto"} {formatPreQuoteDraftQuantity(source.sequence)}
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
          <Badge tone={resolutionTone(finding.resolutionStatus)} size="sm">
            {formatPreQuoteDraftResolutionStatus(finding.resolutionStatus)}
          </Badge>
        </div>
        {isGlassIssue ? (
          <div className="rounded-sm border border-warning bg-warning-soft p-3 text-sm leading-6 text-warning">
            Cambiar el estado de esta observación registra la revisión, pero no
            cambia el tipo de vidrio ni recalcula su valoración.
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
              aria-invalid={Boolean(statusError) || undefined}
              aria-describedby={joinDescribedBy(
                statusError ? `${prefix}.resolutionStatus-error` : undefined,
              )}
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
            <FieldError id={`${prefix}.resolutionStatus-error`} message={statusError} />
          </div>
          <div>
            <label htmlFor={`${prefix}.resolutionNote`} className="mb-2 block text-sm font-semibold text-foreground">
              Nota
            </label>
            <TextArea
              id={`${prefix}.resolutionNote`}
              value={finding.resolutionNote}
              disabled={disabled || finding.resolutionStatus === "PENDING"}
              invalid={Boolean(noteError)}
              describedBy={joinDescribedBy(
                noteError ? `${prefix}.resolutionNote-error` : undefined,
              )}
              onChange={(value) => onChange({ ...finding, resolutionNote: value })}
            />
            <FieldError id={`${prefix}.resolutionNote-error`} message={noteError} />
          </div>
        </div>
      </article>
    </Surface>
  );
}

export function PreQuoteDraftFindingsEditor({
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
          Conflictos
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
