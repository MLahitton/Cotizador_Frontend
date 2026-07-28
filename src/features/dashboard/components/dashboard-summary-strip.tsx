import {
  CircleAlert,
  CircleCheck,
  FileText,
  FolderKanban,
} from "lucide-react";

import { Surface } from "@/components/ui/surface";

const summaryItems = [
  { label: "Proyectos activos", icon: FolderKanban },
  { label: "Cotizaciones en curso", icon: FileText },
  { label: "Pendientes por validar", icon: CircleAlert },
  { label: "Cotizaciones aprobadas", icon: CircleCheck },
];

export function DashboardSummaryStrip() {
  return (
    <section aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title" className="sr-only">
        Indicadores generales
      </h2>
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <div className="grid gap-px bg-border-subtle sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="min-w-0 bg-surface p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-secondary">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">
                      —
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                    <Icon
                      aria-hidden="true"
                      size={19}
                      strokeWidth={1.75}
                    />
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Sin información disponible
                </p>
              </div>
            );
          })}
        </div>
      </Surface>
    </section>
  );
}
