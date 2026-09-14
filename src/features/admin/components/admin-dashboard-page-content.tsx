"use client";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchableCatalogCombobox,
  type SearchableCatalogOption,
} from "@/components/ui/searchable-catalog-combobox";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  getAdminDashboard,
  getAdminPreQuotes,
  getAdminUsers,
} from "@/features/admin/admin-api";
import type {
  AdminDashboard,
  AdminPreQuotesPage,
  AdminUserListItem,
  AdminUserRole,
  AdminUsersPage,
} from "@/features/admin/admin-types";

const USERS_PAGE_SIZE = 10;
const PREQUOTES_PAGE_SIZE = 10;

/*
 * Tamaño usado únicamente para construir el catálogo
 * de usuarios del filtro de precotizaciones.
 *
 * Se recorren todas las páginas, por lo que el selector
 * no queda limitado a esta cantidad.
 */
const USER_FILTER_OPTIONS_PAGE_SIZE = 50;

type UserStatusFilter =
  | "all"
  | "active"
  | "inactive";

type UserRoleFilter =
  | "ALL"
  | AdminUserRole;

interface UserFilters {
  search: string;
  status: UserStatusFilter;
  role: UserRoleFilter;
}

interface PreQuoteFilters {
  search: string;
  userId: string;
  fromDate: string;
  toDate: string;
}

const initialUserFilters: UserFilters = {
  search: "",
  status: "all",
  role: "ALL",
};

const initialPreQuoteFilters: PreQuoteFilters = {
  search: "",
  userId: "",
  fromDate: "",
  toDate: "",
};

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Nunca";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function fullName(
  user: Pick<
    AdminUserListItem,
    "firstName" | "lastName"
  >,
): string {
  return [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function dateStartUtc(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return `${value}T00:00:00.000Z`;
}

function dateEndUtc(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return `${value}T23:59:59.999Z`;
}

function MetricCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <Surface className="min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground-secondary">
            {title}
          </p>

          <p className="mt-2 text-3xl font-semibold text-foreground">
            {value}
          </p>

          <p className="mt-2 text-xs text-foreground-secondary">
            {detail}
          </p>
        </div>

        <div className="rounded-md bg-brand-soft p-3 text-brand">
          <Icon
            aria-hidden="true"
            size={22}
            strokeWidth={1.75}
          />
        </div>
      </div>
    </Surface>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface-subtle p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (
    page: number,
  ) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) {
    return (
      <div className="border-t border-border px-4 py-3 text-xs text-foreground-secondary sm:px-5">
        {totalCount}{" "}
        {totalCount === 1
          ? "resultado"
          : "resultados"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-foreground-secondary">
        Página {page} de {totalPages} ·{" "}
        {totalCount} resultados
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            disabled ||
            page <= 1
          }
          onClick={() =>
            onPageChange(page - 1)
          }
        >
          <ChevronLeft
            aria-hidden="true"
            size={15}
          />
          Anterior
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            disabled ||
            page >= totalPages
          }
          onClick={() =>
            onPageChange(page + 1)
          }
        >
          Siguiente
          <ChevronRight
            aria-hidden="true"
            size={15}
          />
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboardPageContent() {
  const [
    dashboard,
    setDashboard,
  ] = useState<AdminDashboard | null>(
    null,
  );

  const [
    users,
    setUsers,
  ] = useState<AdminUsersPage | null>(
    null,
  );

  const [
    preQuotes,
    setPreQuotes,
  ] = useState<AdminPreQuotesPage | null>(
    null,
  );

  const [
    userFilterOptions,
    setUserFilterOptions,
  ] = useState<AdminUserListItem[]>([]);

  const [
    userFilters,
    setUserFilters,
  ] = useState<UserFilters>(
    initialUserFilters,
  );

  const [
    preQuoteFilters,
    setPreQuoteFilters,
  ] = useState<PreQuoteFilters>(
    initialPreQuoteFilters,
  );

  const [
    debouncedUserSearch,
    setDebouncedUserSearch,
  ] = useState("");

  const [
    debouncedPreQuoteSearch,
    setDebouncedPreQuoteSearch,
  ] = useState("");

  const [
    usersPage,
    setUsersPage,
  ] = useState(1);

  const [
    preQuotesPage,
    setPreQuotesPage,
  ] = useState(1);

  const [
    loadingDashboard,
    setLoadingDashboard,
  ] = useState(true);

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(true);

  const [
    loadingPreQuotes,
    setLoadingPreQuotes,
  ] = useState(true);

  const [
    loadingUserFilterOptions,
    setLoadingUserFilterOptions,
  ] = useState(true);

  const [
    dashboardError,
    setDashboardError,
  ] = useState<string | null>(
    null,
  );

  const [
    usersError,
    setUsersError,
  ] = useState<string | null>(
    null,
  );

  const [
    preQuotesError,
    setPreQuotesError,
  ] = useState<string | null>(
    null,
  );

  const [
    filterOptionsError,
    setFilterOptionsError,
  ] = useState<string | null>(
    null,
  );

  /*
   * Búsqueda automática de usuarios.
   * Espera 300 ms desde la última tecla antes
   * de consultar nuevamente el backend.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        setDebouncedUserSearch(
          userFilters.search.trim(),
        );

        setUsersPage(1);
      }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [userFilters.search]);

  /*
   * Búsqueda automática de precotizaciones.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        setDebouncedPreQuoteSearch(
          preQuoteFilters.search.trim(),
        );

        setPreQuotesPage(1);
      }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [preQuoteFilters.search]);

  const loadDashboard =
    useCallback(async () => {
      setLoadingDashboard(true);
      setDashboardError(null);

      try {
        const response =
          await getAdminDashboard();

        setDashboard(response);
      } catch {
        setDashboardError(
          "No fue posible cargar los indicadores administrativos.",
        );
      } finally {
        setLoadingDashboard(false);
      }
    }, []);

  /*
   * Carga todos los usuarios disponibles para
   * alimentar el combobox de precotizaciones.
   *
   * Se pagina en lugar de asumir que todos caben
   * en una sola respuesta.
   */
  const loadUserFilterOptions =
    useCallback(async () => {
      setLoadingUserFilterOptions(true);
      setFilterOptionsError(null);

      try {
        const collected: AdminUserListItem[] =
          [];

        let page = 1;
        let totalPages = 1;

        do {
          const response =
            await getAdminUsers({
              status: "all",
              page,
              pageSize:
                USER_FILTER_OPTIONS_PAGE_SIZE,
            });

          collected.push(
            ...response.items,
          );

          totalPages =
            response.totalPages;

          page += 1;
        } while (
          page <= totalPages
        );

        setUserFilterOptions(
          collected,
        );
      } catch {
        setUserFilterOptions([]);

        setFilterOptionsError(
          "No fue posible cargar la lista de usuarios para el filtro.",
        );
      } finally {
        setLoadingUserFilterOptions(
          false,
        );
      }
    }, []);

  const loadUsers =
    useCallback(async () => {
      setLoadingUsers(true);
      setUsersError(null);

      try {
        const response =
          await getAdminUsers({
            search:
              debouncedUserSearch ||
              undefined,
            status:
              userFilters.status,
            role:
              userFilters.role ===
              "ALL"
                ? undefined
                : userFilters.role,
            page: usersPage,
            pageSize:
              USERS_PAGE_SIZE,
          });

        setUsers(response);
      } catch {
        setUsersError(
          "No fue posible cargar los usuarios.",
        );
      } finally {
        setLoadingUsers(false);
      }
    }, [
      debouncedUserSearch,
      userFilters.status,
      userFilters.role,
      usersPage,
    ]);

  const loadPreQuotes =
    useCallback(async () => {
      setLoadingPreQuotes(true);
      setPreQuotesError(null);

      try {
        const response =
          await getAdminPreQuotes({
            search:
              debouncedPreQuoteSearch ||
              undefined,
            userId:
              preQuoteFilters.userId ||
              undefined,
            fromUtc: dateStartUtc(
              preQuoteFilters.fromDate,
            ),
            toUtc: dateEndUtc(
              preQuoteFilters.toDate,
            ),
            page: preQuotesPage,
            pageSize:
              PREQUOTES_PAGE_SIZE,
          });

        setPreQuotes(response);
      } catch {
        setPreQuotesError(
          "No fue posible cargar las precotizaciones.",
        );
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
    void loadDashboard();
    void loadUserFilterOptions();
  }, [
    loadDashboard,
    loadUserFilterOptions,
  ]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadPreQuotes();
  }, [loadPreQuotes]);

  const userComboboxOptions =
    useMemo<
      SearchableCatalogOption[]
    >(
      () =>
        userFilterOptions.map(
          (user) => {
            const name =
              fullName(user);

            return {
              id: user.id,
              title:
                name ||
                user.email,
              subtitle:
                name
                  ? user.email
                  : null,
              searchText: [
                user.firstName,
                user.lastName,
                user.email,
              ]
                .filter(Boolean)
                .join(" "),
            };
          },
        ),
      [userFilterOptions],
    );

  function clearUserFilters() {
    setUserFilters(
      initialUserFilters,
    );

    setDebouncedUserSearch("");
    setUsersPage(1);
  }

  function clearPreQuoteFilters() {
    setPreQuoteFilters(
      initialPreQuoteFilters,
    );

    setDebouncedPreQuoteSearch("");
    setPreQuotesPage(1);
  }

  async function refreshAll() {
    await Promise.all([
      loadDashboard(),
      loadUserFilterOptions(),
      loadUsers(),
      loadPreQuotes(),
    ]);
  }

  const loadingAnything =
    loadingDashboard ||
    loadingUsers ||
    loadingPreQuotes ||
    loadingUserFilterOptions;

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Administración
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Panel administrativo
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Consulta actividad, usuarios y
            precotizaciones de Steel & Glass.
            Las precotizaciones de otros
            usuarios se abren en modo de solo
            lectura.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loadingAnything}
          onClick={() =>
            void refreshAll()
          }
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={
              loadingAnything
                ? "animate-spin"
                : undefined
            }
          />
          Actualizar
        </Button>
      </header>

      {dashboardError ? (
        <Surface
          variant="subtle"
          className="border-danger/30 bg-danger-soft"
        >
          <p className="text-sm text-danger">
            {dashboardError}
          </p>
        </Surface>
      ) : null}

      {loadingDashboard &&
      !dashboard ? (
        <Surface variant="subtle">
          <p className="text-sm text-foreground-secondary">
            Cargando indicadores...
          </p>
        </Surface>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users}
              title="Usuarios"
              value={
                dashboard.totalUsers
              }
              detail={`${dashboard.activeUsers} cuentas habilitadas`}
            />

            <MetricCard
              icon={Activity}
              title="Actividad"
              value={
                dashboard.usersActiveLast30Days
              }
              detail={`${dashboard.usersActiveToday} activos hoy`}
            />

            <MetricCard
              icon={FileText}
              title="Precotizaciones"
              value={
                dashboard.totalPreQuotes
              }
              detail={`${dashboard.preQuotesThisMonth} creadas este mes`}
            />

            <MetricCard
              icon={FileText}
              title="Actividad comercial"
              value={
                dashboard.preQuotesThisWeek
              }
              detail={`${dashboard.preQuotesToday} precotizaciones hoy`}
            />
          </div>

          <Surface>
            <h2 className="text-sm font-semibold text-foreground">
              Actividad de usuarios
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SmallMetric
                label="Activos hoy"
                value={
                  dashboard.usersActiveToday
                }
              />

              <SmallMetric
                label="Últimos 7 días"
                value={
                  dashboard.usersActiveLast7Days
                }
              />

              <SmallMetric
                label="Últimos 30 días"
                value={
                  dashboard.usersActiveLast30Days
                }
              />
            </div>
          </Surface>
        </>
      ) : null}

      {/* USERS */}
      <Surface
        padding="none"
        className="overflow-hidden"
      >
        <div className="border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Usuarios
            </h2>

            <p className="mt-1 text-sm text-foreground-secondary">
              Busca cuentas y consulta su
              actividad dentro del cotizador.
              Los filtros se aplican
              automáticamente.
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Buscar
              </span>

              <Input
                value={
                  userFilters.search
                }
                onChange={(event) => {
                  setUserFilters(
                    (current) => ({
                      ...current,
                      search:
                        event.target.value,
                    }),
                  );
                }}
                placeholder="Nombre o correo"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Rol
              </span>

              <Select
                value={
                  userFilters.role
                }
                onChange={(event) => {
                  setUsersPage(1);

                  setUserFilters(
                    (current) => ({
                      ...current,
                      role: event.target
                        .value as UserRoleFilter,
                    }),
                  );
                }}
              >
                <option value="ALL">
                  Todos
                </option>

                <option value="USER">
                  USER
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Estado
              </span>

              <Select
                value={
                  userFilters.status
                }
                onChange={(event) => {
                  setUsersPage(1);

                  setUserFilters(
                    (current) => ({
                      ...current,
                      status:
                        event.target
                          .value as UserStatusFilter,
                    }),
                  );
                }}
              >
                <option value="all">
                  Todos
                </option>

                <option value="active">
                  Activos
                </option>

                <option value="inactive">
                  Inactivos
                </option>
              </Select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                disabled={loadingUsers}
                onClick={
                  clearUserFilters
                }
              >
                <X
                  aria-hidden="true"
                  size={15}
                />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>

        {usersError ? (
          <div className="p-5">
            <p className="text-sm text-danger">
              {usersError}
            </p>
          </div>
        ) : null}

        {loadingUsers &&
        !users ? (
          <div className="p-5">
            <p className="text-sm text-foreground-secondary">
              Cargando usuarios...
            </p>
          </div>
        ) : null}

        {users ? (
          <>
            <div
              className={
                loadingUsers
                  ? "overflow-x-auto opacity-60"
                  : "overflow-x-auto"
              }
            >
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  <tr>
                    <th className="px-5 py-3">
                      Usuario
                    </th>

                    <th className="px-5 py-3">
                      Rol
                    </th>

                    <th className="px-5 py-3">
                      Estado
                    </th>

                    <th className="px-5 py-3">
                      Precotizaciones
                    </th>

                    <th className="px-5 py-3">
                      Último acceso
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {users.items.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="align-top"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {fullName(
                              user,
                            ) ||
                              "Sin nombre"}
                          </p>

                          <p className="mt-1 text-xs text-foreground-secondary">
                            {user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-foreground">
                          {user.role}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              user.isActive
                                ? "font-medium text-foreground"
                                : "font-medium text-foreground-secondary"
                            }
                          >
                            {user.isActive
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-medium text-foreground">
                          {
                            user.preQuoteCount
                          }
                        </td>

                        <td className="px-5 py-4 text-foreground-secondary">
                          {formatDate(
                            user.lastLoginAtUtc,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {users.items.length ===
            0 ? (
              <div className="border-t border-border p-5 text-sm text-foreground-secondary">
                No se encontraron usuarios con
                esos filtros.
              </div>
            ) : null}

            <Pagination
              page={users.page}
              totalPages={
                users.totalPages
              }
              totalCount={
                users.totalCount
              }
              disabled={loadingUsers}
              onPageChange={
                setUsersPage
              }
            />
          </>
        ) : null}
      </Surface>

      {/* PREQUOTES */}
      <Surface
        padding="none"
        className="overflow-visible"
      >
        <div className="border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Precotizaciones
            </h2>

            <p className="mt-1 text-sm text-foreground-secondary">
              Consulta el trabajo de los
              usuarios y abre su estado actual
              en modo administrativo. Los
              filtros se aplican
              automáticamente.
            </p>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_160px_160px_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Buscar
              </span>

              <Input
                value={
                  preQuoteFilters.search
                }
                onChange={(event) => {
                  setPreQuoteFilters(
                    (current) => ({
                      ...current,
                      search:
                        event.target.value,
                    }),
                  );
                }}
                placeholder="Serial, nombre o proyecto"
              />
            </label>

            <div className="min-w-0">
              <SearchableCatalogCombobox
                label="Usuario"
                value={
                  preQuoteFilters.userId
                }
                options={
                  userComboboxOptions
                }
                loading={
                  loadingUserFilterOptions
                }
                allowEmpty
                placeholder="Todos los usuarios"
                searchPlaceholder="Buscar por nombre o correo..."
                emptyMessage="No se encontraron usuarios."
                onChange={(value) => {
                  setPreQuotesPage(1);

                  setPreQuoteFilters(
                    (current) => ({
                      ...current,
                      userId: value,
                    }),
                  );
                }}
              />
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Desde
              </span>

              <Input
                type="date"
                value={
                  preQuoteFilters.fromDate
                }
                onChange={(event) => {
                  setPreQuotesPage(1);

                  setPreQuoteFilters(
                    (current) => ({
                      ...current,
                      fromDate:
                        event.target.value,
                    }),
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
                value={
                  preQuoteFilters.toDate
                }
                onChange={(event) => {
                  setPreQuotesPage(1);

                  setPreQuoteFilters(
                    (current) => ({
                      ...current,
                      toDate:
                        event.target.value,
                    }),
                  );
                }}
              />
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                disabled={
                  loadingPreQuotes
                }
                onClick={
                  clearPreQuoteFilters
                }
              >
                <X
                  aria-hidden="true"
                  size={15}
                />
                Limpiar filtros
              </Button>
            </div>
          </div>

          {filterOptionsError ? (
            <p className="mt-3 text-xs text-warning">
              {filterOptionsError}
            </p>
          ) : null}
        </div>

        {preQuotesError ? (
          <div className="p-5">
            <p className="text-sm text-danger">
              {preQuotesError}
            </p>
          </div>
        ) : null}

        {loadingPreQuotes &&
        !preQuotes ? (
          <div className="p-5">
            <p className="text-sm text-foreground-secondary">
              Cargando precotizaciones...
            </p>
          </div>
        ) : null}

        {preQuotes ? (
          <>
            <div
              className={
                loadingPreQuotes
                  ? "overflow-x-auto opacity-60"
                  : "overflow-x-auto"
              }
            >
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  <tr>
                    <th className="px-5 py-3">
                      Precotización
                    </th>

                    <th className="px-5 py-3">
                      Proyecto
                    </th>

                    <th className="px-5 py-3">
                      Creada por
                    </th>

                    <th className="px-5 py-3">
                      Requirement
                    </th>

                    <th className="px-5 py-3">
                      Propuesta técnica
                    </th>

                    <th className="px-5 py-3">
                      Actualización
                    </th>

                    <th className="px-5 py-3">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {preQuotes.items.map(
                    (preQuote) => (
                      <tr
                        key={preQuote.id}
                        className="align-top"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">
                            {
                              preQuote.serial
                            }
                          </p>

                          <p className="mt-1 text-xs text-foreground-secondary">
                            {preQuote.name ||
                              "Sin nombre"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {
                              preQuote
                                .project.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-foreground-secondary">
                            {
                              preQuote
                                .project.code
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {[
                              preQuote
                                .createdBy
                                .firstName,
                              preQuote
                                .createdBy
                                .lastName,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(" ") ||
                              "Sin nombre"}
                          </p>

                          <p className="mt-1 text-xs text-foreground-secondary">
                            {
                              preQuote
                                .createdBy
                                .email
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {preQuote.hasRequirement ? (
                            <>
                              <p className="font-medium text-foreground">
                                {preQuote.latestRequirementStatus ||
                                  "Disponible"}
                              </p>

                              {preQuote.latestAttemptState ? (
                                <p className="mt-1 text-xs text-foreground-secondary">
                                  {
                                    preQuote.latestAttemptState
                                  }
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-foreground-secondary">
                              Sin Requirement
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {preQuote.hasTechnicalProposal ? (
                            <>
                              <p className="font-medium text-foreground">
                                Disponible
                              </p>

                              <p className="mt-1 text-xs text-foreground-secondary">
                                {
                                  preQuote.technicalProposalItemCount
                                }{" "}
                                {preQuote.technicalProposalItemCount ===
                                1
                                  ? "item"
                                  : "items"}
                              </p>
                            </>
                          ) : (
                            <span className="text-foreground-secondary">
                              Sin propuesta
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-foreground-secondary">
                          {formatDate(
                            preQuote.updatedAtUtc,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/projects/${encodeURIComponent(
                              preQuote.projectId,
                            )}/prequotes/${encodeURIComponent(
                              preQuote.id,
                            )}?adminView=1`}
                            className="inline-flex items-center justify-center rounded-sm border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {preQuotes.items.length ===
            0 ? (
              <div className="border-t border-border p-5 text-sm text-foreground-secondary">
                No se encontraron
                precotizaciones con esos
                filtros.
              </div>
            ) : null}

            <Pagination
              page={preQuotes.page}
              totalPages={
                preQuotes.totalPages
              }
              totalCount={
                preQuotes.totalCount
              }
              disabled={
                loadingPreQuotes
              }
              onPageChange={
                setPreQuotesPage
              }
            />
          </>
        ) : null}
      </Surface>
    </div>
  );
}