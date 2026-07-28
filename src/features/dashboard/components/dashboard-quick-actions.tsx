import { Calculator, Plus, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";

const quickActions = [
  {
    title: "Nuevo proyecto",
    description: "Inicia un proyecto de cotización.",
    icon: Plus,
  },
  {
    title: "Importar archivo",
    description: "Carga documentos para su procesamiento.",
    icon: Upload,
  },
  {
    title: "Crear precotización",
    description: "Prepara una estimación inicial.",
    icon: Calculator,
  },
];

export function DashboardQuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <Surface padding="none" className="min-w-0">
        <div className="p-4 sm:p-6">
          <h2
            id="quick-actions-title"
            className="text-lg font-semibold text-foreground"
          >
            Acciones rápidas
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Accesos preparados para los próximos flujos del cotizador.
          </p>
        </div>
        <Separator />
        <div className="space-y-3 p-4 sm:p-6">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <div
                key={action.title}
                aria-disabled="true"
                className="min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                    <Icon
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.75}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {action.title}
                      </p>
                      <Badge tone="neutral" size="sm">
                        Próximamente
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </section>
  );
}
