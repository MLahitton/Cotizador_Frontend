"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DashboardActivity } from "@/features/dashboard/components/dashboard-activity";
import { DashboardProcessOverview } from "@/features/dashboard/components/dashboard-process-overview";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardRecentProjects } from "@/features/dashboard/components/dashboard-recent-projects";
import { DashboardSummaryStrip } from "@/features/dashboard/components/dashboard-summary-strip";
import { getUserDashboard } from "@/features/dashboard/dashboard-api";
import type { UserDashboard } from "@/features/dashboard/dashboard-types";

export interface DashboardOverviewProps {
  firstName: string;
}

export function DashboardOverview({
  firstName,
}: DashboardOverviewProps) {
  const normalizedFirstName = firstName.trim();

  const [dashboard, setDashboard] =
    useState<UserDashboard | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [hasError, setHasError] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setHasError(false);

        const result = await getUserDashboard();

        if (isMounted) {
          setDashboard(result);
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <header className="min-w-0">
        <Badge tone="brand">Resumen operativo</Badge>

        <h1 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
          {normalizedFirstName
            ? `Hola, ${normalizedFirstName}`
            : "Hola"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
          Consulta el estado general de tus procesos de cotización desde un
          solo lugar.
        </p>

        {hasError ? (
          <p className="mt-2 text-xs leading-5 text-muted">
            No fue posible actualizar los indicadores del panel.
          </p>
        ) : null}
      </header>

      <DashboardSummaryStrip
        dashboard={dashboard}
        isLoading={isLoading}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="order-2 min-w-0 xl:order-1 xl:col-span-8">
          <DashboardRecentProjects
            projects={dashboard?.recentProjects ?? []}
            isLoading={isLoading}
          />
        </div>

        <div className="order-1 min-w-0 xl:order-2 xl:col-span-4">
          <DashboardQuickActions />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <DashboardProcessOverview
            dashboard={dashboard}
            isLoading={isLoading}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <DashboardActivity
            items={dashboard?.recentActivity ?? []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}