import Link from "next/link";
import {
  FileSpreadsheet,
  FolderKanban,
  Plus,
  Users,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";

const quickActions = [
  {
    title: "Nuevo proyecto",
    description: "Crea un nuevo proyecto de cotización.",
    href: "/projects/new",
    icon: Plus,
  },
  {
    title: "Ver proyectos",
    description: "Consulta y continúa trabajando en tus proyectos.",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Ver clientes",
    description: "Consulta los clientes asociados a tu cuenta.",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Propuesta FP Pro",
    description: "Genera una propuesta a partir de un reporte de FP Pro.",
    href: "/proposals/fp-pro",
    icon: FileSpreadsheet,
  },
];

export function DashboardQuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <Surface
        padding="none"
        className="min-w-0"
      >
        <div className="p-4 sm:p-6">
          <h2
            id="quick-actions-title"
            className="text-lg font-semibold text-foreground"
          >
            Acciones rápidas
          </h2>

          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Accede directamente a las funciones principales del cotizador.
          </p>
        </div>

        <Separator />

        <div className="space-y-3 p-4 sm:p-6">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="block min-w-0 rounded-sm border border-border-subtle bg-surface-subtle p-4 transition-colors hover:bg-surface"
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
                    <p className="text-sm font-semibold text-foreground">
                      {action.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Surface>
    </section>
  );
}