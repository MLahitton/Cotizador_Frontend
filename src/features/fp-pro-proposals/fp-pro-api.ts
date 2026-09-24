import { apiDownload, apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";
import type { FpProCatalogOption, FpProCatalogs, FpProPreview, GenerateFpProRequest } from "./fp-pro-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullable(value: unknown, kind: "string" | "number"): boolean {
  return value === null || typeof value === kind;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isCatalogOption(value: unknown): value is FpProCatalogOption {
  return isRecord(value) && typeof value.label === "string" && typeof value.value === "string";
}

function isCatalogOptionArray(value: unknown): value is FpProCatalogOption[] {
  return Array.isArray(value) && value.every(isCatalogOption);
}

function isGlassPane(value: unknown): boolean {
  return isRecord(value) && typeof value.code === "string" &&
    (value.treatment === undefined || nullable(value.treatment, "string")) &&
    [value.thicknessMm, value.widthMm, value.heightMm, value.quantity].every((entry) => nullable(entry, "number"));
}

function isWarning(value: unknown): boolean {
  return isRecord(value) && typeof value.code === "string" && nullable(value.field, "string") && typeof value.message === "string";
}

function isTechnicalProfile(value: unknown): boolean {
  return isRecord(value) && typeof value.code === "string" && typeof value.description === "string" &&
    [value.totalLengthMeters, value.unitLengthMeters, value.quantity].every((entry) => nullable(entry, "number"));
}

function isPreview(value: unknown): value is FpProPreview {
  if (!isRecord(value) || !isRecord(value.report) || !Array.isArray(value.items) || !isStringArray(value.pendingFields)) return false;
  const report = value.report;
  if (!nullable(report.orderId, "string") || !nullable(report.description, "string") ||
    !nullable(report.revision, "number") || typeof report.itemsDetected !== "number" ||
    !nullable(report.structureCount, "number") ||
    !nullable(report.aluminumWastePercent, "number") ||
    !nullable(report.profileBarCount, "number") ||
    !nullable(report.doorCount, "number")) return false;

  return value.items.every((item) => {
    if (!isRecord(item) || typeof item.itemNumber !== "string" || !isStringArray(item.fpProProfiles) ||
        !Array.isArray(item.glass) || !item.glass.every(isGlassPane) || !isStringArray(item.pendingFields) ||
        !Array.isArray(item.warnings) || !item.warnings.every(isWarning) ||
        typeof item.requiresManualModule !== "boolean" || !Array.isArray(item.technicalProfiles) ||
        !item.technicalProfiles.every(isTechnicalProfile)) return false;
    const nullableStrings = [item.typology, item.notes, item.system, item.glassDescription, item.finish, item.lock, item.moduleConfidence];
    const nullableNumbers = [item.widthMm, item.heightMm, item.widthM, item.heightM, item.quantity,
      item.nominalAreaM2, item.selectedThicknessMm, item.glassPrice, item.aluminumBase, item.inferredModuleCount,
      item.aluminumBaseUnit, item.accessoriesBase, item.accessoriesBaseUnit,
      item.structureWeightKg, item.structureWeightKgUnit];
    return nullableStrings.every((entry) => nullable(entry, "string")) &&
      nullableNumbers.every((entry) => nullable(entry, "number")) &&
      (item.image === null || (isRecord(item.image) && typeof item.image.contentType === "string" && typeof item.image.base64 === "string"));
  });
}

export async function previewFpPro(file: File): Promise<FpProPreview> {
  const form = new FormData();
  form.append("file", file);
  const response = await apiRequest("/api/proposals/fp-pro/preview", {
    method: "POST",
    authenticated: true,
    body: form,
  });
  if (!isPreview(response)) {
    throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El servidor no devolvió un preview FP Pro válido." });
  }
  return response;
}

export async function getFpProCatalogs(): Promise<FpProCatalogs> {
  const response = await apiRequest("/api/proposals/fp-pro/catalogs", { authenticated: true });
  if (!isRecord(response) || !isCatalogOptionArray(response.systems) || !isCatalogOptionArray(response.glassDescriptions) ||
      !isCatalogOptionArray(response.finishes) || !isCatalogOptionArray(response.locations)) {
    throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El servidor no devolvió catálogos FP Pro válidos." });
  }
  return {
    systems: response.systems,
    glassDescriptions: response.glassDescriptions,
    finishes: response.finishes,
    locations: response.locations,
  };
}

export async function generateFpPro(request: GenerateFpProRequest) {
  return apiDownload("/api/proposals/fp-pro/generate", request);
}
