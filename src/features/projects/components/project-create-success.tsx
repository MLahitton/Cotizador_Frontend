import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientListItem } from "@/features/clients/clients-types";
import {
  getClientDisplayName,
  getClientSecondaryLabel,
} from "@/features/projects/project-formatters";
import type { CreatedProject } from "@/features/projects/projects-types";
import { cn } from "@/lib/utils/cn";

interface ProjectCreateSuccessProps {
  createdProject: CreatedProject;
  selectedClient: ClientListItem;
  onCreateAnother: () => void;
}

export function ProjectCreateSuccess({
  createdProject,
  selectedClient,
  onCreateAnother,
}: ProjectCreateSuccessProps) {
  return (
    <Surface className="max-w-3xl">
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-1 shrink-0 text-success"
          size={24}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <Badge tone="success">Proyecto creado</Badge>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Proyecto creado correctamente
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground-secondary">
                Código del proyecto
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {createdProject.code}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground-secondary">
                Nombre del proyecto
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {createdProject.name}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-foreground-secondary">
                Cliente seleccionado
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {getClientDisplayName(selectedClient)}
              </dd>
              <dd className="mt-1 break-words text-foreground-secondary">
                {getClientSecondaryLabel(selectedClient)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full sm:w-auto",
              )}
            >
              Volver a proyectos
            </Link>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={onCreateAnother}
            >
              <Plus aria-hidden="true" size={17} strokeWidth={1.75} />
              Crear otro proyecto
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
