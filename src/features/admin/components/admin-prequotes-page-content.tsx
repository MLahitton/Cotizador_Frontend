"use client";

import {
  ArrowLeft,
  FileText,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchableCatalogCombobox,
  type SearchableCatalogOption,
} from "@/components/ui/searchable-catalog-combobox";
import { Surface } from "@/components/ui/surface";
import { getAdminPreQuotes, getAdminUsers } from "@/features/admin/admin-api";
import type {
  AdminPreQuotesPage,
  AdminUserListItem,
} from "@/features/admin/admin-types";

import {
  AdminPagination,
  adminUserFullName,
  dateEndUtc,
  dateStartUtc,
  formatAdminDate,
} from "./admin-common";

const PREQUOTES_PAGE_SIZE = 10;
const USER_FILTER_OPTIONS_PAGE_SIZE = 50;

interface PreQuoteFilters {
  search: string;
  userId: string;
  fromDate: string;
  toDate: string;
}

function getQueryUserId(searchParams: URLSearchParams): string {
  return searchParams.get("userId")?.trim() ?? "";
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPeriodDates(
  searchParams: URLSearchParams,
): Pick<PreQuoteFilters, "fromDate" | "toDate"> {
  const period = searchParams.get("period");
  const now = new Date();

  if (period === "today") {
    const today = toDateInputValue(now);

    return {
      fromDate: today,
      toDate: today,
    };
  }

  if (period === "7d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);

    return {
      fromDate: toDateInputValue(start),
      toDate: toDateInputValue(now),
    };
  }

  if (period === "30d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);

    return {
      fromDate: toDateInputValue(start),
      toDate: toDateInputValue(now),
    };
  }

  if (period === "month") {
    const firstDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    return {
      fromDate: toDateInputValue(firstDay),
      toDate: toDateInputValue(now),
    };
  }

  return {
    fromDate: "",
    toDate: "",
  };
}

function formatAttemptState(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (normalized === "FAILED") {
    return "Intento: Fallido";
  }

  if (normalized === "REQUIRESREVIEW" || normalized === "REQUIRES_REVIEW") {
    return "Intento: Requiere revision";
  }

  if (normalized === "COMPLETED" || normalized === "SUCCEEDED") {
    return "Intento: Completado";
  }

  if (normalized === "PENDING") {
    return "Intento: Pendiente";
  }

  if (normalized === "RUNNING" || normalized === "PROCESSING") {
    return "Intento: En proceso";
  }

  return "Intento: No disponible";
}

export function AdminPreQuotesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const queryUserId = getQueryUserId(searchParams);
  const queryPeriodDates = getPeriodDates(searchParams);
  const queryPeriod = searchParams.get("period");

  const [preQuotes, setPreQuotes] = useState<AdminPreQuotesPage | null>(null);
  const [userFilterOptions, setUserFilterOptions] = useState<AdminUserListItem[]>([]);
  const [preQuoteFilters, setPreQuoteFilters] =
  useState<PreQuoteFilters>({
    search: "",
    userId: queryUserId,
    fromDate: queryPeriodDates.fromDate,
    toDate: queryPeriodDates.toDate,
  });
  const [debouncedPreQuoteSearch, setDebouncedPreQuoteSearch] = useState("");
  const [preQuotesPage, setPreQuotesPage] = useState(1);
  const [loadingPreQuotes, setLoadingPreQuotes] = useState(true);
  const [loadingUserFilterOptions, setLoadingUserFilterOptions] = useState(true);
  const [preQuotesError, setPreQuotesError] = useState<string | null>(null);
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPreQuoteFilters((current) => {
        if (current.userId === queryUserId) {
          return current;
        }

        return {
          ...current,
          userId: queryUserId,
        };
      });

      setPreQuotesPage(1);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [queryUserId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedPreQuoteSearch(preQuoteFilters.search.trim());
      setPreQuotesPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [preQuoteFilters.search]);

  const loadUserFilterOptions = useCallback(async () => {
    setLoadingUserFilterOptions(true);
    setFilterOptionsError(null);

    try {
      const collected: AdminUserListItem[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await getAdminUsers({
          status: "all",
          page,
          pageSize: USER_FILTER_OPTIONS_PAGE_SIZE,
        });

        collected.push(...response.items);
        totalPages = response.totalPages;
        page += 1;
      } while (page <= totalPages);

      setUserFilterOptions(collected);
    } catch {
      setUserFilterOptions([]);
      setFilterOptionsError("No fue posible cargar la lista de usuarios para el filtro.");
    } finally {
      setLoadingUserFilterOptions(false);
    }
  }, []);

  const loadPreQuotes = useCallback(async () => {
    setLoadingPreQuotes(true);
    setPreQuotesError(null);

    try {
      const response = await getAdminPreQuotes({
        search: debouncedPreQuoteSearch || undefined,
        userId: preQuoteFilters.userId || undefined,
        fromUtc: dateStartUtc(preQuoteFilters.fromDate),
        toUtc: dateEndUtc(preQuoteFilters.toDate),
        page: preQuotesPage,
        pageSize: PREQUOTES_PAGE_SIZE,
      });

      setPreQuotes(response);
    } catch {
      setPreQuotesError("No fue posible cargar las precotizaciones.");
    } finally {
      setLoadingPreQuotes(false);
    }
  }, [
    debouncedPreQuoteSearch,
    preQuoteFilters.userId,
    preQuoteFilters.fromDate,
    preQuoteFilters.toDate,
    preQuotesPage,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUserFilterOptions();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadUserFilterOptions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPreQuotes();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadPreQuotes]);

  const userComboboxOptions = useMemo<SearchableCatalogOption[]>(
    () =>
      userFilterOptions.map((user) => {
        const name = adminUserFullName(user);

        return {
          id: user.id,
          title: name || user.email,
          subtitle: name ? user.email : null,
          searchText: [user.firstName, user.lastName, user.email]
            .filter(Boolean)
            .join(" "),
        };
      }),
    [userFilterOptions],
  );

  function updateUserIdFilter(value: string) {
    setPreQuotesPage(1);
    setPreQuoteFilters((current) => ({
      ...current,
      userId: value,
    }));

    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set("userId", value);
    } else {
      nextParams.delete("userId");
    }

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function updatePeriodFilter(
  period: "today" | "7d" | "30d" | "month" | null,
) {
  const nextParams = new URLSearchParams(
    searchParams.toString(),
  );

  if (period) {
    nextParams.set("period", period);
  } else {
    nextParams.delete("period");
  }

  const periodParams = new URLSearchParams(
    nextParams.toString(),
  );

  const dates = getPeriodDates(periodParams);

  setPreQuotesPage(1);

  setPreQuoteFilters((current) => ({
    ...current,
    fromDate: dates.fromDate,
    toDate: dates.toDate,
  }));

  const query = nextParams.toString();

  router.replace(
    query ? `${pathname}?${query}` : pathname,
  );
}

  function clearPreQuoteFilters() {
    setPreQuoteFilters({
      search: "",
      userId: "",
      fromDate: "",
      toDate: "",
    });
    setDebouncedPreQuoteSearch("");
    setPreQuotesPage(1);
    router.replace(pathname);
  }

  async function refreshAll() {
    await Promise.all([loadUserFilterOptions(), loadPreQuotes()]);
  }

  const loadingAnything = loadingPreQuotes || loadingUserFilterOptions;

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {returnTo ? (
            <Link
              href={returnTo}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground-secondary hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Volver a usuarios
            </Link>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Administracion
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Precotizaciones
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Consulta precotizaciones de todos los usuarios y abre su detalle en modo de solo lectura.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loadingAnything}
          onClick={() => void refreshAll()}
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={loadingAnything ? "animate-spin" : undefined}
          />
          Actualizar
        </Button>
      </header>

      <Surface padding="none" className="overflow-visible">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-brand-soft p-3 text-brand">
              <FileText aria-hidden="true" size={20} strokeWidth={1.75} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Precotizaciones registradas
              </h2>

              <p className="mt-1 text-sm text-foreground-secondary">
                Los filtros se aplican automaticamente.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={
                queryPeriod === "today"
                  ? "primary"
                  : "outline"
              }
              onClick={() => updatePeriodFilter("today")}
            >
              Hoy
            </Button>

            <Button
              type="button"
              size="sm"
              variant={
                queryPeriod === "7d"
                  ? "primary"
                  : "outline"
              }
              onClick={() => updatePeriodFilter("7d")}
            >
              Últimos 7 días
            </Button>

            <Button
              type="button"
              size="sm"
              variant={
                queryPeriod === "30d"
                  ? "primary"
                  : "outline"
              }
              onClick={() => updatePeriodFilter("30d")}
            >
              Últimos 30 días
            </Button>

            <Button
              type="button"
              size="sm"
              variant={
                queryPeriod === "month"
                  ? "primary"
                  : "outline"
              }
              onClick={() => updatePeriodFilter("month")}
            >
              Este mes
            </Button>

            <Button
              type="button"
              size="sm"
              variant={
                !queryPeriod
                  ? "primary"
                  : "outline"
              }
              onClick={() => updatePeriodFilter(null)}
            >
              Todas
            </Button>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_160px_160px_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Buscar
              </span>

              <Input
                value={preQuoteFilters.search}
                onChange={(event) => {
                  setPreQuoteFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }));
                }}
                placeholder="Serial, nombre o proyecto"
              />
            </label>

            <div className="min-w-0">
              <SearchableCatalogCombobox
                label="Usuario"
                value={preQuoteFilters.userId}
                options={userComboboxOptions}
                loading={loadingUserFilterOptions}
                allowEmpty
                placeholder="Todos los usuarios"
                searchPlaceholder="Buscar por nombre o correo..."
                emptyMessage="No se encontraron usuarios."
                onChange={updateUserIdFilter}
              />
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Desde
              </span>

              <Input
                type="date"
                value={preQuoteFilters.fromDate}
                onChange={(event) => {
                  setPreQuotesPage(1);

                  setPreQuoteFilters((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }));

                  const nextParams = new URLSearchParams(
                    searchParams.toString(),
                  );

                  nextParams.delete("period");

                  const query = nextParams.toString();

                  router.replace(
                    query ? `${pathname}?${query}` : pathname,
                  );
                }}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Hasta
              </span>

              <Input
                type="date"
                value={preQuoteFilters.toDate}
                onChange={(event) => {
                  setPreQuotesPage(1);

                  setPreQuoteFilters((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }));

                  const nextParams = new URLSearchParams(
                    searchParams.toString(),
                  );

                  nextParams.delete("period");

                  const query = nextParams.toString();

                  router.replace(
                    query ? `${pathname}?${query}` : pathname,
                  );
                }}
              />
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                disabled={loadingPreQuotes}
                onClick={clearPreQuoteFilters}
              >
                <X aria-hidden="true" size={15} />
                Limpiar filtros
              </Button>
            </div>
          </div>

          {filterOptionsError ? (
            <p className="mt-3 text-xs text-warning">{filterOptionsError}</p>
          ) : null}
        </div>

        {preQuotesError ? (
          <div className="p-5">
            <p className="text-sm text-danger">{preQuotesError}</p>
          </div>
        ) : null}

        {loadingPreQuotes && !preQuotes ? (
          <div className="p-5">
            <p className="text-sm text-foreground-secondary">Cargando precotizaciones...</p>
          </div>
        ) : null}

        {preQuotes ? (
          <>
            <div className={loadingPreQuotes ? "overflow-x-auto opacity-60" : "overflow-x-auto"}>
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  <tr>
                    <th className="px-5 py-3">Precotizacion</th>
                    <th className="px-5 py-3">Proyecto</th>
                    <th className="px-5 py-3">Creada por</th>
                    <th className="px-5 py-3">Requirement</th>
                    <th className="px-5 py-3">Propuesta tecnica</th>
                    <th className="px-5 py-3">Actualizacion</th>
                    <th className="px-5 py-3">Accion</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {preQuotes.items.map((preQuote) => (
                    <tr key={preQuote.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{preQuote.serial}</p>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {preQuote.name || "Sin nombre"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{preQuote.project.name}</p>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {preQuote.project.code}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {[preQuote.createdBy.firstName, preQuote.createdBy.lastName]
                            .filter(Boolean)
                            .join(" ") || "Sin nombre"}
                        </p>
                        <p className="mt-1 text-xs text-foreground-secondary">
                          {preQuote.createdBy.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {preQuote.hasRequirement ? (
                          <>
                            <p className="font-medium text-foreground">
                              {preQuote.latestRequirementStatus || "Disponible"}
                            </p>
                            {preQuote.latestAttemptState ? (
                              <p className="mt-1 text-xs text-foreground-secondary">
                                {formatAttemptState(preQuote.latestAttemptState)}
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-foreground-secondary">Sin Requirement</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {preQuote.hasTechnicalProposal ? (
                          <>
                            <p className="font-medium text-foreground">Disponible</p>
                            <p className="mt-1 text-xs text-foreground-secondary">
                              {preQuote.technicalProposalItemCount}{" "}
                              {preQuote.technicalProposalItemCount === 1 ? "item" : "items"}
                            </p>
                          </>
                        ) : (
                          <span className="text-foreground-secondary">Sin propuesta</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-foreground-secondary">
                        {formatAdminDate(preQuote.updatedAtUtc)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/${encodeURIComponent(
                            preQuote.projectId,
                          )}/prequotes/${encodeURIComponent(
                            preQuote.id,
                          )}?adminView=1&returnTo=${encodeURIComponent(
                            "/admin/prequotes",
                          )}`}
                          className="inline-flex items-center justify-center rounded-sm border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preQuotes.items.length === 0 ? (
              <div className="border-t border-border p-5 text-sm text-foreground-secondary">
                No se encontraron precotizaciones con esos filtros.
              </div>
            ) : null}

            <AdminPagination
              page={preQuotes.page}
              totalPages={preQuotes.totalPages}
              totalCount={preQuotes.totalCount}
              disabled={loadingPreQuotes}
              onPageChange={setPreQuotesPage}
            />
          </>
        ) : null}
      </Surface>
    </div>
  );
}