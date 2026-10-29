const blockerMessages: Record<string, string> = {
  EXPERIENCE_PREFERENCES_INCOMPLETE: "Completa las cinco prioridades del elemento para resolver sistema y vidrio.",
  NO_INCLUDED_ITEMS: "Incluye al menos un elemento antes de confirmar.",
  QUANTITY_REQUIRED: "Hay elementos con cantidad pendiente.",
  WIDTH_REQUIRED: "Hay elementos con ancho pendiente.",
  HEIGHT_REQUIRED: "Hay elementos con altura pendiente.",
  SYSTEM_REQUIRED: "Hay elementos cuya solución de sistema está pendiente.",
  GLASS_REQUIRED: "Hay elementos cuyo vidrio está pendiente de definición.",
  FINISH_REQUIRED: "El acabado está pendiente de definición.",
  FINISH_PENDING_EXTERNAL_SOURCE: "El acabado depende de información aún pendiente.",
  SYSTEM_STALE: "Revisa la selección anterior de sistema: ya no es compatible.",
  GLASS_STALE: "Revisa la selección anterior de vidrio: ya no es compatible.",
  SYSTEM_BLOCKED: "La solución de sistema requiere revisión antes de confirmar.",
  GLASS_BLOCKED: "La solución de vidrio requiere revisión antes de confirmar.",
  LEVEL2_OVERRIDE_STALE: "Una selección anterior ya no es compatible con la configuración actual.",
  SYSTEM_NO_COMPATIBLE_CANDIDATE: "No hay un sistema compatible disponible para esta configuración.",
  GLASS_NO_COMPATIBLE_CANDIDATE: "No hay un vidrio compatible disponible para esta configuración.",
};

export function configurationBlockerMessage(code: string): string {
  // Constraint codes include a catalog-defined identifier, not a fixed enum.
  if (code.startsWith("SYSTEM_CONSTRAINT_")) {
    return "El sistema no cumple una condición técnica y requiere revisión.";
  }
  return blockerMessages[code] ?? "Hay información pendiente de revisar antes de confirmar.";
}

export function isActionableConfigurationBlocker(code: string): boolean {
  return ["EXPERIENCE_PREFERENCES_INCOMPLETE", "QUANTITY_REQUIRED", "WIDTH_REQUIRED", "HEIGHT_REQUIRED", "SYSTEM_REQUIRED",
    "SYSTEM_STALE", "GLASS_STALE", "LEVEL2_OVERRIDE_STALE"].includes(code);
}
