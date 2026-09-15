"use client";

import {
  Activity,
  FileText,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getAdminDashboard } from "@/features/admin/admin-api";
import type { AdminDashboard } from "@/features/admin/admin-types";

function MetricCard({
  icon: Icon,
  title,
  value,
  detail,
  href,
}: {
  icon: LucideIcon;
  title: string;
  value: number;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Surface className="min-w-0 h-full transition-colors group-hover:bg-surface-muted">
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
    </Link>
  );
}

function SmallMetric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <div className="h-full rounded-sm border border-border bg-surface-subtle p-3 transition-colors hover:bg-surface-muted">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
          {label}
        </p>

        <p className="mt-1 text-xl font-semibold text-foreground">
          {value}
        </p>
      </div>
    </Link>
  );
}

export function AdminDashboardPageContent() {
  const [dashboard, setDashboard] =
    useState<AdminDashboard | null>(null);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError(null);

    try {
      const response = await getAdminDashboard();
      setDashboard(response);
    } catch {
      setDashboardError(
        "No fue posible cargar los indicadores administrativos.",
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadDashboard]);

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Administracion
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Panel administrativo
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Consulta indicadores generales y actividad reciente
            de Steel & Glass. Usa las secciones Usuarios y
            Precotizaciones para revisar los listados completos.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loadingDashboard}
          onClick={() => void loadDashboard()}
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={
              loadingDashboard
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

      {loadingDashboard && !dashboard ? (
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
              value={dashboard.totalUsers}
              detail={`${dashboard.activeUsers} cuentas habilitadas`}
              href="/admin/users"
            />

            <MetricCard
              icon={Activity}
              title="Actividad"
              value={dashboard.usersActiveLast30Days}
              detail={`${dashboard.usersActiveToday} activos hoy`}
              href="/admin/users?status=active"
            />

            <MetricCard
              icon={FileText}
              title="Precotizaciones"
              value={dashboard.totalPreQuotes}
              detail={`${dashboard.preQuotesThisMonth} creadas este mes`}
              href="/admin/prequotes?period=month"
            />

            <MetricCard
              icon={FileText}
              title="Actividad comercial"
              value={dashboard.preQuotesThisWeek}
              detail={`${dashboard.preQuotesToday} precotizaciones hoy`}
              href="/admin/prequotes?period=today"
            />
          </div>

          <Surface>
            <h2 className="text-sm font-semibold text-foreground">
              Actividad de usuarios
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SmallMetric
                label="Activos hoy"
                value={dashboard.usersActiveToday}
                href="/admin/users?status=active"
              />

              <SmallMetric
                label="Ultimos 7 dias"
                value={dashboard.usersActiveLast7Days}
                href="/admin/users"
              />

              <SmallMetric
                label="Ultimos 30 dias"
                value={dashboard.usersActiveLast30Days}
                href="/admin/users"
              />
            </div>
          </Surface>
        </>
      ) : null}
    </div>
  );
}