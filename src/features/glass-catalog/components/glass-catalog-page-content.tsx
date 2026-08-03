"use client";

import { CircleAlert, Layers3, LoaderCircle, RefreshCw, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { ApiError } from "@/lib/http/api-error";

import {
  INVALID_GLASS_CATALOG_RESPONSE_MESSAGE,
  isInvalidGlassCatalogResponseError,
} from "../glass-catalog-api";
import {
  formatGlassCurrency,
  formatGlassPriceRange,
  formatGlassPriceRangeStatus,
  formatGlassPriceRangeVersion,
  formatGlassValidity,
  getGlassPriceRangeStatusTone,
  matchesGlassCatalogSearch,
  type GlassCatalogStatusFilter,
} from "../glass-catalog-formatters";
import type {
  GlassCatalogItem,
  GlassPriceRangeStatus,
} from "../glass-catalog-types";
import { useGlassCatalog } from "../use-glass-catalog";

const GENERIC_ERROR_MESSAGE = "No fue posible consultar el catálogo de vidrios.";

const statusFilters: Array<{
  label: string;
  value: GlassCatalogStatusFilter;
}> = [
  { label: "Todos", value: "ALL" },
  { label: "Preliminar", value: "PRELIMINARY" },
  { label: "Activo", value: "ACTIVE" },
  { label: "Retirado", value: "RETIRED" },
];

function parseStatusFilter(value: string): GlassCatalogStatusFilter {
  if (
    value === "PRELIMINARY" ||
    value === "ACTIVE" ||
    value === "RETIRED"
  ) {
    return value;
  }

  return "ALL";
}

function getGlassCatalogErrorMessage(error: unknown): string {
  if (isInvalidGlassCatalogResponseError(error)) {
    return INVALID_GLASS_CATALOG_RESPONSE_MESSAGE;
  }

  if (!(error instanceof ApiError)) {
    return GENERIC_ERROR_MESSAGE;
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.";
    case 403:
      return "No tienes acceso para consultar el catálogo de vidrios.";
    case 500:
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}

function GlassRangeStatusBadge({
  status,
}: {
  status: GlassPriceRangeStatus;
}) {
  return (
    <Badge tone={getGlassPriceRangeStatusTone(status)} size="sm">
      {formatGlassPriceRangeStatus(status)}
    </Badge>
  );
}

function GlassEmptyState({
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

function GlassCatalogTable({ items }: { items: GlassCatalogItem[] }) {
  return (
    <Surface padding="none" className="hidden min-w-0 overflow-hidden lg:block">
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">
          Catálogo de tipos de vidrio y rangos de precio actuales
        </caption>
        <thead className="bg-surface-subtle">
          <tr>
            {[
              "Vidrio",
              "Código",
              "Rango por m²",
              "Moneda",
              "Estado del rango",
              "Versión",
              "Vigencia",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="border-b border-border-subtle px-4 py-3 text-xs font-semibold text-foreground-secondary"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {items.map((item) => (
            <tr key={`${item.code}-${item.currentPriceRange.version}`} className="bg-surface">
              <td className="px-4 py-4 align-top">
                <p className="break-words font-semibold text-foreground">
                  {item.name}
                </p>
                {item.description ? (
                  <p className="mt-1 break-words text-sm leading-6 text-foreground-secondary">
                    {item.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Sin descripción</p>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <span className="block break-words text-sm font-semibold text-foreground-secondary">
                  {item.code}
                </span>
              </td>
              <td className="px-4 py-4 align-top text-sm font-medium text-foreground">
                <span className="block break-words">
                  {formatGlassPriceRange(item.currentPriceRange)}
                </span>
              </td>
              <td className="px-4 py-4 align-top text-sm text-foreground-secondary">
                {formatGlassCurrency(item.currentPriceRange.currency)}
              </td>
              <td className="px-4 py-4 align-top">
                <GlassRangeStatusBadge status={item.currentPriceRange.status} />
              </td>
              <td className="px-4 py-4 align-top text-sm text-foreground-secondary">
                {formatGlassPriceRangeVersion(item.currentPriceRange.version)}
              </td>
              <td className="px-4 py-4 align-top text-sm leading-6 text-foreground-secondary">
                {formatGlassValidity(item.currentPriceRange)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}

function GlassCatalogMobileList({ items }: { items: GlassCatalogItem[] }) {
  return (
    <ul className="space-y-3 lg:hidden" aria-label="Catálogo de vidrios">
      {items.map((item) => (
        <li key={`${item.code}-${item.currentPriceRange.version}`}>
          <Surface className="space-y-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-foreground">
                  {item.name}
                </p>
                <p className="mt-1 break-words text-xs font-semibold uppercase text-foreground-secondary">
                  {item.code}
                </p>
              </div>
              <GlassRangeStatusBadge status={item.currentPriceRange.status} />
            </div>
            {item.description ? (
              <p className="break-words text-sm leading-6 text-foreground-secondary">
                {item.description}
              </p>
            ) : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-foreground-secondary">
                  Rango por m²
                </dt>
                <dd className="mt-1 break-words font-medium text-foreground">
                  {formatGlassPriceRange(item.currentPriceRange)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground-secondary">
                  Moneda
                </dt>
                <dd className="mt-1 text-foreground">
                  {formatGlassCurrency(item.currentPriceRange.currency)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground-secondary">
                  Versión
                </dt>
                <dd className="mt-1 text-foreground">
                  {formatGlassPriceRangeVersion(item.currentPriceRange.version)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground-secondary">
                  Vigencia
                </dt>
                <dd className="mt-1 break-words leading-6 text-foreground">
                  {formatGlassValidity(item.currentPriceRange)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground-secondary">
                  Estado del rango
                </dt>
                <dd className="mt-1 text-foreground">
                  {formatGlassPriceRangeStatus(item.currentPriceRange.status)}
                </dd>
              </div>
            </dl>
          </Surface>
        </li>
      ))}
    </ul>
  );
}

export function GlassCatalogPageContent() {
  const { error, isLoading, isRefreshing, items, refresh } = useGlassCatalog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<GlassCatalogStatusFilter>("ALL");

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (statusFilter === "ALL" ||
            item.currentPriceRange.status === statusFilter) &&
          matchesGlassCatalogSearch(item, search),
      ),
    [items, search, statusFilter],
  );

  const hasFilters = search.trim().length > 0 || statusFilter !== "ALL";
  const showEmptyCatalog = !isLoading && !error && items.length === 0;
  const showNoResults =
    !isLoading && !error && items.length > 0 && visibleItems.length === 0;
  const showCatalog =
    !isLoading && !error && items.length > 0 && visibleItems.length > 0;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  return (
    <div className="min-w-0 space-y-6" aria-busy={isLoading || isRefreshing}>
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone="brand">Catálogo</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Catálogo de vidrios
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Consulta los tipos de vidrio disponibles y sus rangos de precio
            actuales.
          </p>
        </div>
        <Badge tone="neutral" className="w-fit shrink-0">
          Solo lectura
        </Badge>
      </header>

      <Surface padding="none">
        <div className="grid min-w-0 gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_auto] lg:items-end">
          <div className="min-w-0">
            <label
              htmlFor="glass-catalog-search"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Buscar vidrio
            </label>
            <div className="relative">
              <Layers3
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={17}
                strokeWidth={1.75}
              />
              <Input
                id="glass-catalog-search"
                name="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por código, nombre o descripción"
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="glass-catalog-status"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Estado del rango
            </label>
            <Select
              id="glass-catalog-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(parseStatusFilter(event.target.value))
              }
            >
              {statusFilters.map((option) => (
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
          {items.length} tipos disponibles · {visibleItems.length} resultados
          visibles
        </p>
        {isRefreshing ? (
          <p role="status" aria-live="polite">
            Actualizando catálogo...
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
            <p>Cargando catálogo de vidrios...</p>
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
                {getGlassCatalogErrorMessage(error)}
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
        <GlassEmptyState
          heading="No hay tipos de vidrio disponibles."
          body="El catálogo no contiene tipos de vidrio activos con un rango de precio actual."
        />
      ) : null}

      {showNoResults ? (
        <GlassEmptyState
          heading="No encontramos coincidencias."
          body="Ajusta la búsqueda o selecciona otro estado del rango."
          action={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {showCatalog ? (
        <section aria-labelledby="glass-catalog-results-heading">
          <h2 id="glass-catalog-results-heading" className="sr-only">
            Tipos de vidrio disponibles
          </h2>
          <GlassCatalogTable items={visibleItems} />
          <GlassCatalogMobileList items={visibleItems} />
        </section>
      ) : null}
    </div>
  );
}
