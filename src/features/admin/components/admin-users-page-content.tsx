"use client";

import { RefreshCw, Users, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { getAdminUsers } from "@/features/admin/admin-api";
import type {
  AdminUserRole,
  AdminUsersPage,
} from "@/features/admin/admin-types";

import {
  AdminPagination,
  adminUserFullName,
  formatAdminDate,
} from "./admin-common";

const USERS_PAGE_SIZE = 10;

type UserStatusFilter = "all" | "active" | "inactive";
type UserRoleFilter = "ALL" | AdminUserRole;

interface UserFilters {
  search: string;
  status: UserStatusFilter;
  role: UserRoleFilter;
}

const initialUserFilters: UserFilters = {
  search: "",
  status: "all",
  role: "ALL",
};

export function AdminUsersPageContent() {
  const [users, setUsers] = useState<AdminUsersPage | null>(null);
  const [userFilters, setUserFilters] = useState<UserFilters>(initialUserFilters);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedUserSearch(userFilters.search.trim());
      setUsersPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [userFilters.search]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);

    try {
      const response = await getAdminUsers({
        search: debouncedUserSearch || undefined,
        status: userFilters.status,
        role: userFilters.role === "ALL" ? undefined : userFilters.role,
        page: usersPage,
        pageSize: USERS_PAGE_SIZE,
      });

      setUsers(response);
    } catch {
      setUsersError("No fue posible cargar los usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  }, [debouncedUserSearch, userFilters.status, userFilters.role, usersPage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadUsers]);

  function clearUserFilters() {
    setUserFilters(initialUserFilters);
    setDebouncedUserSearch("");
    setUsersPage(1);
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Administracion
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Usuarios
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Busca cuentas, revisa su estado y accede a sus precotizaciones administrativas.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loadingUsers}
          onClick={() => void loadUsers()}
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={loadingUsers ? "animate-spin" : undefined}
          />
          Actualizar
        </Button>
      </header>

      <Surface padding="none" className="overflow-hidden">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-brand-soft p-3 text-brand">
              <Users aria-hidden="true" size={20} strokeWidth={1.75} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Usuarios registrados
              </h2>

              <p className="mt-1 text-sm text-foreground-secondary">
                Los filtros se aplican automaticamente.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Buscar
              </span>

              <Input
                value={userFilters.search}
                onChange={(event) => {
                  setUserFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }));
                }}
                placeholder="Nombre o correo"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Rol
              </span>

              <Select
                value={userFilters.role}
                onChange={(event) => {
                  setUsersPage(1);
                  setUserFilters((current) => ({
                    ...current,
                    role: event.target.value as UserRoleFilter,
                  }));
                }}
              >
                <option value="ALL">Todos</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-foreground-secondary">
                Estado
              </span>

              <Select
                value={userFilters.status}
                onChange={(event) => {
                  setUsersPage(1);
                  setUserFilters((current) => ({
                    ...current,
                    status: event.target.value as UserStatusFilter,
                  }));
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                disabled={loadingUsers}
                onClick={clearUserFilters}
              >
                <X aria-hidden="true" size={15} />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>

        {usersError ? (
          <div className="p-5">
            <p className="text-sm text-danger">{usersError}</p>
          </div>
        ) : null}

        {loadingUsers && !users ? (
          <div className="p-5">
            <p className="text-sm text-foreground-secondary">Cargando usuarios...</p>
          </div>
        ) : null}

        {users ? (
          <>
            <div className={loadingUsers ? "overflow-x-auto opacity-60" : "overflow-x-auto"}>
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                  <tr>
                    <th className="px-5 py-3">Usuario</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Precotizaciones</th>
                    <th className="px-5 py-3">Ultimo acceso</th>
                    <th className="px-5 py-3">Accion</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {users.items.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {adminUserFullName(user) || "Sin nombre"}
                        </p>

                        <p className="mt-1 text-xs text-foreground-secondary">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-foreground">{user.role}</td>

                      <td className="px-5 py-4">
                        <span className={user.isActive ? "font-medium text-foreground" : "font-medium text-foreground-secondary"}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium text-foreground">
                        {user.preQuoteCount}
                      </td>

                      <td className="px-5 py-4 text-foreground-secondary">
                        {formatAdminDate(user.lastLoginAtUtc)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/prequotes?userId=${encodeURIComponent(user.id)}`}
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

            {users.items.length === 0 ? (
              <div className="border-t border-border p-5 text-sm text-foreground-secondary">
                No se encontraron usuarios con esos filtros.
              </div>
            ) : null}

            <AdminPagination
              page={users.page}
              totalPages={users.totalPages}
              totalCount={users.totalCount}
              disabled={loadingUsers}
              onPageChange={setUsersPage}
            />
          </>
        ) : null}
      </Surface>
    </div>
  );
}