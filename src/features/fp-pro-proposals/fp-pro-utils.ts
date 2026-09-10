import { ApiError } from "@/lib/http/api-error";
import type { FpProCatalogOption, FpProCatalogs, FpProItemDraft, FpProPreview, GenerateFpProRequest, GenerateValidationIssue, GenerateValidationState } from "./fp-pro-types";

export const MAX_FP_PRO_FILE_BYTES = 20 * 1024 * 1024;
export const SYSTEM_FAMILY_ORDER = ["SIENA", "FERMO", "LAGO", "MONZA", "NAPOLES", "MONACO", "OTROS"] as const;

export function validateFpProFile(file: File | null): string | null {
  if (!file) return "Selecciona un reporte FP Pro en formato PDF.";
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) return "El archivo debe ser un PDF.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_FP_PRO_FILE_BYTES) return "El PDF supera el máximo permitido de 20 MiB.";
  return null;
}

export function createItemDrafts(preview: FpProPreview): FpProItemDraft[] {
  return preview.items.map((item) => ({
    ...item,
    module: item.requiresManualModule || item.inferredModuleCount === null ? null : item.inferredModuleCount,
    notes: item.notes ?? "",
  }));
}

export function normalizeCatalogSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("es");
}

export function catalogMatchesSearch(option: FpProCatalogOption, search: string): boolean {
  const normalizedSearch = normalizeCatalogSearchText(search);
  return !normalizedSearch || normalizeCatalogSearchText(option.label).includes(normalizedSearch);
}

export function getSystemFamily(label: string): string {
  const normalized = normalizeCatalogSearchText(label);
  for (const family of SYSTEM_FAMILY_ORDER) {
    if (family !== "OTROS" && normalized.includes(family)) return family;
  }
  return "OTROS";
}

export function groupSystemOptions(options: FpProCatalogOption[], search: string): Array<{ family: string; options: FpProCatalogOption[] }> {
  const groups = new Map<string, FpProCatalogOption[]>();
  for (const option of options) {
    if (!catalogMatchesSearch(option, search)) continue;
    const family = getSystemFamily(option.label);
    groups.set(family, [...(groups.get(family) ?? []), option]);
  }
  return Array.from(groups.entries())
    .map(([family, entries]) => ({ family, options: entries }))
    .sort((left, right) => familySortIndex(left.family) - familySortIndex(right.family) || left.family.localeCompare(right.family, "es"));
}

function familySortIndex(family: string): number {
  const index = SYSTEM_FAMILY_ORDER.indexOf(family as (typeof SYSTEM_FAMILY_ORDER)[number]);
  return index === -1 ? SYSTEM_FAMILY_ORDER.length - 1 : index;
}

export function parseCurrencyCOP(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/\$/g, "").replace(/\s+/g, "");
  if (/^\d+$/.test(cleaned)) return Number(cleaned);

  // En precios COP aceptamos separadores de miles tanto colombianos como
  // provenientes de hojas de cálculo: 74.000 y 74,000 representan 74000.
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    const parsedThousands = Number(cleaned.replace(/[.,]/g, ""));
    return Number.isFinite(parsedThousands) ? parsedThousands : null;
  }

  // También se admiten decimales explícitos de uno o dos dígitos.
  if (!/^\d+[.,]\d{1,2}$/.test(cleaned)) return null;
  const normalized = cleaned.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrencyCOP(value: number | null): string {
  return value === null ? "" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(value);
}

export function itemMissingFields(item: FpProItemDraft): string[] {
  const missing: string[] = [];
  if (!item.system?.trim()) missing.push("system");
  if (!item.glassDescription?.trim()) missing.push("glassDescription");
  if (!item.finish?.trim()) missing.push("finish");
  if (item.glassPrice === null || item.glassPrice <= 0) missing.push("glassPrice");
  if (item.module === null || item.module <= 0) missing.push("module");
  if (item.widthM === null || item.widthM <= 0) missing.push("widthM");
  if (item.heightM === null || item.heightM <= 0) missing.push("heightM");
  if (item.quantity === null || item.quantity <= 0) missing.push("quantity");
  if (!item.image?.base64) missing.push("image");
  if (item.selectedThicknessMm === null || item.selectedThicknessMm <= 0) missing.push("selectedThicknessMm");
  if (item.structureWeightKg === null || item.structureWeightKg <= 0) missing.push("structureWeightKg");
  if (item.accessoriesBase === null || item.accessoriesBase < 0) missing.push("accessoriesBase");
  if (item.aluminumBase === null || item.aluminumBase < 0) missing.push("aluminumBase");
  return missing;
}

function validPercent(value: number | null): boolean {
  return value !== null && value >= 0 && value <= 1000;
}

function containsCatalogValue(options: FpProCatalogOption[], value: string): boolean {
  return options.some((option) => option.value === value);
}

export function getGenerateValidationState({ preview, items, catalogs, catalogsLoading, catalogsError, location, globalFinish, clientName, projectName, productionLine, preparedBy, budgetId, proposalName, aluminumWastePercent, benefitPercent, commissionPercent }: {
  preview: FpProPreview | null;
  items: FpProItemDraft[];
  catalogs: FpProCatalogs | null;
  catalogsLoading: boolean;
  catalogsError: string | null;
  location: string;
  globalFinish: string;
  clientName: string;
  projectName: string;
  productionLine: string;
  preparedBy: string;
  budgetId: string;
  proposalName: string;
  aluminumWastePercent: number | null;
  benefitPercent: number | null;
  commissionPercent: number | null;
}): GenerateValidationState {
  const issues: GenerateValidationIssue[] = [];
  if (!preview) issues.push({ scope: "global", field: "preview", message: "Procesa un reporte FP Pro." });
  if (catalogsLoading) issues.push({ scope: "global", field: "catalogs", message: "Espera mientras cargan los catálogos." });
  else if (catalogsError || !catalogs) issues.push({ scope: "global", field: "catalogs", message: "Carga los catálogos FP Pro para validar la propuesta." });
  if (!location) issues.push({ scope: "global", field: "location", message: "Selecciona una ubicación." });
  else if (catalogs && !containsCatalogValue(catalogs.locations, location)) issues.push({ scope: "global", field: "location", message: "Selecciona una ubicación válida." });
  if (!globalFinish) issues.push({ scope: "global", field: "globalFinish", message: "Selecciona un acabado global." });
  else if (catalogs && !containsCatalogValue(catalogs.finishes, globalFinish)) issues.push({ scope: "global", field: "globalFinish", message: "Selecciona un acabado global válido." });
    if (!clientName.trim()) issues.push({ scope: "global", field: "clientName", message: "Ingresa el cliente." });
  if (!projectName.trim()) issues.push({ scope: "global", field: "projectName", message: "Ingresa el proyecto." });
  if (!productionLine.trim()) issues.push({ scope: "global", field: "productionLine", message: "Ingresa la línea de producción." });
  if (!preparedBy.trim()) issues.push({ scope: "global", field: "preparedBy", message: "Ingresa quién elaboró la propuesta." });
  if (!budgetId.trim()) issues.push({ scope: "global", field: "budgetId", message: "Ingresa el ID Presupuesto." });
  if (!proposalName.trim()) issues.push({ scope: "global", field: "proposalName", message: "Ingresa el nombre de la propuesta." });
  if (!validPercent(aluminumWastePercent)) issues.push({ scope: "global", field: "aluminumWastePercent", message: "Ingresa un desperdicio de aluminio entre 0 y 1000 %." });
  if (!validPercent(benefitPercent)) issues.push({ scope: "global", field: "benefitPercent", message: "Ingresa un beneficio entre 0 y 1000 %." });
  if (!validPercent(commissionPercent)) issues.push({ scope: "global", field: "commissionPercent", message: "Ingresa una comisión entre 0 y 1000 %." });

  const labels: Record<string, string> = {
    system: "selecciona un sistema", glassDescription: "selecciona un cristal", finish: "selecciona un acabado",
    glassPrice: "ingresa el precio de cristal", module: "falta módulo", widthM: "falta el ancho", heightM: "falta el alto",
    quantity: "falta la cantidad", image: "falta la imagen", selectedThicknessMm: "falta el espesor",
    structureWeightKg: "falta el peso de estructura", accessoriesBase: "falta el costo ACCE", aluminumBase: "falta el costo de aluminio",
  };
  for (const item of items) {
    const missing = itemMissingFields(item);
    for (const field of missing) issues.push({ scope: "item", itemNumber: item.itemNumber, field, message: `Item ${item.itemNumber}: ${labels[field]}.` });
    if (catalogs && item.system && !containsCatalogValue(catalogs.systems, item.system)) issues.push({ scope: "item", itemNumber: item.itemNumber, field: "system", message: `Item ${item.itemNumber}: selecciona un sistema válido.` });
    if (catalogs && item.glassDescription && !containsCatalogValue(catalogs.glassDescriptions, item.glassDescription)) issues.push({ scope: "item", itemNumber: item.itemNumber, field: "glassDescription", message: `Item ${item.itemNumber}: selecciona un cristal válido.` });
    if (catalogs && item.finish && !containsCatalogValue(catalogs.finishes, item.finish)) issues.push({ scope: "item", itemNumber: item.itemNumber, field: "finish", message: `Item ${item.itemNumber}: selecciona un acabado válido.` });
  }
  if (items.length === 0 && preview) issues.push({ scope: "global", field: "items", message: "El reporte debe contener al menos un item." });
  const itemsWithIssues = new Set(issues.filter((issue) => issue.scope === "item").map((issue) => issue.itemNumber));
  return { issues, isReadyToGenerate: issues.length === 0, completeItemCount: items.filter((item) => !itemsWithIssues.has(item.itemNumber)).length };
}

export function buildGenerateRequest(preview: FpProPreview, items: FpProItemDraft[], location: string, proposalName: string, clientName: string, projectName: string, productionLine: string, preparedBy: string, budgetId: string, aluminumWastePercent: number | null, benefitPercent: number | null, commissionPercent: number | null): GenerateFpProRequest {
  return {
    report: { order: preview.report.orderId, description: preview.report.description, location },
    proposalName: proposalName.trim(),
    clientName: clientName.trim(),
    projectName: projectName.trim(),
    productionLine: productionLine.trim(),
    preparedBy: preparedBy.trim(),
    budgetId: budgetId.trim(),
    aluminumWastePercent,
    benefitPercent,
    commissionPercent,
    items: items.map((item) => ({
      itemNumber: item.itemNumber, typology: item.typology, widthM: item.widthM, heightM: item.heightM,
      quantity: item.quantity, system: item.system, glassDescription: item.glassDescription,
      finish: item.finish, glassPrice: item.glassPrice, accessoriesBase: item.accessoriesBase,
      aluminumBase: item.aluminumBase, selectedThicknessMm: item.selectedThicknessMm,
      structureWeightKg: item.structureWeightKg, module: item.module, notes: item.notes || null,
      imageBase64: item.image?.base64 ?? null,
    })),
  };
}

export function fpProErrorMessage(error: unknown, operation: "preview" | "generate"): string {
  if (!(error instanceof ApiError)) return operation === "preview" ? "No fue posible procesar el reporte." : "No fue posible generar el Excel.";
  const code = error.problemDetails?.errorCode ?? error.problemDetails?.code;
  const messages: Record<string, string> = {
    FP_PRO_PREVIEW_UNSUPPORTED_FILE_TYPE: "El archivo debe ser un reporte FP Pro en PDF.",
    FP_PRO_PREVIEW_EMPTY_FILE: "El archivo está vacío.",
    FP_PRO_PREVIEW_FILE_TOO_LARGE: "El PDF supera el tamaño máximo permitido.",
    FP_PRO_PREVIEW_INVALID_REPORT: "El PDF no parece ser un reporte FP Pro interpretable.",
    FP_PRO_GENERATE_UNSUPPORTED_ITEM_COUNT: "La plantilla no tiene capacidad para esta cantidad de ítems.",
    FP_PRO_GENERATE_UNKNOWN_CATALOG_VALUE: "Uno de los valores de ubicación, sistema, cristal o acabado no existe en el catálogo.",
    FP_PRO_GENERATE_INVALID_REQUEST: "Aún faltan datos definitivos requeridos para generar el Excel.",
  };
  return typeof code === "string" && messages[code] ? messages[code] : error.detail;
}

export function filenameFromDisposition(disposition: string | null): string {
  if (!disposition) return "propuesta-fp-pro.xlsx";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { return "propuesta-fp-pro.xlsx"; }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "propuesta-fp-pro.xlsx";
}