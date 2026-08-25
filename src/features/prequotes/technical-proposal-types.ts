export interface TechnicalProposalSystemOption {
  id: string;
  code: string;
  displayName: string;
  technicalName: string | null;
  commercialName: string | null;
  functionalType: string | null;
  family: string | null;
  series: string | null;
  commercialLine: string | null;
  variant: string | null;
}

export interface TechnicalProposalGlassOption {
  id: string;
  code: string;
  displayName: string;
  family: string | null;
  composition: string | null;
  treatment: string | null;
  outerThicknessMm: number | null;
  innerThicknessMm: number | null;
  pvbThicknessMm: number | null;
  pvbType: string | null;
  pvbColor: string | null;
  chamberThicknessMm: number | null;
  productLine: string | null;
  productToken: string | null;
  pattern: string | null;
  color: string | null;
}

export interface TechnicalProposalFinishOption {
  id: string;
  code: string;
  displayName: string;
  normalizedType: string | null;
  color: string | null;
  texture: string | null;
  process: string | null;
  commercialCode: string | null;
  material: string | null;
}

export interface TechnicalProposalAlternative<T> {
  option: T;
  rank: number;
  confidence: number;
  reasons: string[];
}

export type HistoricalEvidenceStatus = "AVAILABLE" | "NO_COMPARABLES" | "SIMILARITY_UNAVAILABLE";

export interface TechnicalProposalHistoricalExample {
  candidateId: string;
  quoteId: string;
  historicalReference: string | null;
  similarityScore: number;
  matchedFeatures: string[];
  differences: string[];
  technicalExplanation: string;
}

export interface TechnicalProposalEvidence {
  pageNumber: number | null;
  sourceType: string;
  text: string;
  sheetName: string | null;
  cellRange: string | null;
  sourceId: string | null;
  sourceFileName: string | null;
  contextLabel: string | null;
  confidence: number | null;
  status: string;
}

export interface TechnicalProposalItem {
  itemId: string;
  extractedItemId: string;
  elementId: string | null;
  sequence: number;
  reference: string | null;
  description: string;
  elementType: string;
  quantity: number | null;
  widthMm: number | null;
  heightMm: number | null;
  areaM2: number | null;
  extractionConfidence: number | null;
  extractionStatus: string;
  suggested: {
    system: TechnicalProposalSystemOption | null;
    glass: TechnicalProposalGlassOption | null;
    finish: TechnicalProposalFinishOption | null;
  };
  selected: {
    system: TechnicalProposalSystemOption | null;
    glass: TechnicalProposalGlassOption | null;
    finish: TechnicalProposalFinishOption | null;
    selectedAtUtc: string;
    selectedByUserId: string;
  } | null;
  selectionState: "UNCONFIRMED" | "CONFIRMED_AS_SUGGESTED" | "MODIFIED";
  alternatives: {
    systems: TechnicalProposalAlternative<TechnicalProposalSystemOption>[];
    glass: TechnicalProposalAlternative<TechnicalProposalGlassOption>[];
    finishes: TechnicalProposalAlternative<TechnicalProposalFinishOption>[];
  };
  confidence: { overall: number; system: number; glass: number; finish: number };
  requiresReview: boolean;
  reviewReasons: string[];
  systemResolutionReasons: string[];
  glassResolutionReasons: string[];
  finishResolutionReasons: string[];
  isTechnicallyComplete: boolean;
  isPriceable: boolean;
  historicalEvidence: {
    status: string;
    supportCount: number;
    bestSimilarity: number | null;
    averageSimilarity: number | null;
    examples: TechnicalProposalHistoricalExample[];
  };
  trace: {
    requestedSystemRaw: string | null;
    requestedProfileRaw: string | null;
    functionalType: string | null;
    operation: string | null;
    glassRawSpecification: string | null;
    glassTypeRaw: string | null;
    glassTypeNormalized: string | null;
    glassThicknessMm: number | null;
    finishRawDescription: string | null;
    finishNormalizedType: string | null;
    finishColorRaw: string | null;
    finishColorNormalized: string | null;
    specialFeatures: string[];
    geometryType: string | null;
  };
  evidence: TechnicalProposalEvidence[];
}

export interface TechnicalProposal {
  requirementId: string;
  technicalProposalId: string;
  processingAttemptId: string;
  extractionResultId: string;
  status: string;
  commercialLine: import("@/features/prequotes/requirement-types").RequirementCommercialLine | null;
  createdAtUtc: string;
  itemCount: number;
  itemsRequiringReview: number;
  technicallyCompleteItems: number;
  priceableItems: number;
  items: TechnicalProposalItem[];
}
