import type { ProjectDetails } from "@/features/projects/projects-types";

export interface PreQuoteListItem {
  id: string;
  projectId: string;
  documentCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
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
  documentCount: number;
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

export type ProjectContext = ProjectDetails;
