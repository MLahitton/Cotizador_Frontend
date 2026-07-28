"use client";

import { Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";

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
  appliedSearch: string;
  status: ClientStatusFilter;
  onSearch: (search: string) => void;
  onStatusChange: (status: ClientStatusFilter) => void;
}

export function ClientsToolbar({
  appliedSearch,
  status,
  onSearch,
  onStatusChange,
}: ClientsToolbarProps) {
  const [searchText, setSearchText] = useState(appliedSearch);
  const [validationMessage, setValidationMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedSearch = searchText.trim();

    if (normalizedSearch.length > 200) {
      setValidationMessage(
        "La búsqueda no puede superar los 200 caracteres.",
      );
      return;
    }

    setValidationMessage("");
    onSearch(normalizedSearch);
  };

  const handleClear = () => {
    setSearchText("");
    setValidationMessage("");
    onSearch("");
  };

  return (
    <div className="flex flex-col gap-5 border-b border-border-subtle p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
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
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
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
          <Button type="submit">
            <Search aria-hidden="true" size={17} strokeWidth={1.75} />
            Buscar
          </Button>
          {searchText || appliedSearch ? (
            <Button type="button" variant="outline" onClick={handleClear}>
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      <div
        role="group"
        aria-label="Filtrar clientes por estado"
        className="flex flex-wrap gap-2"
      >
        {statusOptions.map((option) => {
          const isActive = status === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              aria-pressed={isActive}
              onClick={() => onStatusChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
