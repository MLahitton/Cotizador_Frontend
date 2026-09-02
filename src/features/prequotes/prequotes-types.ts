import type { ProjectDetails } from "@/features/projects/projects-types";

export interface PreQuoteListItem {
  id: string;
  projectId: string;
  serial: string;
  name: string | null;
  documentCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  hasRequirement: boolean;
  latestRequirementId: string | null;
  latestRequirementStatus: string | null;
  hasTechnicalProposal: boolean;
  technicalProposalId: string | null;
  technicalProposalItemCount: number | null;
  latestAttemptState: string | null;
  latestAttemptOutcome: string | null;
  latestAttemptErrorCode: string | null;
}

export interface ProjectPreQuotesPage {
  items: PreQuoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PreQuoteDetails {
  id: string;
  projectId: string;
  serial: string;
  name: string | null;
  documentCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreatedPreQuote {
  id: string;
  projectId: string;
  serial: string;
  name: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface GetProjectPreQuotesParameters {
  projectId: string;
  page: number;
  pageSize: number;
}

export interface PreQuoteLoadError {
  cause: unknown;
}

export interface CreatePreQuoteError {
  cause: unknown;
}

export type CreatePreQuoteResult =
  | { status: "created"; preQuote: CreatedPreQuote }
  | { status: "failed" }
  | { status: "stale" }
  | { status: "ignored" };

export type ProjectContext = ProjectDetails;