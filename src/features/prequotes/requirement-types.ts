export type RequirementStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "CANCELLED"
  | "SUPERSEDED";

export type RequirementCommercialLine =
  | "CLASSIC"
  | "ESSENTIAL"
  | "BIOCONFORT"
  | "SIGNATURE";

export interface CreatedRequirement {
  requirementId: string;
  preQuoteId: string;
  fileCount: number;
  commercialLine: RequirementCommercialLine;
  status: RequirementStatus;
  canEditDocuments: boolean;
  canCancel: boolean;
  canReplace: boolean;
  isCurrent: boolean;
  supersedesRequirementId: string | null;
  supersededByRequirementId: string | null;
  createdAtUtc: string;
  documents: RequirementDocument[];
}

export interface RequirementDocument {
  requirementFileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAtUtc: string;
}

export interface RequirementLifecycleCapabilities {
  canEditDocuments: boolean;
  canCancel: boolean;
  canReplace: boolean;
  isCurrent: boolean;
}

export interface RequirementDetails extends RequirementLifecycleCapabilities {
  requirementId: string;
  preQuoteId: string;
  status: RequirementStatus;
  commercialLine: RequirementCommercialLine | null;
  supersedesRequirementId: string | null;
  supersededByRequirementId: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  documents: RequirementDocument[];
}

export interface RequirementLifecycleResponse extends RequirementLifecycleCapabilities {
  requirementId: string;
  preQuoteId: string;
  fileCount: number;
  commercialLine: RequirementCommercialLine | null;
  status: RequirementStatus;
  supersedesRequirementId: string | null;
  supersededByRequirementId: string | null;
  updatedAtUtc: string;
  documents: RequirementDocument[];
}

export type RequirementProcessingState = "Pending" | "Processing" | "Finished";
export type RequirementProcessingOutcome = "Completed" | "RequiresReview" | "Failed" | "Cancelled";

export interface RequirementProcessingSummary {
  itemCount: number;
  itemsRequiringReview: number;
  issueCount: number;
  conflictCount: number;
  processingMethod: string;
  durationMs: number;
}

export interface ProcessedRequirement {
  requirementId: string;
  processingAttemptId: string;
  correlationId: string;
  processingState: RequirementProcessingState;
  outcome: RequirementProcessingOutcome;
  errorCode: string | null;
  startedAtUtc: string;
  completedAtUtc: string;
  summary: RequirementProcessingSummary | null;
}

export interface CurrentRequirement {
  requirementId: string;
  preQuoteId: string;
  status: RequirementStatus;
  commercialLine: RequirementCommercialLine | null;
  createdAtUtc: string;
  hasTechnicalProposal: boolean;
  technicalProposalId: string | null;
  latestAttemptState: RequirementProcessingState | null;
  latestAttemptOutcome: RequirementProcessingOutcome | null;
  latestAttemptErrorCode: string | null;
  canEditDocuments: boolean;
  canCancel: boolean;
  canReplace: boolean;
  isCurrent: boolean;
  supersedesRequirementId: string | null;
  supersededByRequirementId: string | null;
  documents: RequirementDocument[];
}
