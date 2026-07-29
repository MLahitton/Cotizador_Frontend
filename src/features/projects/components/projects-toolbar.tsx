"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  ProjectClientTypeFilter,
  ProjectDocumentTypeFilter,
  ProjectStatusFilter,
} from "@/features/projects/projects-types";

const statusOptions: Array<{
  label: string;
  value: ProjectStatusFilter;
}> = [
  { label: "Activos", value: "active" },
  { label: "Inactivos", value: "inactive" },
  { label: "Todos", value: "all" },
];

export interface ProjectsToolbarProps {
  searchInput: string;
  appliedSearch: string;
  validationMessage: string;
  status: ProjectStatusFilter;
  clientType: ProjectClientTypeFilter;
  documentType: ProjectDocumentTypeFilter;
  hasFilters: boolean;
  onSearchInputChange: (search: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
  onClientTypeChange: (clientType: ProjectClientTypeFilter) => void;
  onDocumentTypeChange: (documentType: ProjectDocumentTypeFilter) => void;
  onClearFilters: () => void;
}

export function ProjectsToolbar({
  searchInput,
  appliedSearch,
  validationMessage,
  status,
  clientType,
  documentType,
  hasFilters,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  onStatusChange,
  onClientTypeChange,
  onDocumentTypeChange,
  onClearFilters,
}: ProjectsToolbarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validationMessage) {
      onSearchSubmit();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="min-w-0">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="projects-search"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Buscar proyectos
            </label>
            <Input
              id="projects-search"
              name="search"
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Buscar por proyecto, cliente, documento o ubicación"
              maxLength={200}
              aria-invalid={validationMessage ? true : undefined}
              aria-describedby={
                validationMessage ? "projects-search-error" : undefined
              }
            />
            {validationMessage ? (
              <p
                id="projects-search-error"
                className="mt-2 text-sm text-danger"
                role="alert"
              >
                {validationMessage}
              </p>
            ) : null}
          </div>
          {searchInput || appliedSearch ? (
            <Button type="button" variant="outline" onClick={onSearchClear}>
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)_minmax(14rem,18rem)_auto] xl:items-end">
        <div
          role="group"
          aria-label="Filtrar proyectos por estado"
          className="grid grid-cols-3 gap-2"
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
                className="w-full px-2"
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        <div className="min-w-0">
          <label
            htmlFor="projects-client-type"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Tipo de cliente
          </label>
          <Select
            id="projects-client-type"
            value={clientType ?? ""}
            onChange={(event) =>
              onClientTypeChange(
                event.target.value
                  ? (event.target.value as ProjectClientTypeFilter)
                  : null,
              )
            }
          >
            <option value="">Todos</option>
            <option value="Company">Empresa</option>
            <option value="Person">Persona</option>
          </Select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="projects-document-type"
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Tipo de documento del cliente
          </label>
          <Select
            id="projects-document-type"
            value={documentType ?? ""}
            onChange={(event) =>
              onDocumentTypeChange(
                event.target.value
                  ? (event.target.value as ProjectDocumentTypeFilter)
                  : null,
              )
            }
          >
            <option value="">Todos</option>
            <option value="Nit">NIT</option>
            <option value="CitizenshipCard">Cédula de ciudadanía</option>
            <option value="ForeignerId">Cédula de extranjería</option>
            <option value="Passport">Pasaporte</option>
            <option value="Other">Otro</option>
          </Select>
        </div>

        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            className="w-full xl:w-auto"
            onClick={onClearFilters}
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}
