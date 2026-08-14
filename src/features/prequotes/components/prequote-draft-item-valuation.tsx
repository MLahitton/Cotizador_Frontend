import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import {
  formatNullableDraftText,
  formatPreQuoteDraftArea,
  formatPreQuoteDraftConfidenceScore,
  formatPreQuoteDraftDateTime,
  formatPreQuoteDraftDimension,
  formatPreQuoteDraftFactor,
  formatPreQuoteDraftInvalidationReason,
  formatPreQuoteDraftMoney,
  formatPreQuoteDraftNumber,
  formatPreQuoteDraftNullableReview,
  formatPreQuoteDraftPriceRangeVersion,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftValuationReason,
  formatPreQuoteDraftValuationStatus,
  formatPreQuotePricingConfidenceLevel,
  formatPreQuotePricingSource,
  formatPreQuotePricingNoteCode,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftItemValuation as PreQuoteDraftItemValuationModel,
  PreQuoteDraftValuationStatus,
} from "@/features/prequotes/prequote-draft-types";
import { formatTechnicalClassificationSource } from "@/features/prequotes/prequote-technical-formatters";
import { cn } from "@/lib/utils/cn";

type AmountRangeProps = {
  label: string;
  minimum: number | null;
  expected: number | null;
  maximum: number | null;
  currency: string | null;
  emphasis?: boolean;
};

function statusTone(status: PreQuoteDraftValuationStatus): BadgeProps["tone"] {
  if (status === "VALUED") {
    return "success";
  }

  if (status === "PENDING") {
    return "info";
  }

  if (status === "NOT_PRICEABLE") {
    return "neutral";
  }

  return "warning";
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

function ValuationSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-3">
      <h5 id={id} className="text-sm font-semibold text-foreground">
        {title}
      </h5>
      {children}
    </section>
  );
}

function ValuationAmountRange({
  currency,
  emphasis = false,
  expected,
  label,
  maximum,
  minimum,
}: AmountRangeProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-sm border border-border-subtle bg-surface p-4",
        emphasis && "bg-brand-soft",
      )}
    >
      <h6 className="text-sm font-semibold text-foreground">{label}</h6>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <DetailValue
          label="Mínimo"
          value={formatPreQuoteDraftMoney(minimum, currency)}
        />
        <DetailValue
          label="Esperado"
          value={formatPreQuoteDraftMoney(expected, currency)}
        />
        <DetailValue
          label="Máximo"
          value={formatPreQuoteDraftMoney(maximum, currency)}
        />
      </dl>
    </div>
  );
}

function StatusMessage({
  status,
}: {
  status: PreQuoteDraftValuationStatus;
}) {
  const message =
    status === "PENDING"
      ? "La valoración económica está pendiente."
      : status === "STALE"
        ? "La valoración ya no está vigente porque cambiaron datos usados en el cálculo."
        : status === "REQUIRES_REVIEW"
          ? "La valoración requiere revisión antes de utilizarse como base económica definitiva."
          : status === "NOT_PRICEABLE"
            ? "No se pudo establecer un precio confiable. Requiere información o revisión adicional."
            : null;

  if (!message) {
    return null;
  }

  return (
    <div className="mt-3 flex items-start gap-3 rounded-sm border border-warning bg-warning-soft p-3 text-warning">
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        size={18}
        strokeWidth={1.75}
      />
      <p className="text-sm leading-6">{message}</p>
    </div>
  );
}

function PricingNoteList({
  emptyMessage,
  nullMessage,
  tone = "neutral",
  values,
}: {
  emptyMessage: string;
  nullMessage: string;
  tone?: "neutral" | "warning";
  values: string[] | null;
}) {
  if (values === null) {
    return (
      <p className="text-sm leading-6 text-foreground-secondary">
        {nullMessage}
      </p>
    );
  }

  if (values.length === 0) {
    return (
      <p className="text-sm leading-6 text-foreground-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {values.map((code, index) => (
        <li
          key={`${code}-${index}`}
          className={cn(
            "min-w-0 rounded-sm bg-surface p-3 text-sm leading-6",
            tone === "warning"
              ? "text-warning"
              : "text-foreground-secondary",
          )}
        >
          <span className="block break-words text-foreground">
            {formatPreQuotePricingNoteCode(code)}
          </span>
          <code className="mt-1 block break-words text-xs text-foreground-secondary">
            Código: {code}
          </code>
        </li>
      ))}
    </ul>
  );
}

function MissingDataWarning({
  missingData,
}: {
  missingData: string[] | null;
}) {
  if (!missingData || missingData.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex items-start gap-3 rounded-sm border border-warning bg-warning-soft p-3 text-warning">
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        size={18}
        strokeWidth={1.75}
      />
      <p className="text-sm leading-6">
        La valoración reporta datos faltantes para revisión económica.
      </p>
    </div>
  );
}

export function PreQuoteDraftItemValuation({
  idPrefix,
  valuation,
  variant = "full",
}: {
  valuation: PreQuoteDraftItemValuationModel | null;
  idPrefix: string;
  variant?: "full" | "compact";
}) {
  const titleId = `${idPrefix}-valuation-title`;

  if (valuation === null) {
    return (
      <section
        className="rounded-sm border border-border-subtle bg-surface-subtle p-4"
        aria-labelledby={titleId}
      >
        <h4 id={titleId} className="text-sm font-semibold text-foreground">
          Valoración
        </h4>
        <p className="mt-3 text-sm leading-6 text-foreground-secondary">
          No hay una valoración registrada para este ítem.
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground-secondary">
          El Backend no proporcionó un estado económico individual.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-sm border border-border-subtle bg-surface-subtle p-4"
      aria-labelledby={titleId}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4 id={titleId} className="text-sm font-semibold text-foreground">
          Valoración
        </h4>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(valuation.status)} size="sm">
            {formatPreQuoteDraftValuationStatus(valuation.status)}
          </Badge>
          {valuation.requiresReview === true ? (
            <Badge tone="warning" size="sm">
              Revisión económica
            </Badge>
          ) : null}
        </div>
      </div>

      <StatusMessage status={valuation.status} />
      <MissingDataWarning missingData={valuation.missingData} />

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DetailValue
          label="Estado"
          value={formatPreQuoteDraftValuationStatus(valuation.status)}
        />
        <DetailValue
          label="Motivo"
          value={formatPreQuoteDraftValuationReason(valuation.reason)}
        />
        <DetailValue
          label="Moneda"
          value={formatNullableDraftText(valuation.currency)}
        />
        <DetailValue
          label="Confianza de la valoración"
          value={formatPreQuotePricingConfidenceLevel(valuation.confidenceLevel)}
        />
        <DetailValue
          label="Puntaje de confianza"
          value={formatPreQuoteDraftConfidenceScore(valuation.confidenceScore)}
        />
        <DetailValue
          label="Requiere revisión"
          value={formatPreQuoteDraftNullableReview(valuation.requiresReview)}
        />
        <DetailValue
          label="Fuente del precio"
          value={formatPreQuotePricingSource(valuation.pricingSource)}
        />
        {valuation.historicalComparableCount !== null ? (
          <DetailValue
            label="Históricos comparables"
            value={`${formatPreQuoteDraftNumber(valuation.historicalComparableCount)} totales${
              valuation.strongComparableCount === null
                ? ""
                : ` · ${formatPreQuoteDraftNumber(valuation.strongComparableCount)} de alta similitud`
            }`}
          />
        ) : null}
      </dl>

      <div className="mt-4">
        <ValuationAmountRange
          label="Total del ítem"
          minimum={valuation.itemMinimumAmount}
          expected={valuation.itemExpectedAmount}
          maximum={valuation.itemMaximumAmount}
          currency={valuation.currency}
          emphasis
        />
      </div>

      <details
        className={cn(
          "mt-4 rounded-sm border border-border-subtle bg-surface p-3",
          variant === "compact" && "bg-surface-subtle",
        )}
      >
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Ver desglose económico completo
        </summary>

        <div className="mt-4 space-y-5">
          <ValuationSection
            id={`${idPrefix}-valuation-inputs-title`}
            title="Datos usados en el cálculo"
          >
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailValue
                label="Medidas utilizadas"
                value={`${formatPreQuoteDraftDimension(
                  valuation.widthMillimetersUsed,
                )} x ${formatPreQuoteDraftDimension(
                  valuation.heightMillimetersUsed,
                )}`}
              />
              <DetailValue
                label="Cantidad utilizada"
                value={formatPreQuoteDraftQuantity(valuation.quantityUsed)}
              />
              <DetailValue
                label="Área geométrica por unidad"
                value={formatPreQuoteDraftArea(valuation.unitAreaSquareMeters)}
              />
              <DetailValue
                label="Área facturable por unidad"
                value={formatPreQuoteDraftArea(
                  valuation.billableAreaUnitSquareMeters,
                )}
              />
              <DetailValue
                label="Área total"
                value={formatPreQuoteDraftArea(valuation.totalAreaSquareMeters)}
              />
              <DetailValue
                label="Versión del rango de vidrio"
                value={formatPreQuoteDraftPriceRangeVersion(
                  valuation.glassPriceRangeVersion,
                )}
              />
              <DetailValue
                label="Moneda"
                value={formatNullableDraftText(valuation.currency)}
              />
            </dl>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-pricing-config-title`}
            title="Configuración técnica usada en pricing"
          >
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailValue
                label="Sistema utilizado"
                value={formatNullableDraftText(valuation.systemCode)}
              />
              <DetailValue
                label="Fuente del sistema"
                value={formatTechnicalClassificationSource(
                  valuation.systemSource,
                )}
              />
              <DetailValue
                label="Marco utilizado"
                value={formatNullableDraftText(valuation.frameCode)}
              />
              <DetailValue
                label="Acabado utilizado"
                value={formatNullableDraftText(valuation.finishCode)}
              />
              <DetailValue
                label="Perfil de mano de obra"
                value={formatNullableDraftText(valuation.laborProfileCode)}
              />
              <DetailValue
                label="Perfil de ensamble"
                value={formatNullableDraftText(valuation.assemblyProfileCode)}
              />
              <DetailValue
                label="Versión del perfil de precios"
                value={formatNullableDraftText(valuation.pricingProfileVersion)}
              />
            </dl>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-glass-prices-title`}
            title="Precios del vidrio"
          >
            <ValuationAmountRange
              label="Precio de vidrio por m²"
              minimum={valuation.glassMinimumPricePerSquareMeter}
              expected={valuation.glassExpectedPricePerSquareMeter}
              maximum={valuation.glassMaximumPricePerSquareMeter}
              currency={valuation.currency}
            />
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-factors-title`}
            title="Factores"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
                <h6 className="text-sm font-semibold text-foreground">
                  Factor de acabado
                </h6>
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  <DetailValue
                    label="Mínimo"
                    value={formatPreQuoteDraftFactor(
                      valuation.finishFactorMinimum,
                    )}
                  />
                  <DetailValue
                    label="Esperado"
                    value={formatPreQuoteDraftFactor(
                      valuation.finishFactorExpected,
                    )}
                  />
                  <DetailValue
                    label="Máximo"
                    value={formatPreQuoteDraftFactor(
                      valuation.finishFactorMaximum,
                    )}
                  />
                </dl>
              </div>
              <div className="rounded-sm border border-border-subtle bg-surface-subtle p-4">
                <h6 className="text-sm font-semibold text-foreground">
                  Factor de accesorios
                </h6>
                <dl className="mt-3">
                  <DetailValue
                    label="Factor"
                    value={formatPreQuoteDraftFactor(valuation.accessoryFactor)}
                  />
                </dl>
              </div>
            </div>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-components-title`}
            title="Desglose por componentes"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <ValuationAmountRange
                label="Vidrio"
                minimum={valuation.glassMinimumAmount}
                expected={valuation.glassExpectedAmount}
                maximum={valuation.glassMaximumAmount}
                currency={valuation.currency}
              />
              <ValuationAmountRange
                label="Mano de obra"
                minimum={valuation.laborMinimumAmount}
                expected={valuation.laborExpectedAmount}
                maximum={valuation.laborMaximumAmount}
                currency={valuation.currency}
              />
              <ValuationAmountRange
                label="Ensamble"
                minimum={valuation.assemblyMinimumAmount}
                expected={valuation.assemblyExpectedAmount}
                maximum={valuation.assemblyMaximumAmount}
                currency={valuation.currency}
              />
              <ValuationAmountRange
                label="Accesorios"
                minimum={valuation.accessoriesMinimumAmount}
                expected={valuation.accessoriesExpectedAmount}
                maximum={valuation.accessoriesMaximumAmount}
                currency={valuation.currency}
              />
              <div className="md:col-span-2">
                <ValuationAmountRange
                  label="Total del ítem"
                  minimum={valuation.itemMinimumAmount}
                  expected={valuation.itemExpectedAmount}
                  maximum={valuation.itemMaximumAmount}
                  currency={valuation.currency}
                  emphasis
                />
              </div>
            </div>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-legacy-title`}
            title="Valores heredados"
          >
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailValue
                label="Precio registrado por m²"
                value={formatPreQuoteDraftMoney(
                  valuation.unitPricePerSquareMeter,
                  valuation.currency,
                )}
              />
              <DetailValue
                label="Valor unitario registrado"
                value={formatPreQuoteDraftMoney(
                  valuation.unitAmount,
                  valuation.currency,
                )}
              />
              <DetailValue
                label="Valor total registrado"
                value={formatPreQuoteDraftMoney(
                  valuation.totalAmount,
                  valuation.currency,
                )}
              />
            </dl>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-notes-title`}
            title="Supuestos y datos faltantes"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4">
                <h6 className="text-sm font-semibold text-foreground">
                  Supuestos
                </h6>
                <div className="mt-3">
                  <PricingNoteList
                    values={valuation.assumptions}
                    nullMessage="El Backend no informó supuestos para esta valoración."
                    emptyMessage="Sin supuestos registrados."
                  />
                </div>
              </div>
              <div className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4">
                <h6 className="text-sm font-semibold text-foreground">
                  Datos faltantes
                </h6>
                <div className="mt-3">
                  <PricingNoteList
                    values={valuation.missingData}
                    tone="warning"
                    nullMessage="El Backend no informó el estado de los datos faltantes."
                    emptyMessage="Sin datos faltantes registrados."
                  />
                </div>
              </div>
            </div>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-dates-title`}
            title="Fechas e invalidación"
          >
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DetailValue
                label="Fecha de valoración registrada"
                value={formatPreQuoteDraftDateTime(valuation.valuedAtUtc)}
              />
              <DetailValue
                label="Fecha del cálculo técnico"
                value={formatPreQuoteDraftDateTime(valuation.calculatedAtUtc)}
              />
              <DetailValue
                label="Fecha de invalidación"
                value={formatPreQuoteDraftDateTime(valuation.invalidatedAtUtc)}
              />
              <DetailValue
                label="Motivo de invalidación"
                value={formatPreQuoteDraftInvalidationReason(
                  valuation.invalidationReason,
                )}
              />
            </dl>
          </ValuationSection>

          <ValuationSection
            id={`${idPrefix}-valuation-traceability-title`}
            title="Trazabilidad económica"
          >
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DetailValue
                label="Identificador fuente de la valoración"
                value={valuation.sourceStructuredItemValuationId}
              />
              <DetailValue
                label="Identificador del tipo de vidrio"
                value={formatNullableDraftText(valuation.glassTypeId)}
              />
              <DetailValue
                label="Identificador de la versión del rango"
                value={formatNullableDraftText(
                  valuation.glassPriceRangeVersionId,
                )}
              />
            </dl>
          </ValuationSection>
        </div>
      </details>
    </section>
  );
}
