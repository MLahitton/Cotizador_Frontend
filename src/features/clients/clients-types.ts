export type ClientStatusFilter = "active" | "inactive" | "all";

export type ClientTypeValue = "Person" | "Company";

export type ClientDocumentTypeValue =
  | "Nit"
  | "CitizenshipCard"
  | "ForeignerId"
  | "Passport"
  | "Other";

export interface ClientBase {
  id: string;
  clientType: string;
  legalName: string;
  tradeName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export type ClientListItem = ClientBase;

export type ClientDetails = ClientBase;

export interface ClientsPage {
  items: ClientListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetClientsParameters {
  search: string | null;
  status: ClientStatusFilter;
  page: number;
  pageSize: number;
}

export interface ClientPayload {
  clientType: ClientTypeValue;
  legalName: string;
  tradeName: string | null;
  documentType: ClientDocumentTypeValue | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}

export type CreateClientRequest = ClientPayload;

export type UpdateClientPayload = ClientPayload;

export interface CreateClientFormValues {
  clientType: string;
  legalName: string;
  tradeName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export type ClientFormErrors = Partial<
  Record<keyof CreateClientFormValues | "form", string>
>;
