import { SearchX, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientListItem } from "@/features/clients/clients-types";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatClientType(clientType: string): string {
  if (clientType === "Company") return "Empresa";
  if (clientType === "Person") return "Persona";
  return clientType;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : dateFormatter.format(date);
}

export interface ClientsTableProps {
  items: ClientListItem[];
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ClientsTable({
  items,
  hasFilters,
  onClearFilters,
}: ClientsTableProps) {
  return (
    <section aria-labelledby="clients-table-title">
      <Surface padding="none" className="overflow-hidden">
        <div className="border-b border-border-subtle px-5 py-4 sm:px-6">
          <h2
            id="clients-table-title"
            className="text-lg font-semibold text-foreground"
          >
            Clientes registrados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <caption className="sr-only">
              Listado de clientes registrados en la plataforma
            </caption>
            <thead className="bg-surface-subtle">
              <tr>
                {[
                  "Cliente",
                  "Documento",
                  "Contacto",
                  "Ciudad",
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
                      <Users
                        aria-hidden="true"
                        className="mx-auto text-muted"
                        size={28}
                        strokeWidth={1.5}
                      />
                    )}
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {hasFilters
                        ? "No se encontraron clientes"
                        : "No hay clientes registrados"}
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
                      {hasFilters
                        ? "Prueba con otro término de búsqueda o cambia el filtro de estado."
                        : "Los clientes aparecerán aquí cuando se registren en la plataforma."}
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
                items.map((client) => (
                  <tr key={client.id} className="bg-surface">
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-foreground">
                        {client.legalName}
                      </p>
                      {client.tradeName ? (
                        <p className="mt-1 text-sm text-foreground-secondary">
                          {client.tradeName}
                        </p>
                      ) : null}
                      <Badge tone="brand" size="sm" className="mt-2">
                        {formatClientType(client.clientType)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-top text-sm">
                      {client.documentType || client.documentNumber ? (
                        <>
                          {client.documentType ? (
                            <p className="font-medium text-foreground">
                              {client.documentType}
                            </p>
                          ) : null}
                          {client.documentNumber ? (
                            <p className="mt-1 text-foreground-secondary">
                              {client.documentNumber}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted">Sin documento</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-sm">
                      {client.email || client.phone ? (
                        <>
                          {client.email ? (
                            <p className="max-w-64 break-all text-foreground">
                              {client.email}
                            </p>
                          ) : null}
                          {client.phone ? (
                            <p className="mt-1 text-foreground-secondary">
                              {client.phone}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted">Sin contacto</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      {client.city || "Sin ciudad"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge
                        tone={client.isActive ? "success" : "neutral"}
                        size="sm"
                      >
                        {client.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-foreground-secondary">
                      {formatDate(client.updatedAtUtc)}
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
