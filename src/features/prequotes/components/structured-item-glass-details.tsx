import { Badge } from "@/components/ui/badge";
import {
  SourcePages,
  StructuredEvidenceList,
} from "@/features/prequotes/components/structured-evidence-list";
import {
  formatAreaSquareMeters,
  formatGlassAssignmentScope,
  formatGlassAssignmentScopeDescription,
  formatGlassReviewReason,
  formatGlassValuationReason,
  formatGlassValuationStatus,
  formatMoneyAmount,
  formatNullableText,
  formatPricePerSquareMeterRange,
  formatPriceRangeStatus,
  formatTechnicalClassificationSource,
} from "@/features/prequotes/structured-extraction-formatters";
import { formatPreQuoteDateTime } from "@/features/prequotes/prequote-formatters";
import type { StructuredItem } from "@/features/prequotes/structured-extraction-types";

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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

function hasGlassContract(item: StructuredItem): boolean {
  return "glass" in item;
}

function hasValuationContract(item: StructuredItem): boolean {
  return "valuation" in item;
}

function hasTechnicalClassificationContract(item: StructuredItem): boolean {
  return "technicalClassification" in item;
}

function GlassStatusBadge({ item }: { item: StructuredItem }) {
  const glass = item.glass ?? null;

  if (glass === null || glass?.normalizedCode === null) {
    return (
      <Badge tone="neutral" size="sm">
        No identificado
      </Badge>
    );
  }

  if (glass.requiresReview) {
    return (
      <Badge tone="warning" size="sm">
        Requiere revisión
      </Badge>
    );
  }

  return (
    <Badge tone="success" size="sm">
      Vidrio identificado
    </Badge>
  );
}

function ValuationStatusBadge({
  status,
}: {
  status: NonNullable<StructuredItem["valuation"]>["status"];
}) {
  return (
    <Badge tone={status === "VALUED" ? "success" : "warning"} size="sm">
      {formatGlassValuationStatus(status)}
    </Badge>
  );
}

export function StructuredItemGlassDetails({ item }: { item: StructuredItem }) {
  const shouldRenderGlass = hasGlassContract(item);
  const shouldRenderValuation = hasValuationContract(item);
  const shouldRenderTechnicalClassification =
    hasTechnicalClassificationContract(item);

  if (!shouldRenderGlass && !shouldRenderValuation && !shouldRenderTechnicalClassification) {
    return null;
  }

  const glass = shouldRenderGlass ? item.glass ?? null : null;
  const valuation = shouldRenderValuation ? item.valuation ?? null : null;
  const technicalClassification = shouldRenderTechnicalClassification
    ? item.technicalClassification ?? null
    : null;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {shouldRenderGlass ? (
        <section
          aria-labelledby={`item-${item.sequence}-glass-title`}
          className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h4
              id={`item-${item.sequence}-glass-title`}
              className="text-sm font-semibold text-foreground"
            >
              Vidrio
            </h4>
            <GlassStatusBadge item={item} />
          </div>

          {glass === null ? (
            <p className="mt-3 text-sm leading-6 text-foreground-secondary">
              No se identificó información de vidrio para este ítem.
            </p>
          ) : (
            <>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailValue
                  label="Especificación detectada"
                  value={formatNullableText(glass.rawSpecification)}
                />
                <DetailValue
                  label="Código normalizado"
                  value={glass.normalizedCode ?? "Código no identificado."}
                />
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                    Alcance
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatGlassAssignmentScope(glass.assignmentScope)}
                  </dd>
                  <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                    {formatGlassAssignmentScopeDescription(
                      glass.assignmentScope,
                    )}
                  </p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-foreground-secondary">
                    Páginas fuente
                  </dt>
                  <dd className="mt-1">
                    <SourcePages pages={glass.sourcePages} />
                  </dd>
                </div>
              </dl>

              {glass.reviewReasons.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-foreground-secondary">
                    Motivos de revisión
                  </p>
                  <ul className="mt-2 space-y-2">
                    {glass.reviewReasons.map((reason) => (
                      <li
                        key={reason}
                        className="text-sm leading-6 text-foreground-secondary"
                      >
                        {formatGlassReviewReason(reason)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4">
                <StructuredEvidenceList evidence={glass.evidence} />
              </div>
            </>
          )}
        </section>
      ) : null}

      {shouldRenderValuation ? (
        <section
          aria-labelledby={`item-${item.sequence}-valuation-title`}
          className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h4
              id={`item-${item.sequence}-valuation-title`}
              className="text-sm font-semibold text-foreground"
            >
              Valoración
            </h4>
            {valuation ? <ValuationStatusBadge status={valuation.status} /> : null}
          </div>

          {valuation === null ? (
            <p className="mt-3 text-sm leading-6 text-foreground-secondary">
              No hay una valoración disponible para este ítem.
            </p>
          ) : (
            <>
              {valuation.status === "NOT_VALUED" ? (
                <p className="mt-3 text-sm leading-6 text-warning">
                  {valuation.reason
                    ? formatGlassValuationReason(valuation.reason)
                    : "Backend no proporcionó una razón de no valoración."}
                </p>
              ) : null}

              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailValue
                  label="Área unitaria"
                  value={formatAreaSquareMeters(valuation.unitAreaSquareMeters)}
                />
                <DetailValue
                  label="Área total"
                  value={formatAreaSquareMeters(valuation.totalAreaSquareMeters)}
                />
                <DetailValue
                  label="Precio por m²"
                  value={formatPricePerSquareMeterRange(
                    valuation.minimumPricePerSquareMeter,
                    valuation.expectedPricePerSquareMeter,
                    valuation.maximumPricePerSquareMeter,
                    valuation.currency,
                  )}
                />
                <DetailValue
                  label="Monto mínimo"
                  value={formatMoneyAmount(
                    valuation.minimumAmount,
                    valuation.currency,
                  )}
                />
                <DetailValue
                  label="Monto esperado"
                  value={formatMoneyAmount(
                    valuation.expectedAmount,
                    valuation.currency,
                  )}
                />
                <DetailValue
                  label="Monto máximo"
                  value={formatMoneyAmount(
                    valuation.maximumAmount,
                    valuation.currency,
                  )}
                />
                <DetailValue
                  label="Moneda"
                  value={formatNullableText(valuation.currency)}
                />
                <DetailValue
                  label="Calculado"
                  value={formatPreQuoteDateTime(valuation.calculatedAtUtc)}
                />
                <DetailValue
                  label="Versión del rango"
                  value={
                    valuation.priceRangeVersion === null
                      ? "—"
                      : String(valuation.priceRangeVersion)
                  }
                />
                <DetailValue
                  label="Estado del rango"
                  value={
                    valuation.priceRangeStatus
                      ? formatPriceRangeStatus(valuation.priceRangeStatus)
                      : "—"
                  }
                />
              </dl>
            </>
          )}
        </section>
      ) : null}

      {shouldRenderTechnicalClassification ? (
        <section
          aria-labelledby={`item-${item.sequence}-technical-title`}
          className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4 lg:col-span-2"
        >
          <h4
            id={`item-${item.sequence}-technical-title`}
            className="text-sm font-semibold text-foreground"
          >
            Clasificación técnica
          </h4>
          {technicalClassification === null ? (
            <p className="mt-3 text-sm leading-6 text-foreground-secondary">
              No hay clasificación técnica registrada para este ítem.
            </p>
          ) : (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailValue
                label="Sistema"
                value={formatNullableText(technicalClassification.systemCode)}
              />
              <DetailValue
                label="Fuente sistema"
                value={formatTechnicalClassificationSource(
                  technicalClassification.systemSource,
                )}
              />
              <DetailValue
                label="Texto sistema"
                value={formatNullableText(
                  technicalClassification.systemOriginalText,
                )}
              />
              <DetailValue
                label="Marco"
                value={formatNullableText(technicalClassification.frameCode)}
              />
              <DetailValue
                label="Acabado"
                value={formatNullableText(technicalClassification.finishCode)}
              />
              <DetailValue
                label="Revisión"
                value={
                  technicalClassification.requiresReview
                    ? "Requiere revisión"
                    : "Sin revisión pendiente"
                }
              />
            </dl>
          )}
        </section>
      ) : null}
    </div>
  );
}
