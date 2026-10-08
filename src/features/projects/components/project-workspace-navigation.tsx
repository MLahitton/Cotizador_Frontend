import {
  CalendarDays,
  FileText,
  Home,
  LayoutList,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type ProjectWorkspaceStep =
  | "context"
  | "moments"
  | "configuration"
  | "summary"
  | "documents";

const steps: Array<{
  id: ProjectWorkspaceStep;
  label: string;
  disabled?: boolean;
  Icon: LucideIcon;
}> = [
  {
    id: "context",
    label: "Contexto",
    Icon: Home,
  },
  {
    id: "moments",
    label: "Momentos",
    Icon: CalendarDays,
  },
  {
    id: "configuration",
    label: "Configuración de espacios",
    Icon: SlidersHorizontal,
  },
  {
    id: "summary",
    label: "Resumen",
    disabled: true,
    Icon: LayoutList,
  },
  {
    id: "documents",
    label: "Documentos",
    Icon: FileText,
  },
];

export function ProjectWorkspaceNavigation({
  activeStep,
  onStepChange,
}: {
  activeStep: ProjectWorkspaceStep;
  onStepChange: (step: ProjectWorkspaceStep) => void;
}) {
  return (
    <nav aria-label="Secciones del proyecto" className="min-w-0">
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
        {steps.map(({ id, label, disabled, Icon }) => {
          const isActive = activeStep === id;
          return (
            <li key={id} className="w-44 flex-none lg:w-auto lg:flex-auto lg:min-w-0">
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                title={
                  disabled
                    ? "Disponible después de confirmar la configuración y calcular la propuesta."
                    : label
                }
                className={cn(
                  "h-11 w-full justify-start gap-2 rounded-sm border px-3 text-left text-sm",
                  isActive && id === "moments"
                    ? "border-[#8D9DB7]/60 bg-[#D9E3F0] text-foreground shadow-sm shadow-[#8D9DB7]/15"
                    : isActive
                    ? "border-accent bg-accent-soft text-foreground shadow-sm shadow-accent/10"
                    : "border-transparent bg-transparent text-foreground-secondary hover:bg-surface-subtle hover:text-foreground",
                  disabled ? "opacity-55" : "",
                )}
                onClick={() => {
                  if (!disabled) {
                    onStepChange(id);
                  }
                }}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
                <span className="min-w-0 truncate font-semibold">{label}</span>
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
