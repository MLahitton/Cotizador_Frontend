import { Badge } from "@/components/ui/badge";
import { DashboardActivity } from "@/features/dashboard/components/dashboard-activity";
import { DashboardProcessOverview } from "@/features/dashboard/components/dashboard-process-overview";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardRecentProjects } from "@/features/dashboard/components/dashboard-recent-projects";
import { DashboardSummaryStrip } from "@/features/dashboard/components/dashboard-summary-strip";

export interface DashboardOverviewProps {
  firstName: string;
}

export function DashboardOverview({ firstName }: DashboardOverviewProps) {
  const normalizedFirstName = firstName.trim();

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <header className="min-w-0">
        <Badge tone="brand">Resumen operativo</Badge>
        <h1 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
          {normalizedFirstName ? `Hola, ${normalizedFirstName}` : "Hola"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
          Consulta el estado general de los procesos de cotización desde un
          solo lugar.
        </p>
        <p className="mt-2 text-xs leading-5 text-muted">
          Los indicadores se actualizarán cuando los módulos operativos estén
          conectados.
        </p>
      </header>

      <DashboardSummaryStrip />

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="order-2 min-w-0 xl:order-1 xl:col-span-8">
          <DashboardRecentProjects />
        </div>
        <div className="order-1 min-w-0 xl:order-2 xl:col-span-4">
          <DashboardQuickActions />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <DashboardProcessOverview />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <DashboardActivity />
        </div>
      </div>
    </div>
  );
}
