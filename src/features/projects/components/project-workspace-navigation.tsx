import {
  CalendarDays,
  ClipboardList,
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
  | "diagnosis"
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
    id: "diagnosis",
    label: "Diagnóstico",
    Icon: ClipboardList,
  },
  {
    id: "moments",
    label: "Momentos",
    Icon: CalendarDays,
  },
  {
    id: "documents",
    label: "Documentos",
    Icon: FileText,
  },
  {
    id: "configuration",
    label: "Configuración de elementos",
    Icon: SlidersHorizontal,
  },
  {
    id: "summary",
    label: "Resumen",
    disabled: true,
    Icon: LayoutList,
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
      <ol className="flex gap-2 overflow-x-auto p-1 lg:block lg:space-y-1.5 lg:overflow-visible">
        {steps.map(({ id, label, disabled, Icon }) => {
          const isActive = activeStep === id;
          return (
            <li key={id} className="w-max flex-none lg:w-auto lg:flex-auto lg:min-w-0">
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                aria-current={isActive ? "page" : undefined}
                title={
                  disabled
                    ? "Resumen aún no disponible en esta sección"
                    : label
                }
                className={cn(
                  "min-h-11 h-auto w-full justify-start gap-2 rounded-sm border px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
                <Icon aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="min-w-0 font-semibold lg:whitespace-normal">{label}</span>
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
