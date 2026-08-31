import type { RequirementCommercialLine } from "@/features/prequotes/requirement-types";

export interface TechnicalSelectionSystemCatalogItem {
  id: string;
  code: string;
  displayName: string;
  name: string;
  technicalName: string | null;
  commercialName: string | null;
  commercialLine: string | null;
  functionalType: string | null;
  family: string | null;
  series: string | null;
  variant: string | null;
  isActive: boolean;
  isSelectable: boolean;
}

export interface TechnicalSelectionCatalogItem {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  isSelectable: boolean;
}

export interface TechnicalSelectionCatalog {
  commercialLine: RequirementCommercialLine;
  systems: TechnicalSelectionSystemCatalogItem[];
  glasses: TechnicalSelectionCatalogItem[];
  finishes: TechnicalSelectionCatalogItem[];
}
