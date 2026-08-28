export interface RequirementPricingRange {
  minimum: number | null;
  expected: number | null;
  maximum: number | null;
}

export interface RequirementPricingComparable {
  candidateId: string;
  historicalReference: string | null;
  publicUnitPrice: number;
  projectedPrice: number;
  backendScore: number;
  ai2Similarity: number | null;
  similarityLevel: string | null;
  finalWeight: number;
}

export interface RequirementPricingItem {
  proposalItemId: string;
  extractedItemId: string;
  elementId: string | null;
  sequence: number;
  reference: string | null;
  description: string;
  status: string;
  configurationSource: "SUGGESTED" | "SELECTED";
  quantity: number | null;
  pricingAreaM2: number | null;
  unit: RequirementPricingRange;
  line: RequirementPricingRange;
  confidenceScore: number | null;
  confidenceLevel: string | null;
  requiresReview: boolean;
  mappingWarnings: string[];
  assumptions: string[];
  missingData: string[];
  comparables: RequirementPricingComparable[];
  originalUnit: RequirementPricingRange | null;
  currentUnit: RequirementPricingRange | null;
  deltaUnit: RequirementPricingRange | null;
  originalLine: RequirementPricingRange | null;
  currentLine: RequirementPricingRange | null;
  deltaLine: RequirementPricingRange | null;
  priceSource: string | null;
  repriceAttemptState: string | null;
  repriceAttemptReason: string | null;
}

export interface RequirementPricing {
  requirementId: string;
  technicalProposalId: string;
  currency: string;
  pricingBasis: string;
  itemCount: number;
  pricedItemCount: number;
  notPriceableItemCount: number;
  itemsRequiringReview: number;
  estimatedSubtotal: RequirementPricingRange;
  isCompleteTotal: boolean;
  requiresReview: boolean;
  assumptions: string[];
  missingData: string[];
  items: RequirementPricingItem[];
  originalGrandTotal: number | null;
  currentGrandTotal: number | null;
  deltaGrandTotal: number | null;
}

export interface RepriceRequirementPricingItemRequest {
  systemId?: string | null;
  glassTypeId?: string | null;
  finishTypeId?: string | null;
  quantity?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
}

export interface RepriceRequirementPricingItemResponse {
  requirementId: string;
  technicalProposalId: string;
  technicalProposalItemId: string;
  configuration: {
    systemId: string | null;
    glassTypeId: string | null;
    finishTypeId: string | null;
  };
  pricing: {
    originalUnitPrice: number | null;
    currentUnitPrice: number | null;
    deltaUnitPrice: number | null;
    originalLineTotal: number | null;
    currentLineTotal: number | null;
    deltaLineTotal: number | null;
    state: string;
    priceSource: string | null;
    repriceAttemptState: string | null;
    repriceAttemptReason: string | null;
  };
  summary: {
    originalGrandTotal: number | null;
    currentGrandTotal: number | null;
    deltaGrandTotal: number | null;
  };
  comparables: RequirementPricingComparable[];
}
