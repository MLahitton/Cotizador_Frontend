import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function pageHref(projectId: string, preQuoteId: string, page: number): string {
  return `/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}?documentsPage=${page}`;
}

export function PreQuoteDocumentsPagination({
  projectId,
  preQuoteId,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  projectId: string;
  preQuoteId: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}) {
  if (totalPages === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <nav
      aria-label="Paginación de documentos"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-foreground-secondary">
        Mostrando {start}-{end} de {totalCount} documentos
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-center text-sm font-medium text-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {canGoBack ? (
            <Link
              href={pageHref(projectId, preQuoteId, page - 1)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              aria-label="Ir a la página anterior de documentos"
            >
              <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.75} />
              Anterior
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full pointer-events-none opacity-60",
              )}
            >
              <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.75} />
              Anterior
            </span>
          )}
          {canGoForward ? (
            <Link
              href={pageHref(projectId, preQuoteId, page + 1)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              aria-label="Ir a la página siguiente de documentos"
            >
              Siguiente
              <ChevronRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full pointer-events-none opacity-60",
              )}
            >
              Siguiente
              <ChevronRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
