import { Eye, FilePlus2, FileText, SearchX } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  formatDocumentCount,
  formatPreQuoteDateTime,
  formatPreQuoteIdentifier,
} from "@/features/prequotes/prequote-formatters";
import type { PreQuoteListItem } from "@/features/prequotes/prequotes-types";
import { cn } from "@/lib/utils/cn";

export function ProjectPreQuotesTable({
  projectId,
  items,
  onRetry,
  onRequestCreate,
  canCreate,
  isCreating,
}: {
  projectId: string;
  items: PreQuoteListItem[];
  onRetry: () => void;
  onRequestCreate: () => void;
  canCreate: boolean;
  isCreating: boolean;
}) {
  return (
    <section aria-labelledby="project-prequotes-table-title">
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4 sm:px-6">
          <h2
            id="project-prequotes-table-title"
            className="text-lg font-semibold text-foreground"
          >
            Precotizaciones registradas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left">
            <caption className="sr-only">
              Listado de precotizaciones asociadas al proyecto seleccionado
            </caption>
            <thead className="bg-surface-subtle">
              <tr>
                {[
                  "Precotización",
                  "Documentos",
                  "Creación",
                  "Actualización",
                  "Detalle",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="border-b border-border-subtle px-5 py-3 text-xs font-semibold text-foreground-secondary"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <SearchX
                      aria-hidden="true"
                      className="mx-auto text-muted"
                      size={28}
                      strokeWidth={1.5}
                    />
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      No hay precotizaciones registradas
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                      Crea la primera precotización para comenzar a organizar
                      sus documentos.
                    </p>
                    <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                      {canCreate ? (
                        <Button
                          type="button"
                          variant="primary"
                          disabled={isCreating}
                          className="w-full sm:w-auto"
                          onClick={onRequestCreate}
                        >
                          <FilePlus2
                            aria-hidden="true"
                            size={17}
                            strokeWidth={1.75}
                          />
                          {isCreating
                            ? "Creando..."
                            : "Crear primera precotización"}
                        </Button>
                      ) : (
                        <p className="text-sm text-foreground-secondary">
                          Activa el proyecto para crear precotizaciones.
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={onRetry}
                      >
                        Actualizar listado
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((preQuote) => (
                  <tr key={preQuote.id} className="bg-surface">
                    <td className="px-5 py-4 align-top">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                          <FileText
                            aria-hidden="true"
                            size={18}
                            strokeWidth={1.75}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            Precotización
                          </p>
                          <p className="mt-1 break-all text-sm text-foreground-secondary">
                            <span className="sr-only">
                              Identificador completo:
                            </span>
                            {preQuote.id}
                          </p>
                          <p
                            aria-hidden="true"
                            className="mt-1 text-xs font-medium uppercase text-muted"
                          >
                            {formatPreQuoteIdentifier(preQuote.id)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-medium text-foreground">
                      {formatDocumentCount(preQuote.documentCount)}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      {formatPreQuoteDateTime(preQuote.createdAtUtc)}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      {formatPreQuoteDateTime(preQuote.updatedAtUtc)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Link
                        href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuote.id)}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full",
                        )}
                        aria-label={`Ver detalle de precotización ${preQuote.id}`}
                      >
                        <Eye aria-hidden="true" size={17} strokeWidth={1.75} />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </section>
  );
}
