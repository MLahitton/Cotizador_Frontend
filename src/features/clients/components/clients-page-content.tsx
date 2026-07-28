"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ClientsFeedback } from "@/features/clients/components/clients-feedback";
import { ClientsPagination } from "@/features/clients/components/clients-pagination";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { ClientsToolbar } from "@/features/clients/components/clients-toolbar";
import { useClients } from "@/features/clients/use-clients";
import { cn } from "@/lib/utils/cn";

export function ClientsPageContent() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    searchInput,
    appliedSearch,
    searchValidationMessage,
    status,
    pageSize,
    changeSearchInput,
    submitSearch,
    clearSearch,
    changeStatus,
    changePage,
    clearFilters,
    reload,
  } = useClients();

  const hasFilters = appliedSearch.length > 0 || status !== "active";
  const showResults = data !== null && !isLoading;

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone="brand">Gestión comercial</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Consulta y administra la información de los clientes registrados en
            la plataforma.
          </p>
        </div>
        <Link
          href="/clients/new"
          className={cn(
            buttonVariants({ variant: "primary" }),
            "w-full shrink-0 sm:w-auto",
          )}
        >
          <Plus aria-hidden="true" size={17} strokeWidth={1.75} />
          Nuevo cliente
        </Link>
      </header>

      <Surface padding="none">
        <ClientsToolbar
          searchInput={searchInput}
          appliedSearch={appliedSearch}
          validationMessage={searchValidationMessage}
          status={status}
          onSearchInputChange={changeSearchInput}
          onSearchSubmit={submitSearch}
          onSearchClear={clearSearch}
          onStatusChange={changeStatus}
        />
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
