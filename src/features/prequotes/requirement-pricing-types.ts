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
}
