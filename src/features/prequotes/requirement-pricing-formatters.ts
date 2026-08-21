export function formatRequirementMoney(value: number | null, currency: string): string {
  if (value === null) return "—";
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)}`;
  }
}

export function formatPricingWarning(code: string): string {
  const messages: Record<string, string> = {
    SUGGESTED_FINISH_MISSING: "Falta definir el acabado.",
    TECHNICAL_PROPOSAL_ITEM_NOT_PRICEABLE: "La configuración técnica aún no está completa.",
  };
  return messages[code] ?? "Este elemento tiene información pendiente para la estimación.";
}
