import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function pageHref(projectId: string, page: number): string {
  return `/projects/${encodeURIComponent(projectId)}/prequotes?page=${page}`;
}

export function ProjectPreQuotesPagination({
  projectId,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  projectId: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const displayedPage = totalPages === 0 ? 0 : page;
  const canGoBack = page > 1;
  const canGoForward = totalPages > 0 && page < totalPages;

  return (
    <nav
      aria-label="Paginación de precotizaciones"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-foreground-secondary">
        {totalCount === 0
          ? "0 precotizaciones"
          : `Mostrando ${start}-${end} de ${totalCount} precotizaciones`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-center text-sm font-medium text-foreground">
          Página {displayedPage} de {totalPages}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {canGoBack ? (
            <Link
              href={pageHref(projectId, page - 1)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
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
              href={pageHref(projectId, page + 1)}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
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
