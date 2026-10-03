import { isValidProjectId } from "@/features/projects/project-identifiers";
import type {
  ProjectWorkspace,
  ProjectWorkspaceClient,
  ProjectWorkspaceProject,
  ProjectWorkspaceResolutionState,
  ProjectWorkspaceWorkflow,
} from "@/features/projects/project-workspace-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const INVALID_WORKSPACE_RESPONSE_DETAIL =
  "El servidor devolvio una respuesta inesperada al consultar el workspace del proyecto.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidGuidOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && isValidProjectId(value));
}

function isResolutionState(
  value: unknown,
): value is ProjectWorkspaceResolutionState {
  return value === "EMPTY" || value === "RESOLVED" || value === "AMBIGUOUS";
}

function isProject(value: unknown): value is ProjectWorkspaceProject {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isValidProjectId(value.id) &&
    typeof value.clientId === "string" &&
    isValidProjectId(value.clientId) &&
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.name) &&
    isNullableString(value.location) &&
    typeof value.isActive === "boolean" &&
    isValidDateTime(value.createdAtUtc) &&
    isValidDateTime(value.updatedAtUtc)
  );
}

function isClient(value: unknown): value is ProjectWorkspaceClient {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isValidProjectId(value.id) &&
    isNonEmptyString(value.clientType) &&
    isNonEmptyString(value.legalName) &&
    isNullableString(value.tradeName) &&
    isNullableString(value.email) &&
    isNullableString(value.phone) &&
    isNullableString(value.city)
  );
}

function isWorkflow(value: unknown): value is ProjectWorkspaceWorkflow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isResolutionState(value.resolutionState) &&
    isValidGuidOrNull(value.preQuoteId) &&
    isValidGuidOrNull(value.requirementId) &&
    isNullableString(value.requirementStatus) &&
    isValidGuidOrNull(value.technicalProposalId) &&
    typeof value.hasTechnicalProposal === "boolean"
  );
}

function isProjectWorkspace(
  value: unknown,
  projectId: string,
): value is ProjectWorkspace {
  if (!isRecord(value) || !isProject(value.project)) {
    return false;
  }

  return (
    value.project.id.trim().toLowerCase() === projectId.trim().toLowerCase() &&
    isClient(value.client) &&
    value.client.id.trim().toLowerCase() ===
      value.project.clientId.trim().toLowerCase() &&
    isWorkflow(value.workflow)
  );
}

export async function getProjectWorkspace(
  projectId: string,
): Promise<ProjectWorkspace> {
  const response = await apiRequest(
    `/api/v2/projects/${encodeURIComponent(projectId)}/workspace`,
    { authenticated: true },
  );

  if (!isProjectWorkspace(response, projectId)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta invalida",
      detail: INVALID_WORKSPACE_RESPONSE_DETAIL,
    });
  }

  return response;
}
