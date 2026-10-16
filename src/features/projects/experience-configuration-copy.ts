const blockerMessages: Record<string, string> = {
  EXPERIENCE_PREFERENCES_INCOMPLETE: "Completa las cinco prioridades del elemento para resolver sistema y vidrio.",
  NO_INCLUDED_ITEMS: "Incluye al menos un elemento antes de confirmar.",
  QUANTITY_REQUIRED: "Hay elementos con cantidad pendiente.",
  WIDTH_REQUIRED: "Hay elementos con ancho pendiente.",
  HEIGHT_REQUIRED: "Hay elementos con altura pendiente.",
  SYSTEM_REQUIRED: "Hay elementos cuya solucion de sistema esta pendiente.",
  GLASS_REQUIRED: "Hay elementos cuyo vidrio esta pendiente de definicion.",
  FINISH_REQUIRED: "El acabado esta pendiente de definicion.",
  FINISH_PENDING_EXTERNAL_SOURCE: "El acabado depende de informacion aun pendiente.",
  SYSTEM_STALE: "Revisa la seleccion anterior de sistema: ya no es compatible.",
  GLASS_STALE: "Revisa la seleccion anterior de vidrio: ya no es compatible.",
  SYSTEM_BLOCKED: "La solucion de sistema requiere revision antes de confirmar.",
  GLASS_BLOCKED: "La solucion de vidrio requiere revision antes de confirmar.",
  LEVEL2_OVERRIDE_STALE: "Una seleccion anterior ya no es compatible con la configuracion actual.",
  SYSTEM_NO_COMPATIBLE_CANDIDATE: "No hay un sistema compatible disponible para esta configuracion.",
  GLASS_NO_COMPATIBLE_CANDIDATE: "No hay un vidrio compatible disponible para esta configuracion.",
};

export function configurationBlockerMessage(code: string): string {
  // Constraint codes include a catalog-defined identifier, not a fixed enum.
  if (code.startsWith("SYSTEM_CONSTRAINT_")) {
    return "El sistema no cumple una condicion tecnica y requiere revision.";
  }
  return blockerMessages[code] ?? "Hay informacion pendiente antes de confirmar.";
}

export function isActionableConfigurationBlocker(code: string): boolean {
  return ["EXPERIENCE_PREFERENCES_INCOMPLETE", "QUANTITY_REQUIRED", "WIDTH_REQUIRED", "HEIGHT_REQUIRED", "SYSTEM_REQUIRED",
    "SYSTEM_STALE", "GLASS_STALE", "LEVEL2_OVERRIDE_STALE"].includes(code);
}
