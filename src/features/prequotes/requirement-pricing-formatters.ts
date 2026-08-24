export function formatRequirementMoney(value: number | null, currency: string): string {
  if (value === null) return "No disponible";
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
    AREA_MISSING: "Falta el area para calcular precio.",
    QUANTITY_MISSING: "Falta la cantidad para calcular precio.",
    SUGGESTED_SYSTEM_MISSING: "Falta definir el sistema sugerido.",
    SUGGESTED_GLASS_MISSING: "Falta definir el vidrio sugerido.",
    SUGGESTED_FINISH_MISSING: "Falta definir el acabado.",
    TECHNICAL_PROPOSAL_ITEM_NOT_PRICEABLE: "La configuracion tecnica aun no esta completa.",
  };
  return messages[code] ?? "Este elemento tiene informacion pendiente para la estimacion.";
}
