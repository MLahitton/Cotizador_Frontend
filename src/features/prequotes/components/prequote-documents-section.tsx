import { RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getPreQuoteDocumentsErrorMessage } from "@/features/prequotes/components/prequote-errors";
import { PreQuotesError, PreQuotesLoading } from "@/features/prequotes/components/prequotes-status";
import { PreQuoteDocumentsPagination } from "@/features/prequotes/components/prequote-documents-pagination";
import { PreQuoteDocumentsTable } from "@/features/prequotes/components/prequote-documents-table";
import type { PreQuoteDocumentsPage } from "@/features/prequotes/prequote-documents-types";
import type { PreQuoteLoadError } from "@/features/prequotes/prequotes-types";
import { cn } from "@/lib/utils/cn";

export function PreQuoteDocumentsSection({
  projectId,
  preQuoteId,
  documentsPage,
  error,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  projectId: string;
  preQuoteId: string;
  documentsPage: PreQuoteDocumentsPage | null;
  error: PreQuoteLoadError | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section aria-labelledby="prequote-documents-title" className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="prequote-documents-title"
            className="text-lg font-semibold text-foreground"
          >
            Documentos
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Documentos existentes asociados a esta precotización.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isLoading || isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw aria-hidden="true" size={17} strokeWidth={1.75} />
          Actualizar documentos
        </Button>
      </div>

      {error ? (
        <PreQuotesError
          title="No fue posible consultar los documentos"
          message={getPreQuoteDocumentsErrorMessage(error.cause)}
          onRetry={onRefresh}
        />
      ) : null}

      {isLoading ? (
        <PreQuotesLoading message="Cargando documentos..." />
      ) : null}

      {isRefreshing ? (
        <p
          className="text-sm text-foreground-secondary"
          role="status"
          aria-live="polite"
        >
          Actualizando documentos...
        </p>
      ) : null}

      {documentsPage && !isLoading ? (
        documentsPage.items.length === 0 ? (
          <Surface>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {documentsPage.totalCount === 0
                  ? "No hay documentos registrados"
                  : "No hay documentos en esta página"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                {documentsPage.totalCount === 0
                  ? "Los documentos asociados a esta precotización aparecerán aquí cuando existan en el backend."
                  : "La página solicitada no tiene resultados disponibles."}
              </p>
              {documentsPage.totalCount > 0 ? (
                <Link
                  href={`/projects/${encodeURIComponent(projectId)}/prequotes/${encodeURIComponent(preQuoteId)}?documentsPage=1`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-5",
                  )}
                >
                  Volver a la primera página
                </Link>
              ) : null}
            </div>
          </Surface>
        ) : (
          <>
            <PreQuoteDocumentsTable
              items={documentsPage.items}
              projectId={projectId}
              preQuoteId={preQuoteId}
            />
            <PreQuoteDocumentsPagination
              projectId={projectId}
              preQuoteId={preQuoteId}
              page={documentsPage.page}
              pageSize={documentsPage.pageSize}
              totalCount={documentsPage.totalCount}
              totalPages={documentsPage.totalPages}
            />
          </>
        )
      ) : null}
    </section>
  );
}
