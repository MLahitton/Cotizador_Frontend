"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils/cn";

export function StructuredExtractionInvalidDocumentState({
  projectId,
  preQuoteId,
}: {
  projectId: string;
  preQuoteId: string;
}) {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedPreQuoteId = encodeURIComponent(preQuoteId);

  return (
    <Surface>
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Identificador de documento inválido.
            </h1>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              Revisa el enlace utilizado para abrir esta página.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/projects/${encodedProjectId}/prequotes/${encodedPreQuoteId}`}
              className={cn(
                buttonVariants({ variant: "primary" }),
                "w-full sm:w-auto",
              )}
            >
              Volver a la precotización
            </Link>
            <Link
              href={`/projects/${encodedProjectId}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full sm:w-auto",
              )}
            >
              Volver al proyecto
            </Link>
            <Link
              href={`/projects/${encodedProjectId}/prequotes`}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full sm:w-auto",
              )}
            >
              Volver a precotizaciones
            </Link>
          </div>
        </div>
      </div>
    </Surface>
  );
}
