"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUserListItem } from "@/features/admin/admin-types";

export function formatAdminDate(
  value: string | null,
): string {
  if (!value) {
    return "Nunca";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function adminUserFullName(
  user: Pick<
    AdminUserListItem,
    "firstName" | "lastName"
  >,
): string {
  return [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function dateStartUtc(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T00:00:00.000-05:00`,
  ).toISOString();
}

export function dateEndUtc(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(
    `${value}T23:59:59.999-05:00`,
  ).toISOString();
}

export function AdminPagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) {
    return (
      <div className="border-t border-border px-4 py-3 text-xs text-foreground-secondary sm:px-5">
        {totalCount}{" "}
        {totalCount === 1
          ? "resultado"
          : "resultados"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-foreground-secondary">
        Pagina {page} de {totalPages} -{" "}
        {totalCount} resultados
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            disabled || page <= 1
          }
          onClick={() =>
            onPageChange(page - 1)
          }
        >
          <ChevronLeft
            aria-hidden="true"
            size={15}
          />
          Anterior
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            disabled ||
            page >= totalPages
          }
          onClick={() =>
            onPageChange(page + 1)
          }
        >
          Siguiente
          <ChevronRight
            aria-hidden="true"
            size={15}
          />
        </Button>
      </div>
    </div>
  );
}