"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ProjectsFeedback } from "@/features/projects/components/projects-feedback";
import { ProjectsPagination } from "@/features/projects/components/projects-pagination";
import { ProjectsTable } from "@/features/projects/components/projects-table";
import { ProjectsToolbar } from "@/features/projects/components/projects-toolbar";
import { useProjects } from "@/features/projects/use-projects";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/features/auth/auth-context";

export function ProjectsPageContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const {
    data,
    error,
    isLoading,
    isRefreshing,
    searchInput,
    appliedSearch,
    searchValidationMessage,
    status,
    clientType,
    documentType,
    attention,
    pageSize,
    changeSearchInput,
    submitSearch,
    clearSearch,
    changeStatus,
    changeClientType,
    changeDocumentType,
    changePage,
    clearFilters,
    reload,
  } = useProjects();

  const hasFilters =
    appliedSearch.length > 0 ||
    status !== "all" ||
    clientType !== null ||
    documentType !== null ||
    attention !== null;

  const showResults =
    data !== null && !isLoading;

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              Gestión operativa
            </Badge>

            {attention === "pending" ? (
              <Badge tone="warning">
                Proyectos con pendientes
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Proyectos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {attention === "pending"
              ? "Mostrando proyectos que tienen procesos pendientes de revisión o requerimientos en análisis."
              : "Consulta los proyectos registrados y la información de sus clientes asociados."}
          </p>
        </div>

        {!isAdmin ? (
          <Link
            href="/projects/new"
            className={cn(
              buttonVariants({
                variant: "primary",
              }),
              "w-full shrink-0 sm:w-auto",
            )}
          >
            <Plus
              aria-hidden="true"
              size={17}
              strokeWidth={1.75}
            />
            Nuevo proyecto
          </Link>
        ) : null}
      </header>

      <Surface padding="none">
        <ProjectsToolbar
          searchInput={searchInput}
          appliedSearch={appliedSearch}
          validationMessage={
            searchValidationMessage
          }
          status={status}
          clientType={clientType}
          documentType={documentType}
          hasFilters={hasFilters}
          onSearchInputChange={
            changeSearchInput
          }
          onSearchSubmit={
            submitSearch
          }
          onSearchClear={
            clearSearch
          }
          onStatusChange={
            changeStatus
          }
          onClientTypeChange={
            changeClientType
          }
          onDocumentTypeChange={
            changeDocumentType
          }
          onClearFilters={
            clearFilters
          }
        />
      </Surface>

      <ProjectsFeedback
        error={error}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRetry={reload}
      />

      {showResults ? (
        <>
          <ProjectsTable
            items={data.items}
            hasFilters={hasFilters}
            onClearFilters={
              clearFilters
            }
          />

          <ProjectsPagination
            page={data.page}
            pageSize={
              data.pageSize ||
              pageSize
            }
            totalCount={
              data.totalCount
            }
            totalPages={
              data.totalPages
            }
            onPageChange={
              changePage
            }
          />
        </>
      ) : null}
    </div>
  );
}