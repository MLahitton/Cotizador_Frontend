import { FolderOpen, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ProjectListItem } from "@/features/projects/projects-types";

const EMPTY_VALUE = "—";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatClientType(clientType: string): string {
  if (clientType === "Company") return "Empresa";
  if (clientType === "Person") return "Persona";
  return clientType || EMPTY_VALUE;
}

function formatDocumentType(documentType: string | null): string {
  if (documentType === "Nit") return "NIT";
  if (documentType === "CitizenshipCard") return "Cédula de ciudadanía";
  if (documentType === "ForeignerId") return "Cédula de extranjería";
  if (documentType === "Passport") return "Pasaporte";
  if (documentType === "Other") return "Otro";
  return EMPTY_VALUE;
}

function formatValue(value: string | null): string {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : EMPTY_VALUE;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

export interface ProjectsTableProps {
  items: ProjectListItem[];
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ProjectsTable({
  items,
  hasFilters,
  onClearFilters,
}: ProjectsTableProps) {
  return (
    <section aria-labelledby="projects-table-title">
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4 sm:px-6">
          <h2
            id="projects-table-title"
            className="text-lg font-semibold text-foreground"
          >
            Proyectos registrados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[70rem] border-collapse text-left">
            <caption className="sr-only">
              Listado de proyectos registrados y sus clientes asociados
            </caption>
            <thead className="bg-surface-subtle">
              <tr>
                {[
                  "Proyecto",
                  "Cliente",
                  "Documento",
                  "Ubicación",
                  "Estado",
                  "Actualización",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="border-b border-border-subtle px-5 py-3 text-xs font-semibold text-foreground-secondary"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    {hasFilters ? (
                      <SearchX
                        aria-hidden="true"
                        className="mx-auto text-muted"
                        size={28}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <FolderOpen
                        aria-hidden="true"
                        className="mx-auto text-muted"
                        size={28}
                        strokeWidth={1.5}
                      />
                    )}
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {hasFilters
                        ? "No encontramos proyectos"
                        : "No hay proyectos registrados"}
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                      {hasFilters
                        ? "Prueba con otros términos o limpia los filtros aplicados."
                        : "Los proyectos registrados en la plataforma aparecerán aquí."}
                    </p>
                    {hasFilters ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-5"
                        onClick={onClearFilters}
                      >
                        Limpiar filtros
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                items.map((project) => (
                  <tr key={project.id} className="bg-surface">
                    <td className="px-5 py-4 align-top">
                      <p className="text-xs font-semibold uppercase text-foreground-secondary">
                        {project.code}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {project.name}
                      </p>
                      {project.description ? (
                        <p className="mt-1 max-w-72 break-words text-sm text-foreground-secondary">
                          {project.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-foreground">
                        {project.client.legalName}
                      </p>
                      {project.client.tradeName ? (
                        <p className="mt-1 text-sm text-foreground-secondary">
                          {project.client.tradeName}
                        </p>
                      ) : null}
                      <Badge tone="brand" size="sm" className="mt-2">
                        {formatClientType(project.client.clientType)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-top text-sm">
                      {project.client.documentType ||
                      project.client.documentNumber ? (
                        <>
                          <p className="font-medium text-foreground">
                            {formatDocumentType(project.client.documentType)}
                          </p>
                          <p className="mt-1 text-foreground-secondary">
                            {formatValue(project.client.documentNumber)}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted">{EMPTY_VALUE}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      <span className="block max-w-52 break-words">
                        {formatValue(project.location)}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge
                        tone={project.isActive ? "success" : "neutral"}
                        size="sm"
                      >
                        {project.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      {formatDate(project.updatedAtUtc)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>
    </section>
  );
}
