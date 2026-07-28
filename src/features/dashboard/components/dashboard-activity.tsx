import { Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";

export function DashboardActivity() {
  return (
    <section aria-labelledby="dashboard-activity-title">
      <Surface padding="none">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <h2
              id="dashboard-activity-title"
              className="text-lg font-semibold text-foreground"
            >
              Actividad reciente
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Los cambios importantes del sistema aparecerán en este espacio.
            </p>
          </div>
          <Badge tone="neutral" size="sm">
            Sin datos
          </Badge>
        </div>
        <Separator />
        <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
          <Activity
            aria-hidden="true"
            className="mx-auto text-muted"
            size={28}
            strokeWidth={1.5}
          />
          <p className="mt-4 text-sm font-semibold text-foreground">
            No hay actividad disponible
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
            Las actualizaciones de proyectos, documentos y cotizaciones se
            mostrarán aquí.
          </p>
        </div>
      </Surface>
    </section>
  );
}
