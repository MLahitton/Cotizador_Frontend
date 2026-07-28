"use client";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { ClientsFeedback } from "@/features/clients/components/clients-feedback";
import { ClientsPagination } from "@/features/clients/components/clients-pagination";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { ClientsToolbar } from "@/features/clients/components/clients-toolbar";
import { useClients } from "@/features/clients/use-clients";

export function ClientsPageContent() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    search,
    status,
    pageSize,
    applySearch,
    changeStatus,
    changePage,
    clearFilters,
    reload,
  } = useClients();

  const hasFilters = search.length > 0 || status !== "active";
  const showResults = data !== null && !isLoading;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="brand">Gestión comercial</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Consulta y administra la información de los clientes registrados en
            la plataforma.
          </p>
        </div>
        <Badge tone="neutral">Creación próximamente</Badge>
      </header>

      <Surface padding="none">
        <ClientsToolbar
          key={search}
          appliedSearch={search}
          status={status}
          onSearch={applySearch}
          onStatusChange={changeStatus}
        />
        <div className="p-5 sm:p-6">
          <p className="text-sm text-muted">
            Nueva creación disponible próximamente
          </p>
        </div>
      </Surface>

      <ClientsFeedback
        error={error}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRetry={reload}
      />

      {showResults ? (
        <>
          <ClientsTable
            items={data.items}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />
          <ClientsPagination
            page={data.page}
            pageSize={data.pageSize || pageSize}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            onPageChange={changePage}
          />
        </>
      ) : null}
    </div>
  );
}
