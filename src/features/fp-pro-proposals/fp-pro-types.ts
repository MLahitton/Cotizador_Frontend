export interface FpProReport {
  orderId: string | null;
  description: string | null;
  revision: number | null;
  itemsDetected: number;
  aluminumWastePercent: number | null;
}

export interface FpProGlassPane {
  code: string;
  thicknessMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  quantity: number | null;
}

export interface FpProTechnicalProfile {
  code: string;
  description: string;
  totalLengthMeters: number | null;
  unitLengthMeters: number | null;
  quantity: number | null;
}

export interface FpProPreviewItem {
  itemNumber: string;
  typology: string | null;
  fpProProfiles: string[];
  inferredModuleCount: number | null;
  moduleConfidence: string | null;
  requiresManualModule: boolean;
  technicalProfiles: FpProTechnicalProfile[];
  widthMm: number | null;
  heightMm: number | null;
  widthM: number | null;
  heightM: number | null;
  quantity: number | null;
  nominalAreaM2: number | null;
  notes: string | null;
  glass: FpProGlassPane[];
  selectedThicknessMm: number | null;
  system: string | null;
  glassDescription: string | null;
  finish: string | null;
  lock: string | null;
  glassPrice: number | null;
  aluminumBase: number | null;
  aluminumBaseUnit: number | null;
  accessoriesBase: number | null;
  accessoriesBaseUnit: number | null;
  structureWeightKg: number | null;
  structureWeightKgUnit: number | null;
  image: { contentType: string; base64: string } | null;
  pendingFields: string[];
  warnings: Array<{ code: string; field: string | null; message: string }>;
}

export interface FpProPreview {
  report: FpProReport;
  items: FpProPreviewItem[];
  pendingFields: string[];
}

export interface FpProCatalogOption {
  label: string;
  value: string;
}

export interface FpProCatalogs {
  systems: FpProCatalogOption[];
  glassDescriptions: FpProCatalogOption[];
  finishes: FpProCatalogOption[];
  locations: FpProCatalogOption[];
}

export interface FpProItemDraft extends FpProPreviewItem {
  glassPrice: number | null;
  module: number | null;
  notes: string;
}

export interface GenerateFpProRequest {
  report: { order: string | null; description: string | null; location: string };
  proposalName: string;
  clientName: string;
  projectName: string;
  productionLine: string;
  preparedBy: string;
  budgetId: string;
  items: Array<{
    itemNumber: string;
    typology: string | null;
    widthM: number | null;
    heightM: number | null;
    quantity: number | null;
    system: string | null;
    glassDescription: string | null;
    finish: string | null;
    glassPrice: number | null;
    accessoriesBase: number | null;
    aluminumBase: number | null;
    selectedThicknessMm: number | null;
    structureWeightKg: number | null;
    module: number | null;
    notes: string | null;
    imageBase64: string | null;
  }>;
  aluminumWastePercent: number | null;
  benefitPercent: number | null;
  commissionPercent: number | null;
}

export interface GenerateValidationIssue {
  scope: "global" | "item";
  itemNumber?: string;
  field: string;
  message: string;
}

export interface GenerateValidationState {
  isReadyToGenerate: boolean;
  issues: GenerateValidationIssue[];
  completeItemCount: number;
}