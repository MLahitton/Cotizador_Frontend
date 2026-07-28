import { FileCheck, ListChecks, ScanText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";

const processStages = [
  { name: "Extracción", icon: ScanText },
  { name: "Validación", icon: ListChecks },
  { name: "Cotización final", icon: FileCheck },
];

export function DashboardProcessOverview() {
  return (
    <section aria-labelledby="process-overview-title">
      <Surface padding="none">
        <div className="p-5 sm:p-6">
          <h2
            id="process-overview-title"
            className="text-lg font-semibold text-foreground"
          >
            Seguimiento de procesos
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Estado general de las etapas que forman una cotización.
          </p>
        </div>
        <Separator />
        <ol className="grid gap-px bg-border-subtle md:grid-cols-3">
          {processStages.map((stage) => {
            const Icon = stage.icon;

            return (
              <li key={stage.name} className="bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-muted text-brand">
                    <Icon
                      aria-hidden="true"
                      size={19}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Badge tone="neutral" size="sm">
                    Sin actividad
                  </Badge>
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {stage.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Disponible cuando existan proyectos en procesamiento.
                </p>
                <div
                  aria-hidden="true"
                  className="mt-5 h-1 w-full rounded-full bg-surface-muted"
                />
              </li>
            );
          })}
        </ol>
      </Surface>
    </section>
  );
}
