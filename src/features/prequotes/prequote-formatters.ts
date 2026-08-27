const EMPTY_VALUE = "-";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPreQuoteDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

export function formatPreQuoteIdentifier(value: string): string {
  const normalizedValue = value.trim();
  return normalizedValue.length > 12
    ? `${normalizedValue.slice(0, 8)}...${normalizedValue.slice(-4)}`
    : normalizedValue;
}

export function formatDocumentCount(count: number): string {
  if (count === 0) return "0 documentos";
  if (count === 1) return "1 documento";
  return `${count} documentos`;
}
