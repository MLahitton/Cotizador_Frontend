import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatNullableDraftText,
  formatPreQuoteDraftConflictCode,
  formatPreQuoteDraftDateTime,
  formatPreQuoteDraftIssueCode,
  formatPreQuoteDraftPages,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftConflict,
  PreQuoteDraftIssue,
  PreQuoteDraftResolutionStatus,
  PreQuoteDraftSummary,
} from "@/features/prequotes/prequote-draft-types";

function resolutionTone(status: PreQuoteDraftResolutionStatus) {
  if (status === "RESOLVED") return "success";
  if (status === "DISMISSED") return "neutral";
  return "warning";
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm bg-surface-subtle p-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-foreground">
        {formatPreQuoteDraftQuantity(value)}
      </dd>
    </div>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function IssueRow({ issue }: { issue: PreQuoteDraftIssue }) {
  return (
    <li>
      <Surface>
        <article className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-foreground-secondary">
                Observación {formatPreQuoteDraftQuantity(issue.sequence)}
              </p>
              <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                {formatPreQuoteDraftIssueCode(issue.code)}
              </h3>
              <p className="mt-2 break-words text-sm leading-6 text-foreground-secondary">
                {issue.message}
              </p>
            </div>
            <Badge tone={resolutionTone(issue.resolutionStatus)} size="sm">
              {formatPreQuoteDraftResolutionStatus(issue.resolutionStatus)}
            </Badge>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailValue
              label="Ítem relacionado"
              value={formatPreQuoteDraftQuantity(issue.itemSequence)}
            />
            <DetailValue
              label="Páginas"
              value={formatPreQuoteDraftPages(issue.pageNumbers)}
            />
            <DetailValue
              label="Nota de resolución"
              value={formatNullableDraftText(issue.resolutionNote)}
            />
            <DetailValue
              label="Fecha de resolución"
              value={formatPreQuoteDraftDateTime(issue.resolvedAtUtc)}
            />
          </dl>
          <details className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Trazabilidad técnica
            </summary>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <DetailValue label="Identificador" value={issue.draftIssueId} />
              <DetailValue
                label="Usuario que resolvió"
                value={formatNullableDraftText(issue.resolvedByUserId)}
              />
            </dl>
          </details>
        </article>
      </Surface>
    </li>
  );
}

function ConflictRow({ conflict }: { conflict: PreQuoteDraftConflict }) {
  return (
    <li>
      <Surface>
        <article className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-foreground-secondary">
                Conflicto {formatPreQuoteDraftQuantity(conflict.sequence)}
              </p>
              <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                {formatPreQuoteDraftConflictCode(conflict.code)}
              </h3>
              <p className="mt-2 break-words text-sm leading-6 text-foreground-secondary">
                {conflict.message}
              </p>
            </div>
            <Badge tone={resolutionTone(conflict.resolutionStatus)} size="sm">
              {formatPreQuoteDraftResolutionStatus(conflict.resolutionStatus)}
            </Badge>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailValue
              label="Ítems relacionados"
              value={
                conflict.itemSequences.length === 0
                  ? "—"
                  : conflict.itemSequences.join(", ")
              }
            />
            <DetailValue
              label="Páginas"
              value={formatPreQuoteDraftPages(conflict.pageNumbers)}
            />
            <DetailValue
              label="Nota de resolución"
              value={formatNullableDraftText(conflict.resolutionNote)}
            />
            <DetailValue
              label="Fecha de resolución"
              value={formatPreQuoteDraftDateTime(conflict.resolvedAtUtc)}
            />
          </dl>
          <details className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Trazabilidad técnica
            </summary>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <DetailValue label="Identificador" value={conflict.draftConflictId} />
              <DetailValue
                label="Usuario que resolvió"
                value={formatNullableDraftText(conflict.resolvedByUserId)}
              />
            </dl>
          </details>
        </article>
      </Surface>
    </li>
  );
}

export function PreQuoteDraftFindingsSection({
  issues,
  conflicts,
  summary,
}: {
  issues: PreQuoteDraftIssue[];
  conflicts: PreQuoteDraftConflict[];
  summary: PreQuoteDraftSummary | null;
}) {
  const sortedIssues = [...issues].sort((left, right) => left.sequence - right.sequence);
  const sortedConflicts = [...conflicts].sort(
    (left, right) => left.sequence - right.sequence,
  );

  return (
    <section
      id="draft-findings"
      aria-labelledby="draft-findings-title"
      className="space-y-5"
    >
      <div>
        <h2 id="draft-findings-title" className="text-lg font-semibold text-foreground">
          Hallazgos
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Observaciones y conflictos registrados en el borrador.
        </p>
      </div>

      {summary ? (
        <Surface padding="none" className="min-w-0 overflow-hidden">
          <section className="p-5 sm:p-6" aria-labelledby="draft-findings-summary">
            <h3 id="draft-findings-summary" className="text-base font-semibold text-foreground">
              Resumen de hallazgos
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Issues pendientes" value={summary.pendingIssueCount} />
              <Metric label="Issues resueltos" value={summary.resolvedIssueCount} />
              <Metric label="Issues descartados" value={summary.dismissedIssueCount} />
              <Metric
                label="Conflicts pendientes"
                value={summary.pendingConflictCount}
              />
              <Metric
                label="Conflicts resueltos"
                value={summary.resolvedConflictCount}
              />
              <Metric
                label="Conflicts descartados"
                value={summary.dismissedConflictCount}
              />
            </dl>
          </section>
        </Surface>
      ) : null}

      <section aria-labelledby="draft-issues-title" className="space-y-3">
        <h3 id="draft-issues-title" className="text-base font-semibold text-foreground">
          Issues
        </h3>
        {sortedIssues.length === 0 ? (
          <Surface>
            <p className="text-sm text-foreground-secondary">
              No hay observaciones registradas.
            </p>
          </Surface>
        ) : (
          <ul className="space-y-3">
            {sortedIssues.map((issue) => (
              <IssueRow key={issue.draftIssueId} issue={issue} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="draft-conflicts-title" className="space-y-3">
        <h3 id="draft-conflicts-title" className="text-base font-semibold text-foreground">
          Conflicts
        </h3>
        {sortedConflicts.length === 0 ? (
          <Surface>
            <p className="text-sm text-foreground-secondary">
              No hay conflictos registrados.
            </p>
          </Surface>
        ) : (
          <ul className="space-y-3">
            {sortedConflicts.map((conflict) => (
              <ConflictRow key={conflict.draftConflictId} conflict={conflict} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
