import { Lock } from "lucide-react";

import { Surface } from "@/components/ui/surface";

export { ProjectMomentsStep } from "./project-moments-step";

export function ProjectSummaryStep() {
  return (
    <Surface variant="subtle">
      <div className="flex items-start gap-3">
        <Lock
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-foreground-secondary"
          size={20}
          strokeWidth={1.75}
        />
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Resumen
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Resumen aún no disponible en esta sección
          </p>
        </div>
      </div>
    </Surface>
  );
}
