"use client";

import {
  Activity,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import {
  AdminPagination,
  adminUserFullName,
  formatAdminDate,
} from "@/features/admin/components/admin-common";
import { getAdminUsers } from "@/features/admin/admin-api";
import type {
  AdminUserRole,
  AdminUsersPage,
} from "@/features/admin/admin-types";

const USERS_PAGE_SIZE = 10;

type UserStatusFilter =
  | "all"
  | "active"
  | "inactive";

type UserRoleFilter =
  | "ALL"
  | AdminUserRole;

type ActivityPeriod =
  | "all"
  | "today"
  | "7d"
  | "30d"
  | "inactive";

interface ActivityFilters {
  search: string;
  status: UserStatusFilter;
  role: UserRoleFilter;
  period: ActivityPeriod;
}

function getQueryPeriod(
  searchParams: URLSearchParams,
): ActivityPeriod {
  const period = searchParams.get("period");

  if (
    period === "today" ||
    period === "7d" ||
    period === "30d" ||
    period === "inactive"
  ) {
    return period;
  }

  return "all";
}

function getActivityCutoff(
  period: ActivityPeriod,
): Date | null {
  const now = new Date();

  if (period === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
  }

  if (period === "7d") {
    return new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
  }

  if (period === "30d") {
    return new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
  }

  return null;
}

function matchesActivityPeriod(
  lastLoginAtUtc: string | null,
  period: ActivityPeriod,
): boolean {
  if (period === "all") {
    return true;
  }

  if (period === "inactive") {
    if (!lastLoginAtUtc) {
      return true;
    }

    const lastLogin = new Date(lastLoginAtUtc);

    if (Number.isNaN(lastLogin.getTime())) {
      return true;
    }

    const cutoff = getActivityCutoff("30d");

    return cutoff
      ? lastLogin.getTime() < cutoff.getTime()
      : true;
  }

  if (!lastLoginAtUtc) {
    return false;
  }

  const lastLogin = new Date(lastLoginAtUtc);

  if (Number.isNaN(lastLogin.getTime())) {
    return false;
  }

  const cutoff = getActivityCutoff(period);

  return cutoff
    ? lastLogin.getTime() >= cutoff.getTime()
    : true;
}

function formatRelativeActivity(
  lastLoginAtUtc: string | null,
): string {
  if (!lastLoginAtUtc) {
    return "Nunca";
  }

  const lastLogin = new Date(lastLoginAtUtc);

  if (Number.isNaN(lastLogin.getTime())) {
    return "No disponible";
  }

  const diffMs = Date.now() - lastLogin.getTime();

  if (diffMs < 0) {
    return "Ahora";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return minutes <= 1
      ? "Hace 1 minuto"
      : `Hace ${minutes} minutos`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours === 1
      ? "Hace 1 hora"
      : `Hace ${hours} horas`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return days === 1
      ? "Hace 1 día"
      : `Hace ${days} días`;
  }

  const months = Math.floor(days / 30);

  return months === 1
    ? "Hace 1 mes"
    : `Hace ${months} meses`;
}

export function AdminActivityPageContent() {
  const searchParams = useSearchParams();
  const queryPeriod = getQueryPeriod(searchParams);

  const [users, setUsers] =
    useState<AdminUsersPage | null>(null);

  const [filters, setFilters] =
    useState<ActivityFilters>({
      search: "",
      status: "all",
      role: "ALL",
      period: queryPeriod,
    });

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [filters.search]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      period: queryPeriod,
    }));

    setPage(1);
  }, [queryPeriod]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminUsers({
        search:
          debouncedSearch || undefined,
        status: filters.status,
        role:
          filters.role === "ALL"
            ? undefined
            : filters.role,
        page: 1,
        pageSize: 100,
      });

      setUsers(response);
    } catch {
      setError(
        "No fue posible cargar la actividad de usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.role,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!users) {
      return [];
    }

    return users.items.filter((user) =>
      matchesActivityPeriod(
        user.lastLoginAtUtc,
        filters.period,
      ),
    );
  }, [filters.period, users]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length / USERS_PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    page,
    totalPages,
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PAGE_SIZE,
    currentPage * USERS_PAGE_SIZE,
  );

  const summary = useMemo(() => {
    if (!users) {
      return {
        enabled: 0,
        disabled: 0,
        today: 0,
        last7Days: 0,
        last30Days: 0,
      };
    }

    return {
      enabled: users.items.filter(
        (user) => user.isActive,
      ).length,

      disabled: users.items.filter(
        (user) => !user.isActive,
      ).length,

      today: users.items.filter((user) =>
        matchesActivityPeriod(
          user.lastLoginAtUtc,
          "today",
        ),
      ).length,

      last7Days: users.items.filter((user) =>
        matchesActivityPeriod(
          user.lastLoginAtUtc,
          "7d",
        ),
      ).length,

      last30Days: users.items.filter((user) =>
        matchesActivityPeriod(
          user.lastLoginAtUtc,
          "30d",
        ),
      ).length,
    };
  }, [users]);

  function clearFilters() {
    setFilters({
      search: "",
      status: "all",
      role: "ALL",
      period: "all",
    });

    setDebouncedSearch("");
    setPage(1);
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Administracion
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Actividad de usuarios
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Consulta actividad basada en la última
            conexión registrada. Esta vista todavía
            no representa presencia en tiempo real.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void loadUsers()}
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={
              loading
                ? "animate-spin"
                : undefined
            }
          />
          Actualizar
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Surface>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Activos hoy
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.today}
          </p>
        </Surface>

        <Surface>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Últimos 7 días
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.last7Days}
          </p>
        </Surface>

        <Surface>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Últimos 30 días
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.last30Days}
          </p>
        </Surface>

        <Surface>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Habilitados
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.enabled}
          </p>
        </Surface>

        <Surface>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Deshabilitados
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.disabled}
          </p>
        </Surface>
      </div>

      <Surface padding="none">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-brand-soft p-3 text-brand">
              <Activity
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Historial de actividad
              </h2>

              <p className="mt-1 text-sm text-foreground-secondary">
                Filtra por última conexión, estado y rol.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_180px_200px_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Buscar
              </span>

              <div className="relative">
                <Search
                  aria-hidden="true"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <Input
                  value={filters.search}
                  className="pl-9"
                  placeholder="Nombre o correo"
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }));
                  }}
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Rol
              </span>

              <Select
                value={filters.role}
                onChange={(event) => {
                  setPage(1);

                  setFilters((current) => ({
                    ...current,
                    role:
                      event.target
                        .value as UserRoleFilter,
                  }));
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
                value={filters.status}
                onChange={(event) => {
                  setPage(1);

                  setFilters((current) => ({
                    ...current,
                    status:
                      event.target
                        .value as UserStatusFilter,
                  }));
                }}
              >
                <option value="all">
                  Todos
                </option>
                <option value="active">
                  Habilitados
                </option>
                <option value="inactive">
                  Deshabilitados
                </option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Actividad
              </span>

              <Select
                value={filters.period}
                onChange={(event) => {
                  setPage(1);

                  setFilters((current) => ({
                    ...current,
                    period:
                      event.target
                        .value as ActivityPeriod,
                  }));
                }}
              >
                <option value="all">
                  Toda
                </option>
                <option value="today">
                  Hoy
                </option>
                <option value="7d">
                  Últimos 7 días
                </option>
                <option value="30d">
                  Últimos 30 días
                </option>
                <option value="inactive">
                  Sin actividad reciente
                </option>
              </Select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={clearFilters}
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

        {error ? (
          <div className="p-5">
            <p className="text-sm text-danger">
              {error}
            </p>
          </div>
        ) : null}

        {loading && !users ? (
          <div className="p-5">
            <p className="text-sm text-foreground-secondary">
              Cargando actividad...
            </p>
          </div>
        ) : null}

        {users ? (
          <>
            <div
              className={
                loading
                  ? "overflow-x-auto opacity-60"
                  : "overflow-x-auto"
              }
            >
              <table className="w-full min-w-[1100px] text-left text-sm">
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
                      Última conexión
                    </th>
                    <th className="px-5 py-3">
                      Actividad
                    </th>
                    <th className="px-5 py-3">
                      Precotizaciones
                    </th>
                    <th className="px-5 py-3">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="align-top"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {adminUserFullName(user) ||
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
                        <span className="font-medium text-foreground">
                          {user.isActive
                            ? "Habilitado"
                            : "Deshabilitado"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-foreground-secondary">
                        {formatAdminDate(
                          user.lastLoginAtUtc,
                        )}
                      </td>

                      <td className="px-5 py-4 text-foreground-secondary">
                        {formatRelativeActivity(
                          user.lastLoginAtUtc,
                        )}
                      </td>

                      <td className="px-5 py-4 font-medium text-foreground">
                        {user.preQuoteCount}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/prequotes?userId=${encodeURIComponent(
                            user.id,
                          )}&returnTo=${encodeURIComponent(
                            "/admin/activity",
                          )}`}
                          className="inline-flex items-center justify-center rounded-sm border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                        >
                          Ver precotizaciones
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="border-t border-border p-5 text-sm text-foreground-secondary">
                No se encontraron usuarios con esos filtros.
              </div>
            ) : null}

            <AdminPagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={filteredUsers.length}
              disabled={loading}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </Surface>
    </div>
  );
}