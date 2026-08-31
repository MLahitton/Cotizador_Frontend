import { getCanonicalCatalog } from "@/features/canonical-catalog/canonical-catalog-api";
import { getGlassTypesCatalog } from "@/features/glass-catalog/glass-catalog-api";
import type { RequirementCommercialLine } from "@/features/prequotes/requirement-types";
import type { TechnicalSelectionCatalog } from "@/features/prequotes/technical-selection-catalog-types";

function systemAllowedForLine(systemLine: string | null, requestedLine: RequirementCommercialLine): boolean {
  if (requestedLine === "ESSENTIAL" || requestedLine === "BIOCONFORT") return true;
  return systemLine?.trim().toUpperCase() === requestedLine;
}

export async function getTechnicalSelectionCatalog(
  commercialLine: RequirementCommercialLine,
): Promise<TechnicalSelectionCatalog> {
  const [canonical, glass] = await Promise.all([
    getCanonicalCatalog(),
    getGlassTypesCatalog(),
  ]);

  return {
    commercialLine,
    systems: canonical.systems
      .filter((item) => item.isActive && item.isSelectable && systemAllowedForLine(item.commercialLine, commercialLine))
      .map((item) => ({
        id: item.id,
        code: item.code,
        displayName: item.name,
        name: item.name,
        technicalName: item.technicalName,
        commercialName: item.commercialName,
        commercialLine: item.commercialLine,
        functionalType: item.functionalType,
        family: item.family,
        series: item.series,
        variant: item.variant,
        isActive: item.isActive,
        isSelectable: item.isSelectable,
      })),
    glasses: glass.items
      .filter((item) => item.isActive && item.isSelectable)
      .map((item) => ({
        id: item.glassTypeId,
        code: item.code,
        displayName: item.name,
        description: item.description,
        isActive: item.isActive,
        isSelectable: item.isSelectable,
      })),
    finishes: canonical.finishes
      .filter((item) => item.isActive && item.isSelectable)
      .map((item) => ({
        id: item.id,
        code: item.code,
        displayName: item.name,
        description: null,
        isActive: item.isActive,
        isSelectable: item.isSelectable,
      })),
  };
}
