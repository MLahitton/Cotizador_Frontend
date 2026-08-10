"use client";

import {
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Search,
  SearchX,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { ApiError } from "@/lib/http/api-error";

import {
  INVALID_CANONICAL_CATALOG_RESPONSE_MESSAGE,
  isInvalidCanonicalCatalogResponseError,
} from "../canonical-catalog-api";
import {
  formatCanonicalAliasCategory,
  formatCanonicalAliasMatchPolicy,
  formatCanonicalBoolean,
  formatCanonicalConfidence,
  matchesCanonicalAliasSearch,
  matchesCanonicalFinishSearch,
  matchesCanonicalFrameSearch,
  matchesCanonicalSystemSearch,
  type CanonicalCatalogSectionFilter,
} from "../canonical-catalog-formatters";
import type {
  CanonicalCatalogAlias,
  CanonicalCatalogFinish,
  CanonicalCatalogFrame,
  CanonicalCatalogSystem,
} from "../canonical-catalog-types";
import { useCanonicalCatalog } from "../use-canonical-catalog";

const GENERIC_ERROR_MESSAGE =
  "No fue posible consultar el catálogo técnico.";

const sectionFilters: Array<{
  label: string;
  value: CanonicalCatalogSectionFilter;
}> = [
  { label: "Todos", value: "ALL" },
  { label: "Sistemas", value: "SYSTEMS" },
  { label: "Marcos", value: "FRAMES" },
  { label: "Acabados", value: "FINISHES" },
  { label: "Aliases", value: "ALIASES" },
];

function parseSectionFilter(value: string): CanonicalCatalogSectionFilter {
  if (
    value === "SYSTEMS" ||
    value === "FRAMES" ||
    value === "FINISHES" ||
    value === "ALIASES"
  ) {
    return value;
  }

  return "ALL";
}

function getCanonicalCatalogErrorMessage(error: unknown): string {
  if (isInvalidCanonicalCatalogResponseError(error)) {
    return INVALID_CANONICAL_CATALOG_RESPONSE_MESSAGE;
  }

  if (!(error instanceof ApiError)) {
    return GENERIC_ERROR_MESSAGE;
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 403:
      return "No tienes acceso para consultar el catálogo técnico.";
    case 500:
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}

function FlagBadge({
  enabled,
  enabledLabel,
  disabledLabel,
  tone = "neutral",
}: {
  disabledLabel: string;
  enabled: boolean;
  enabledLabel: string;
  tone?: BadgeProps["tone"];
}) {
  return (
    <Badge tone={enabled ? tone : "neutral"} size="sm" className="w-fit">
      {formatCanonicalBoolean(enabled, enabledLabel, disabledLabel)}
    </Badge>
  );
}

function DefinitionItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words text-sm text-foreground [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Surface className="min-w-0">
      <p className="text-sm font-medium text-foreground-secondary">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </Surface>
  );
}

function EmptyState({
  action,
  body,
  heading,
}: {
  action?: () => void;
  body: string;
  heading: string;
}) {
  return (
    <Surface className="text-center">
      <SearchX
        aria-hidden="true"
        className="mx-auto text-muted"
        size={28}
        strokeWidth={1.5}
      />
      <h2 className="mt-4 text-sm font-semibold text-foreground">{heading}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
        {body}
      </p>
      {action ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={action}
        >
          Limpiar filtros
        </Button>
      ) : null}
    </Surface>
  );
}

function Section({
  children,
  count,
  id,
  title,
}: {
  children: ReactNode;
  count: number;
  id: string;
  title: string;
}) {
  return (
    <section className="min-w-0" aria-labelledby={`${id}-heading`}>
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <h2
          id={`${id}-heading`}
          className="min-w-0 break-words text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <Badge tone="neutral" size="sm" className="shrink-0">
          {count}
        </Badge>
      </div>
      {children}
    </section>
  );
}

function SystemCard({ item }: { item: CanonicalCatalogSystem }) {
  return (
    <Surface className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h3 className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        <code className="mt-1 block break-words text-xs font-semibold text-foreground-secondary [overflow-wrap:anywhere]">
          {item.code}
        </code>
      </div>
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DefinitionItem
          label="Reconocimiento"
          value={
            <FlagBadge
              enabled={item.activeForRecognition}
              enabledLabel="Reconocimiento activo"
              disabledLabel="Sin reconocimiento"
              tone="info"
            />
          }
        />
        <DefinitionItem
          label="Cotizable"
          value={
            <FlagBadge
              enabled={item.priceable}
              enabledLabel="Cotizable"
              disabledLabel="No cotizable"
              tone="success"
            />
          }
        />
        <DefinitionItem
          label="Cotizable a futuro"
          value={
            <FlagBadge
              enabled={item.futurePriceable}
              enabledLabel="Cotizable a futuro"
              disabledLabel="Sin cotización futura"
              tone="info"
            />
          }
        />
        <DefinitionItem
          label="Revisión"
          value={
            <FlagBadge
              enabled={item.requiresReview}
              enabledLabel="Requiere revisión"
              disabledLabel="Sin revisión pendiente"
              tone="warning"
            />
          }
        />
        <DefinitionItem
          label="Estado"
          value={
            <FlagBadge
              enabled={item.isActive}
              enabledLabel="Activo"
              disabledLabel="Inactivo"
              tone="success"
            />
          }
        />
      </dl>
    </Surface>
  );
}

function FrameCard({ item }: { item: CanonicalCatalogFrame }) {
  return (
    <Surface className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h3 className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        <code className="mt-1 block break-words text-xs font-semibold text-foreground-secondary [overflow-wrap:anywhere]">
          {item.code}
        </code>
      </div>
      <dl>
        <DefinitionItem
          label="Estado"
          value={
            <FlagBadge
              enabled={item.isActive}
              enabledLabel="Activo"
              disabledLabel="Inactivo"
              tone="success"
            />
          }
        />
      </dl>
    </Surface>
  );
}

function FinishCard({ item }: { item: CanonicalCatalogFinish }) {
  return (
    <Surface className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h3 className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        <code className="mt-1 block break-words text-xs font-semibold text-foreground-secondary [overflow-wrap:anywhere]">
          {item.code}
        </code>
      </div>
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
        <DefinitionItem
          label="Revisión"
          value={
            <FlagBadge
              enabled={item.requiresReview}
              enabledLabel="Requiere revisión"
              disabledLabel="Sin revisión pendiente"
              tone="warning"
            />
          }
        />
        <DefinitionItem
          label="Estado"
          value={
            <FlagBadge
              enabled={item.isActive}
              enabledLabel="Activo"
              disabledLabel="Inactivo"
              tone="success"
            />
          }
        />
      </dl>
    </Surface>
  );
}

function AliasCard({ item }: { item: CanonicalCatalogAlias }) {
  return (
    <Surface className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
            {item.alias}
          </h3>
          <p className="mt-1 break-words text-xs text-foreground-secondary [overflow-wrap:anywhere]">
            Normalizado: {item.normalizedAlias}
          </p>
        </div>
        <Badge tone="brand" size="sm" className="w-fit shrink-0">
          {formatCanonicalAliasCategory(item.category)}
        </Badge>
      </div>
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DefinitionItem
          label="Código canónico"
          value={
            <code className="break-words font-semibold [overflow-wrap:anywhere]">
              {item.canonicalCode}
            </code>
          }
        />
        <DefinitionItem
          label="Política"
          value={formatCanonicalAliasMatchPolicy(item.matchPolicy)}
        />
        <DefinitionItem
          label="Contexto"
          value={
            <FlagBadge
              enabled={item.requiresContext}
              enabledLabel="Requiere contexto"
              disabledLabel="Sin contexto adicional"
              tone="info"
            />
          }
        />
        <DefinitionItem
          label="Confianza (0-1)"
          value={formatCanonicalConfidence(item.confidence)}
        />
        <DefinitionItem
          label="Estado"
          value={
            <FlagBadge
              enabled={item.isActive}
              enabledLabel="Activo"
              disabledLabel="Inactivo"
              tone="success"
            />
          }
        />
      </dl>
    </Surface>
  );
}

function aliasKey(item: CanonicalCatalogAlias): string {
  return [
    item.category,
    item.normalizedAlias,
    item.canonicalCode,
    item.matchPolicy,
    item.alias,
  ].join("|");
}

export function CanonicalCatalogPageContent() {
  const { data, error, isLoading, isRefreshing, refresh } =
    useCanonicalCatalog();
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] =
    useState<CanonicalCatalogSectionFilter>("ALL");

  const visibleSystems = useMemo(
    () =>
      sectionFilter === "ALL" || sectionFilter === "SYSTEMS"
        ? data.systems.filter((item) =>
            matchesCanonicalSystemSearch(item, search),
          )
        : [],
    [data.systems, search, sectionFilter],
  );

  const visibleFrames = useMemo(
    () =>
      sectionFilter === "ALL" || sectionFilter === "FRAMES"
        ? data.frames.filter((item) =>
            matchesCanonicalFrameSearch(item, search),
          )
        : [],
    [data.frames, search, sectionFilter],
  );

  const visibleFinishes = useMemo(
    () =>
      sectionFilter === "ALL" || sectionFilter === "FINISHES"
        ? data.finishes.filter((item) =>
            matchesCanonicalFinishSearch(item, search),
          )
        : [],
    [data.finishes, search, sectionFilter],
  );

  const visibleAliases = useMemo(
    () =>
      sectionFilter === "ALL" || sectionFilter === "ALIASES"
        ? data.aliases.filter((item) =>
            matchesCanonicalAliasSearch(item, search),
          )
        : [],
    [data.aliases, search, sectionFilter],
  );

  const totalItems =
    data.systems.length +
    data.frames.length +
    data.finishes.length +
    data.aliases.length;
  const visibleItems =
    visibleSystems.length +
    visibleFrames.length +
    visibleFinishes.length +
    visibleAliases.length;
  const hasFilters = search.trim().length > 0 || sectionFilter !== "ALL";
  const showEmptyCatalog = !isLoading && !error && totalItems === 0;
  const showNoResults =
    !isLoading && !error && totalItems > 0 && visibleItems === 0;
  const showCatalog =
    !isLoading && !error && totalItems > 0 && visibleItems > 0;

  const clearFilters = () => {
    setSearch("");
    setSectionFilter("ALL");
  };

  return (
    <div className="min-w-0 space-y-6" aria-busy={isLoading || isRefreshing}>
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone="brand">Catálogo</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Catálogo técnico
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Consulta los sistemas, marcos, acabados y aliases utilizados para
            normalización y clasificación técnica.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit shrink-0">
          Solo lectura
        </Badge>
      </header>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Sistemas" value={data.systems.length} />
        <SummaryCard label="Marcos" value={data.frames.length} />
        <SummaryCard label="Acabados" value={data.finishes.length} />
        <SummaryCard label="Aliases" value={data.aliases.length} />
      </div>

      <Surface padding="none">
        <div className="grid min-w-0 gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_auto] lg:items-end">
          <div className="min-w-0">
            <label
              htmlFor="canonical-catalog-search"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Buscar
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={17}
                strokeWidth={1.75}
              />
              <Input
                id="canonical-catalog-search"
                name="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Código, nombre, alias o código canónico"
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="canonical-catalog-section"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Sección
            </label>
            <Select
              id="canonical-catalog-section"
              value={sectionFilter}
              onChange={(event) =>
                setSectionFilter(parseSectionFilter(event.target.value))
              }
            >
              {sectionFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full lg:w-auto"
            onClick={refresh}
            disabled={isLoading || isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshCw aria-hidden="true" size={17} strokeWidth={1.75} />
            {isRefreshing ? "Actualizando" : "Actualizar"}
          </Button>
        </div>
      </Surface>

      <div className="flex min-w-0 flex-col gap-2 text-sm text-foreground-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalItems} registros disponibles · {visibleItems} resultados
          visibles
        </p>
        {isRefreshing ? (
          <p role="status" aria-live="polite">
            Actualizando catálogo técnico...
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <Surface>
          <div
            className="flex items-center gap-3 text-sm text-foreground-secondary"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
            <p>Cargando catálogo técnico...</p>
          </div>
        </Surface>
      ) : null}

      {!isLoading && error ? (
        <Surface>
          <div role="alert" className="flex items-start gap-3">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-danger"
              size={20}
              strokeWidth={1.75}
            />
            <div>
              <h2 className="font-semibold text-foreground">
                No fue posible consultar el catálogo
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                {getCanonicalCatalogErrorMessage(error)}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={refresh}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </Surface>
      ) : null}

      {showEmptyCatalog ? (
        <EmptyState
          heading="No hay información técnica disponible en el catálogo."
          body="El catálogo canónico no contiene sistemas, marcos, acabados ni aliases activos."
        />
      ) : null}

      {showNoResults ? (
        <EmptyState
          heading="No se encontraron resultados para los filtros actuales."
          body="Ajusta la búsqueda o selecciona otra sección del catálogo."
          action={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {showCatalog ? (
        <div className="min-w-0 space-y-8">
          {visibleSystems.length > 0 ? (
            <Section id="canonical-systems" title="Sistemas" count={visibleSystems.length}>
              <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                {visibleSystems.map((item) => (
                  <SystemCard key={item.code} item={item} />
                ))}
              </div>
            </Section>
          ) : null}

          {visibleFrames.length > 0 ? (
            <Section id="canonical-frames" title="Marcos" count={visibleFrames.length}>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFrames.map((item) => (
                  <FrameCard key={item.code} item={item} />
                ))}
              </div>
            </Section>
          ) : null}

          {visibleFinishes.length > 0 ? (
            <Section
              id="canonical-finishes"
              title="Acabados"
              count={visibleFinishes.length}
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFinishes.map((item) => (
                  <FinishCard key={item.code} item={item} />
                ))}
              </div>
            </Section>
          ) : null}

          {visibleAliases.length > 0 ? (
            <Section id="canonical-aliases" title="Aliases" count={visibleAliases.length}>
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {visibleAliases.map((item) => (
                  <AliasCard key={aliasKey(item)} item={item} />
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
