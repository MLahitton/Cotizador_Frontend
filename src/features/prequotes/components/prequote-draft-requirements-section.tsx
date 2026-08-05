import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  formatPreQuoteDraftInclusion,
  formatPreQuoteDraftOrigin,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftRequirementCategory,
} from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftRequirement } from "@/features/prequotes/prequote-draft-types";

export function PreQuoteDraftRequirementsSection({
  requirements,
}: {
  requirements: PreQuoteDraftRequirement[];
}) {
  const sortedRequirements = [...requirements].sort(
    (left, right) => left.sequence - right.sequence,
  );

  return (
    <section
      id="draft-requirements"
      aria-labelledby="draft-requirements-title"
      className="space-y-3"
    >
      <h2 id="draft-requirements-title" className="text-lg font-semibold text-foreground">
        Requisitos
      </h2>

      {sortedRequirements.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No hay requisitos registrados en el borrador.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-3">
          {sortedRequirements.map((requirement) => (
            <li key={requirement.draftRequirementId}>
              <Surface>
                <article className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-foreground-secondary">
                        Requisito {formatPreQuoteDraftQuantity(requirement.sequence)}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">
                        {formatPreQuoteDraftRequirementCategory(requirement.category)}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={requirement.isIncluded ? "success" : "neutral"} size="sm">
                        {formatPreQuoteDraftInclusion(requirement.isIncluded)}
                      </Badge>
                      <Badge tone={requirement.origin === "AI" ? "info" : "brand"} size="sm">
                        {formatPreQuoteDraftOrigin(requirement.origin)}
                      </Badge>
                    </div>
                  </div>
                  <p className="break-words text-sm leading-6 text-foreground-secondary">
                    {requirement.value}
                  </p>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                        Secuencia original
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {formatPreQuoteDraftQuantity(requirement.sourceSequence)}
                      </dd>
                    </div>
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
