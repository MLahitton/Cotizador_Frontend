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
    <div className="space-y-8">
      <header>
        <Badge tone="brand">Resumen operativo</Badge>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">
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

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-8">
          <DashboardRecentProjects />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-4">
          <DashboardQuickActions />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DashboardProcessOverview />
        </div>
        <div className="lg:col-span-4">
          <DashboardActivity />
        </div>
      </div>
    </div>
  );
}
