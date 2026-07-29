import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ProjectsPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProjectsPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
}: ProjectsPaginationProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const displayedPage = totalPages === 0 ? 0 : page;

  return (
    <nav
      aria-label="Paginación de proyectos"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-foreground-secondary">
        {totalCount === 0
          ? "0 proyectos"
          : `Mostrando ${start}-${end} de ${totalCount} proyectos`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-center text-sm font-medium text-foreground">
          Página {displayedPage} de {totalPages}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="w-full"
          >
            <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-full"
          >
            Siguiente
            <ChevronRight aria-hidden="true" size={17} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
