export type RequirementStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export interface CreatedRequirement {
  requirementId: string;
  preQuoteId: string;
  fileCount: number;
  status: RequirementStatus;
  createdAtUtc: string;
}

export type RequirementProcessingState = "Pending" | "Processing" | "Finished";
export type RequirementProcessingOutcome = "Completed" | "RequiresReview" | "Failed";

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
  createdAtUtc: string;
  hasTechnicalProposal: boolean;
  technicalProposalId: string | null;
  latestAttemptState: RequirementProcessingState | null;
  latestAttemptOutcome: RequirementProcessingOutcome | null;
  latestAttemptErrorCode: string | null;
}