export function formatPublicProjectType(type: string | null | undefined, other: string | null | undefined): string {
  switch (type) {
    case "apto": return "Apartamento";
    case "edificio": return "Edificio / propiedad horizontal";
    case "casa": return "Casa en unidad residencial o parcelaci\u00f3n";
    case "hospedaje": return "Hospedaje / renta corta";
    case "comercial": return "Comercial, institucional o corporativo";
    case "otro": return other?.trim() || "Otro";
    default: return "Por definir";
  }
}

export function formatPublicInstallationWindow(window: string | null | undefined): string {
  switch (window) {
    case "lt2m": return "Menos de 2 meses";
    case "2-4m": return "2\u20134 meses";
    case "4-6m": return "4\u20136 meses";
    case "6-9m": return "6\u20139 meses";
    case "9-12m": return "9\u201312 meses";
    case "gt12m": return "M\u00e1s de 12 meses";
    case "nd": return "A\u00fan no est\u00e1 definido";
    default: return "Por definir";
  }
}
