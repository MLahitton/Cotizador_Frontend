export type CanonicalCatalogAliasCategory = "SYSTEM" | "FRAME" | "FINISH";

export type CanonicalCatalogAliasMatchPolicy =
  | "EXACT_NORMALIZED"
  | "TECHNICAL_PHRASE";

export interface CanonicalCatalogSystem {
  code: string;
  name: string;
  activeForRecognition: boolean;
  priceable: boolean;
  futurePriceable: boolean;
  requiresReview: boolean;
  isActive: boolean;
}

export interface CanonicalCatalogFrame {
  code: string;
  name: string;
  isActive: boolean;
}

export interface CanonicalCatalogFinish {
  code: string;
  name: string;
  requiresReview: boolean;
  isActive: boolean;
}

export interface CanonicalCatalogAlias {
  category: CanonicalCatalogAliasCategory;
  alias: string;
  normalizedAlias: string;
  canonicalCode: string;
  matchPolicy: CanonicalCatalogAliasMatchPolicy;
  requiresContext: boolean;
  confidence: number;
  isActive: boolean;
}

export interface GetCanonicalCatalogResponse {
  systems: CanonicalCatalogSystem[];
  frames: CanonicalCatalogFrame[];
  finishes: CanonicalCatalogFinish[];
  aliases: CanonicalCatalogAlias[];
}
