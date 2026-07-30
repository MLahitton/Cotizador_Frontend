import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatProjectStatus } from "@/features/projects/project-detail-formatters";
import type { ProjectDetails } from "@/features/projects/projects-types";
import { cn } from "@/lib/utils/cn";

export function ProjectPreQuotesHeader({
  project,
}: {
  project: ProjectDetails;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Link
          href={`/projects/${encodeURIComponent(project.id)}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 w-full justify-start px-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver al proyecto
        </Link>
        <Badge tone="brand">Precotizaciones</Badge>
        <p className="mt-4 break-words text-sm font-semibold uppercase text-foreground-secondary">
          {project.code}
        </p>
        <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="min-w-0 break-words text-2xl font-semibold text-foreground sm:text-3xl">
            {project.name}
          </h1>
          <Badge tone={project.isActive ? "success" : "neutral"} size="sm">
            {formatProjectStatus(project.isActive)}
          </Badge>
        </div>
      </div>
    </header>
  );
}
