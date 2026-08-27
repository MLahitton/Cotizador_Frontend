import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatNullableDraftText,
  formatPreQuoteDraftInclusion,
  formatPreQuoteDraftOrigin,
  formatPreQuoteDraftQuantity,
} from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftDocumentReference } from "@/features/prequotes/prequote-draft-types";

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

export function PreQuoteDraftReferencesSection({
  references,
}: {
  references: PreQuoteDraftDocumentReference[];
}) {
  const sortedReferences = [...references].sort(
    (left, right) => left.sequence - right.sequence,
  );

  return (
    <section
      id="draft-references"
      aria-labelledby="draft-references-title"
      className="space-y-3"
    >
      <h2 id="draft-references-title" className="text-lg font-semibold text-foreground">
        Referencias documentales
      </h2>

      {sortedReferences.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No hay referencias documentales adicionales.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {sortedReferences.map((reference) => (
            <li key={reference.draftDocumentReferenceId}>
              <Surface>
                <article className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-foreground-secondary">
                        Referencia {formatPreQuoteDraftQuantity(reference.sequence)}
                      </p>
                      <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                        {formatNullableDraftText(reference.reference)}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-6 text-foreground-secondary">
                        {reference.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={reference.isIncluded ? "success" : "neutral"} size="sm">
                        {formatPreQuoteDraftInclusion(reference.isIncluded)}
                      </Badge>
                      <Badge tone={reference.origin === "AI" ? "info" : "brand"} size="sm">
                        {formatPreQuoteDraftOrigin(reference.origin)}
                      </Badge>
                    </div>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailValue
                      label="Detalle"
                      value={formatNullableDraftText(reference.detail)}
                    />
                    <DetailValue
                      label="Cantidad"
                      value={formatPreQuoteDraftQuantity(reference.quantity)}
                    />
                    <DetailValue
                      label="Secuencia original"
                      value={formatPreQuoteDraftQuantity(reference.sourceSequence)}
                    />
                  </dl>
                </article>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
