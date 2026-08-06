export type GlassPriceRangeStatus = "PRELIMINARY" | "ACTIVE" | "RETIRED";

export interface GlassPriceRange {
  glassPriceRangeVersionId: string;
  version: number;
  minimumPricePerSquareMeter: number;
  expectedAmountPerM2: number;
  maximumPricePerSquareMeter: number;
  currency: string;
  status: GlassPriceRangeStatus;
  validFromUtc: string;
  validToUtc: string | null;
}

export interface GlassCatalogItem {
  glassTypeId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  currentPriceRange: GlassPriceRange | null;
}

export interface GetGlassTypesCatalogResponse {
  items: GlassCatalogItem[];
}
