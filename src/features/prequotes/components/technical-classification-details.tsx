import { Badge } from "@/components/ui/badge";
import {
  formatTechnicalClassificationSource,
  formatTechnicalConfidence,
  formatTechnicalReviewReason,
} from "@/features/prequotes/prequote-technical-formatters";
import type { StructuredItemTechnicalClassification } from "@/features/prequotes/prequote-technical-types";
import { cn } from "@/lib/utils/cn";

function nullableText(value: string | null): string {
  return value && value.trim().length > 0 ? value : "—";
}

function TechnicalField({ label, value }: { label: string; value: string }) {
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

function TechnicalBlock({
  title,
  code,
  originalText,
  source,
  confidence,
}: {
  title: string;
  code: string | null;
  originalText: string | null;
  source: StructuredItemTechnicalClassification["systemSource"];
  confidence: number | null;
}) {
  return (
    <div className="min-w-0 rounded-sm border border-border-subtle bg-surface p-4">
      <h5 className="text-sm font-semibold text-foreground">{title}</h5>
      <dl className="mt-4 grid gap-4">
        <TechnicalField label="Código" value={nullableText(code)} />
        <TechnicalField label="Texto detectado" value={nullableText(originalText)} />
        <TechnicalField
          label="Fuente"
          value={formatTechnicalClassificationSource(source)}
        />
        <TechnicalField
          label="Confianza"
          value={formatTechnicalConfidence(confidence)}
        />
      </dl>
    </div>
  );
}

function ReviewReasons({
  classification,
}: {
  classification: StructuredItemTechnicalClassification;
}) {
  if (classification.reviewReasons.length === 0) {
    return (
      <p className="mt-3 text-sm leading-6 text-foreground-secondary">
        {classification.requiresReview
          ? "El Backend marcó la clasificación para revisión sin indicar un motivo."
          : "Sin motivos de revisión registrados."}
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2">
      {classification.reviewReasons.map((reason, index) => (
        <li
          key={`${reason}-${index}`}
          className="min-w-0 rounded-sm bg-surface p-3 text-sm leading-6 text-foreground-secondary"
        >
          <span className="block break-words text-foreground">
            {formatTechnicalReviewReason(reason)}
          </span>
          <code className="mt-1 block break-words text-xs text-foreground-secondary">
            Código: {reason}
          </code>
        </li>
      ))}
    </ul>
  );
}

export function TechnicalClassificationDetails({
  classification,
  className,
  idPrefix,
  sourceClassificationId,
}: {
  classification: StructuredItemTechnicalClassification | null;
  className?: string;
  idPrefix: string;
  sourceClassificationId?: string | null;
}) {
  const titleId = `${idPrefix}-technical-classification-title`;

  if (classification === null) {
    return (
      <section
        aria-labelledby={titleId}
        className={cn(
          "min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4",
          className,
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h4 id={titleId} className="text-sm font-semibold text-foreground">
            Clasificación técnica
          </h4>
          <Badge tone="neutral" size="sm" className="w-fit">
            Sin clasificación
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground-secondary">
          No hay clasificación técnica registrada para este ítem.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4 id={titleId} className="text-sm font-semibold text-foreground">
          Clasificación técnica
        </h4>
        <Badge
          tone={classification.requiresReview ? "warning" : "success"}
          size="sm"
          className="w-fit"
        >
          {classification.requiresReview
            ? "Requiere revisión"
            : "Sin revisión pendiente"}
        </Badge>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <TechnicalBlock
          title="Sistema"
          code={classification.systemCode}
          originalText={classification.systemOriginalText}
          source={classification.systemSource}
          confidence={classification.systemConfidence}
        />
        <TechnicalBlock
          title="Marco"
          code={classification.frameCode}
          originalText={classification.frameOriginalText}
          source={classification.frameSource}
          confidence={classification.frameConfidence}
        />
        <TechnicalBlock
          title="Acabado"
          code={classification.finishCode}
          originalText={classification.finishOriginalText}
          source={classification.finishSource}
          confidence={classification.finishConfidence}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-foreground-secondary">
          Motivos de revisión
        </p>
        <ReviewReasons classification={classification} />
      </div>

      {sourceClassificationId ? (
        <p className="mt-4 break-words text-xs text-foreground-secondary">
          Clasificación fuente: {sourceClassificationId}
        </p>
      ) : null}
    </section>
  );
}
