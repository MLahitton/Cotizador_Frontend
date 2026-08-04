import type {
  CreatedProject,
  CreateProjectRequest,
  GetProjectsParameters,
  ProjectClientSummary,
  ProjectDetails,
  ProjectListItem,
  ProjectsPage,
  SetProjectActivationRequest,
  UpdateProjectRequest,
} from "@/features/projects/projects-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

const INVALID_RESPONSE_DETAIL =
  "El servidor devolvió una respuesta inesperada al consultar proyectos.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isValidPageSize(value: unknown): value is number {
  return isPositiveInteger(value) && value <= 100;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    ) &&
    value.trim() !== "00000000-0000-0000-0000-000000000000"
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProjectClientSummary(
  value: unknown,
): value is ProjectClientSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.clientType === "string" &&
    typeof value.legalName === "string" &&
    isNullableString(value.tradeName) &&
    isNullableString(value.documentType) &&
    isNullableString(value.documentNumber)
  );
}

function isProjectListItem(value: unknown): value is ProjectListItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.clientId === "string" &&
    value.clientId.trim().length > 0 &&
    typeof value.code === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.description) &&
    isNullableString(value.location) &&
    typeof value.isActive === "boolean" &&
    typeof value.createdAtUtc === "string" &&
    typeof value.updatedAtUtc === "string" &&
    isProjectClientSummary(value.client)
  );
}

function isCreatedProject(value: unknown): value is CreatedProject {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.clientId === "string" &&
    value.clientId.trim().length > 0 &&
    typeof value.code === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.description) &&
    isNullableString(value.location) &&
    typeof value.isActive === "boolean" &&
    typeof value.createdAtUtc === "string" &&
    typeof value.updatedAtUtc === "string"
  );
}

function isProjectDetails(value: unknown): value is ProjectDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isUuid(value.id) &&
    isUuid(value.clientId) &&
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.name) &&
    isNullableString(value.description) &&
    isNullableString(value.location) &&
    typeof value.isActive === "boolean" &&
    isNonEmptyString(value.createdAtUtc) &&
    isNonEmptyString(value.updatedAtUtc)
  );
}

function isRequestedProjectDetails(
  value: unknown,
  projectId: string,
  isActive: boolean,
): value is ProjectDetails {
  return (
    isProjectDetails(value) &&
    value.id.trim().toLowerCase() === projectId.trim().toLowerCase() &&
    value.isActive === isActive
  );
}

export class InvalidProjectActivationResponseError extends Error {
  constructor() {
    super("No fue posible confirmar el nuevo estado del proyecto.");
    this.name = "InvalidProjectActivationResponseError";
  }
}

export function isInvalidProjectActivationResponseError(
  error: unknown,
): error is InvalidProjectActivationResponseError {
  return error instanceof InvalidProjectActivationResponseError;
}

function isValidDateTime(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isRequestedProjectUpdate(
  value: unknown,
  currentProject: ProjectDetails,
): value is ProjectDetails {
  return (
    isProjectDetails(value) &&
    value.id.trim().toLowerCase() ===
      currentProject.id.trim().toLowerCase() &&
    value.clientId.trim().toLowerCase() ===
      currentProject.clientId.trim().toLowerCase() &&
    value.isActive === currentProject.isActive &&
    isValidDateTime(value.createdAtUtc) &&
    isValidDateTime(value.updatedAtUtc)
  );
}

function isProjectsPage(value: unknown): value is ProjectsPage {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  return (
    value.items.every(isProjectListItem) &&
    isPositiveInteger(value.page) &&
    isValidPageSize(value.pageSize) &&
    isNonNegativeInteger(value.totalCount) &&
    isNonNegativeInteger(value.totalPages)
  );
}

export async function getProjects(
  parameters: GetProjectsParameters,
): Promise<ProjectsPage> {
  const query = new URLSearchParams({
    status: parameters.status,
    page: String(parameters.page),
    pageSize: String(parameters.pageSize),
  });

  const normalizedSearch = parameters.search?.trim();
  if (normalizedSearch) {
    query.set("search", normalizedSearch);
  }

  if (parameters.clientId) {
    query.set("clientId", parameters.clientId);
  }

  if (parameters.clientType) {
    query.set("clientType", parameters.clientType);
  }

  if (parameters.documentType) {
    query.set("documentType", parameters.documentType);
  }

  const response = await apiRequest(`/api/v1/projects?${query.toString()}`, {
    authenticated: true,
  });

  if (!isProjectsPage(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail: INVALID_RESPONSE_DETAIL,
    });
  }

  return response;
}

export async function createProject(
  request: CreateProjectRequest,
): Promise<CreatedProject> {
  const response = await apiRequest("/api/v1/projects", {
    method: "POST",
    authenticated: true,
    body: request,
  });

  if (!isCreatedProject(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail:
        "El servidor devolvió una respuesta inesperada al crear el proyecto.",
    });
  }

  return response;
}

export async function getProjectById(
  projectId: string,
): Promise<ProjectDetails> {
  const response = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      authenticated: true,
    },
  );

  if (!isProjectDetails(response)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail:
        "El servidor devolvió una respuesta inesperada al consultar el proyecto.",
    });
  }

  return response;
}

export async function updateProject(
  projectId: string,
  request: UpdateProjectRequest,
  currentProject: ProjectDetails,
): Promise<ProjectDetails> {
  const response = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PUT",
      authenticated: true,
      body: request,
    },
  );

  if (!isRequestedProjectUpdate(response, currentProject)) {
    throw new ApiError({
      status: 0,
      title: "Respuesta inválida",
      detail:
        "El servidor devolvió una respuesta inesperada al actualizar el proyecto.",
    });
  }

  return response;
}

export async function setProjectActivation(
  projectId: string,
  request: SetProjectActivationRequest,
): Promise<ProjectDetails> {
  const response = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/activation`,
    {
      method: "PATCH",
      authenticated: true,
      body: request,
    },
  );

  if (!isRequestedProjectDetails(response, projectId, request.isActive)) {
    throw new InvalidProjectActivationResponseError();
  }

  return response;
}
