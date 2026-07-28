import { FolderOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";

export function DashboardRecentProjects() {
  return (
    <section aria-labelledby="recent-projects-title">
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2
              id="recent-projects-title"
              className="text-lg font-semibold text-foreground"
            >
              Proyectos recientes
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Los proyectos creados o actualizados recientemente aparecerán
              aquí.
            </p>
          </div>
          <Badge tone="neutral" size="sm">
            Sin datos
          </Badge>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <caption className="sr-only">
              Proyectos creados o actualizados recientemente
            </caption>
            <thead className="bg-surface-subtle">
              <tr>
                {["Proyecto", "Cliente", "Estado", "Actualización"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="border-b border-border-subtle px-4 py-3 text-xs font-semibold text-foreground-secondary sm:px-6"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center sm:px-6 sm:py-12">
                  <FolderOpen
                    aria-hidden="true"
                    className="mx-auto text-muted"
                    size={28}
                    strokeWidth={1.5}
                  />
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    Aún no hay proyectos para mostrar
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                    Cuando el módulo de proyectos esté habilitado, su actividad
                    reciente aparecerá en esta sección.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Surface>
    </section>
  );
}
