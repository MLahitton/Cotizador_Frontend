export type ProjectWorkspaceResolutionState =
  | "EMPTY"
  | "RESOLVED"
  | "AMBIGUOUS";

export interface ProjectWorkspaceProject {
  id: string;
  clientId: string;
  code: string;
  name: string;
  location: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ProjectWorkspaceClient {
  id: string;
  clientType: string;
  legalName: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
}

export interface ProjectWorkspaceWorkflow {
  resolutionState: ProjectWorkspaceResolutionState;
  preQuoteId: string | null;
  requirementId: string | null;
  requirementStatus: string | null;
  technicalProposalId: string | null;
  hasTechnicalProposal: boolean;
}

export interface ProjectWorkspace {
  project: ProjectWorkspaceProject;
  client: ProjectWorkspaceClient;
  workflow: ProjectWorkspaceWorkflow;
}
