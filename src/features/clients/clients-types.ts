export type ClientStatusFilter = "active" | "inactive" | "all";

export interface ClientListItem {
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
