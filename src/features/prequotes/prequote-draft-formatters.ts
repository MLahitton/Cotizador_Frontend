import type { PreQuoteDraftStatus } from "@/features/prequotes/prequote-draft-types";

const EMPTY_VALUE = "-";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

export function formatPreQuoteDraftStatus(
  status: PreQuoteDraftStatus,
): string {
  switch (status) {
    case "PENDING_REVIEW":
      return "Pendiente de revisión";
    case "IN_REVIEW":
      return "En revisión";
    case "APPROVED":
      return "Aprobado";
  }
}

export function formatPreQuoteDraftDateTime(value: string | null): string {
  if (!value) {
    return EMPTY_VALUE;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

export function formatPreQuoteDraftNumber(value: number | null): string {
  return value === null ? EMPTY_VALUE : numberFormatter.format(value);
}

export function formatPreQuoteDraftArea(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${numberFormatter.format(value)} m²`;
}

export function formatPreQuoteDraftMoney(
  amount: number | null,
  currency: string | null,
): string {
  if (amount === null || !currency) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEconomicCompleteness(value: boolean): string {
  return value ? "Valoración completa" : "Valoración incompleta";
}

export function formatNullableDraftText(value: string | null): string {
  return value && value.trim().length > 0 ? value : EMPTY_VALUE;
}
