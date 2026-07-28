"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientStatusFilter } from "@/features/clients/clients-types";

const statusOptions: Array<{
  label: string;
  value: ClientStatusFilter;
}> = [
  { label: "Activos", value: "active" },
  { label: "Inactivos", value: "inactive" },
  { label: "Todos", value: "all" },
];

export interface ClientsToolbarProps {
  searchInput: string;
  appliedSearch: string;
  validationMessage: string;
  status: ClientStatusFilter;
  onSearchInputChange: (search: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onStatusChange: (status: ClientStatusFilter) => void;
}

export function ClientsToolbar({
  searchInput,
  appliedSearch,
  validationMessage,
  status,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  onStatusChange,
}: ClientsToolbarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validationMessage) {
      onSearchSubmit();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="clients-search"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Buscar clientes
          </label>
          <Input
            id="clients-search"
            name="search"
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Buscar por nombre, documento o correo..."
            maxLength={200}
            aria-invalid={validationMessage ? true : undefined}
            aria-describedby={
              validationMessage ? "clients-search-error" : undefined
            }
          />
          {validationMessage ? (
            <p
              id="clients-search-error"
              className="mt-2 text-sm text-danger"
              role="alert"
            >
              {validationMessage}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {searchInput || appliedSearch ? (
            <Button type="button" variant="outline" onClick={onSearchClear}>
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      <div
        role="group"
        aria-label="Filtrar clientes por estado"
        className="grid grid-cols-3 gap-2 xl:flex xl:flex-wrap"
      >
        {statusOptions.map((option) => {
          const isActive = status === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={isActive}
              onClick={() => onStatusChange(option.value)}
              className="w-full px-2 xl:w-auto xl:px-3"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
