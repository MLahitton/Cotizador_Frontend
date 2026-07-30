export type ProjectStatusFilter = "active" | "inactive" | "all";

export type ProjectClientTypeFilter = "Person" | "Company" | null;

export type ProjectDocumentTypeFilter =
  | "Nit"
  | "CitizenshipCard"
  | "ForeignerId"
  | "Passport"
  | "Other"
  | null;

export interface ProjectClientSummary {
  id: string;
  clientType: string;
  legalName: string;
  tradeName: string | null;
  documentType: string | null;
  documentNumber: string | null;
}

export interface ProjectListItem {
  id: string;
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  client: ProjectClientSummary;
}

export interface ProjectsPage {
  items: ProjectListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetProjectsParameters {
  search: string | null;
  status: ProjectStatusFilter;
  clientId: string | null;
  clientType: ProjectClientTypeFilter;
  documentType: ProjectDocumentTypeFilter;
  page: number;
  pageSize: number;
}

export interface CreateProjectRequest {
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
}

export interface CreatedProject {
  id: string;
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ProjectDetails {
  id: string;
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface SetProjectActivationRequest {
  isActive: boolean;
}

export interface ProjectFormValues {
  code: string;
  name: string;
  location: string;
  description: string;
}

export type ProjectFormErrors = Partial<
  Record<keyof ProjectFormValues | "client" | "form", string>
>;
