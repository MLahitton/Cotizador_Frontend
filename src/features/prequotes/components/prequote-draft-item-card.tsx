import { Badge } from "@/components/ui/badge";
import { PreQuoteDraftItemValuation } from "@/features/prequotes/components/prequote-draft-item-valuation";
import { TechnicalClassificationDetails } from "@/features/prequotes/components/technical-classification-details";
import {
  formatNullableDraftText,
  formatPreQuoteDraftAssignmentScope,
  formatPreQuoteDraftDimension,
  formatPreQuoteDraftElementType,
  formatPreQuoteDraftEvidenceLocation,
  formatPreQuoteDraftEvidenceSource,
  formatPreQuoteDraftInclusion,
  formatPreQuoteDraftNumber,
  formatPreQuoteDraftOrigin,
  formatPreQuoteDraftPages,
  formatPreQuoteDraftQuantity,
  formatPreQuoteDraftReviewReason,
} from "@/features/prequotes/prequote-draft-formatters";
import type {
  PreQuoteDraftItem,
  PreQuoteDraftItemGlass,
  PreQuoteDraftItemGlassEvidence,
} from "@/features/prequotes/prequote-draft-types";

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

function DraftEvidenceList({
  evidence,
}: {
  evidence: PreQuoteDraftItemGlassEvidence[];
}) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm leading-6 text-foreground-secondary">
        No hay evidencia registrada.
      </p>
    );
  }

  return (
    <details className="min-w-0 rounded-sm border border-border-subtle bg-surface p-3">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Ver {evidence.length} {evidence.length === 1 ? "evidencia" : "evidencias"}
      </summary>
      <ul className="mt-3 space-y-3">
        {evidence.map((item) => (
          <li
            key={`${item.sequence}-${item.pageNumber ?? item.sheetName}-${item.cellRange ?? item.sourceType}`}
            className="min-w-0 rounded-sm bg-surface-subtle p-3"
          >
            <p className="break-words text-xs font-semibold uppercase text-foreground-secondary [overflow-wrap:anywhere]">
              {formatPreQuoteDraftEvidenceLocation(item)} ·{" "}
              {formatPreQuoteDraftEvidenceSource(item.sourceType)}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function DraftItemGlass({ glass }: { glass: PreQuoteDraftItemGlass | null }) {
  if (glass === null) {
    return (
      <section
        className="rounded-sm border border-border-subtle bg-surface-subtle p-4"
        aria-labelledby="draft-item-glass-empty-title"
      >
        <h4
          id="draft-item-glass-empty-title"
          className="text-sm font-semibold text-foreground"
        >
          Vidrio
        </h4>
        <p className="mt-3 text-sm leading-6 text-foreground-secondary">
          No hay información de vidrio registrada para este ítem.
        </p>
      </section>
    );
  }

  const hasIdentifiedGlass = Boolean(
    glass.normalizedCodeSnapshot || glass.rawSpecification || glass.glassTypeId,
  );

  return (
    <section
      className="rounded-sm border border-border-subtle bg-surface-subtle p-4"
      aria-labelledby={`draft-item-glass-${glass.sourceStructuredItemGlassId ?? "snapshot"}-title`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4
          id={`draft-item-glass-${glass.sourceStructuredItemGlassId ?? "snapshot"}-title`}
          className="text-sm font-semibold text-foreground"
        >
          Vidrio
        </h4>
        <Badge
          tone={glass.requiresReview ? "warning" : hasIdentifiedGlass ? "success" : "neutral"}
          size="sm"
        >
          {glass.requiresReview
            ? "Requiere revisión"
            : hasIdentifiedGlass
              ? "Vidrio identificado"
              : "Sin identificación"}
        </Badge>
      </div>

      {glass.requiresReview ? (
        <p className="mt-3 text-sm leading-6 text-warning">
          La información de vidrio necesita revisión antes de usarse como base
          definitiva.
        </p>
      ) : null}

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailValue
          label="Especificación detectada"
          value={formatNullableDraftText(glass.rawSpecification)}
        />
        <DetailValue
          label="Código normalizado"
          value={formatNullableDraftText(glass.normalizedCodeSnapshot)}
        />
        <DetailValue
          label="Alcance"
          value={formatPreQuoteDraftAssignmentScope(glass.assignmentScope)}
        />
        <DetailValue
          label="Estado de revisión"
          value={glass.requiresReview ? "Requiere revisión" : "Sin revisión pendiente"}
        />
        <DetailValue
          label="Páginas fuente"
          value={formatPreQuoteDraftPages(glass.sourcePages)}
        />
      </dl>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-foreground-secondary">
          Motivos de revisión
        </p>
        {glass.reviewReasons.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-secondary">—</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {glass.reviewReasons.map((reason) => (
              <li key={reason} className="text-sm leading-6 text-foreground-secondary">
                {formatPreQuoteDraftReviewReason(reason)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-foreground-secondary">
          Evidencia
        </p>
        <DraftEvidenceList evidence={glass.evidence} />
      </div>
    </section>
  );
}

function isItemComplete(item: PreQuoteDraftItem): boolean {
  return (
    !item.isIncluded ||
    (item.description.trim().length > 0 &&
      item.elementType !== "OTHER" &&
      (item.widthMillimeters ?? 0) > 0 &&
      (item.heightMillimeters ?? 0) > 0 &&
      (item.quantity ?? 0) > 0)
  );
}

export function PreQuoteDraftItemCard({ item }: { item: PreQuoteDraftItem }) {
  const complete = isItemComplete(item);

  return (
    <article className="p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-foreground-secondary">
            Ítem {formatPreQuoteDraftNumber(item.sequence)}
          </p>
          <h3 className="mt-1 break-words text-base font-semibold text-foreground">
            {item.reference ?? `Ítem ${item.sequence}`}
          </h3>
          <p className="mt-2 break-words text-sm leading-6 text-foreground-secondary">
            {item.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={item.isIncluded ? "success" : "neutral"} size="sm">
            {formatPreQuoteDraftInclusion(item.isIncluded)}
          </Badge>
          <Badge tone={item.origin === "AI" ? "info" : "brand"} size="sm">
            {formatPreQuoteDraftOrigin(item.origin)}
          </Badge>
          {!complete ? (
            <Badge tone="warning" size="sm">
              Requiere completar
            </Badge>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailValue
          label="Tipo de elemento"
          value={formatPreQuoteDraftElementType(item.elementType)}
        />
        <DetailValue
          label="Medidas originales"
          value={formatNullableDraftText(item.rawMeasurements)}
        />
        <DetailValue
          label="Ancho"
          value={formatPreQuoteDraftDimension(item.widthMillimeters)}
        />
        <DetailValue
          label="Alto"
          value={formatPreQuoteDraftDimension(item.heightMillimeters)}
        />
        <DetailValue
          label="Cantidad"
          value={formatPreQuoteDraftQuantity(item.quantity)}
        />
        <DetailValue
          label="Secuencia original"
          value={formatPreQuoteDraftQuantity(item.sourceSequence)}
        />
      </dl>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DraftItemGlass glass={item.glass} />
        <PreQuoteDraftItemValuation
          idPrefix={`draft-item-${item.id}`}
          valuation={item.valuation}
          variant="full"
        />
      </div>

      <TechnicalClassificationDetails
        idPrefix={`draft-item-${item.id}`}
        classification={item.technicalSnapshot}
        className="mt-4"
      />

      <details className="mt-4 rounded-sm border border-border-subtle bg-surface-subtle p-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Trazabilidad técnica
        </summary>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <DetailValue label="Identificador del ítem" value={item.id} />
          <DetailValue
            label="Ítem estructurado fuente"
            value={formatNullableDraftText(item.sourceStructuredItemId)}
          />
          {item.technicalSnapshot ? (
            <DetailValue
              label="Clasificación técnica fuente"
              value={
                item.technicalSnapshot.sourceStructuredItemTechnicalClassificationId
              }
            />
          ) : null}
        </dl>
      </details>
    </article>
  );
}
