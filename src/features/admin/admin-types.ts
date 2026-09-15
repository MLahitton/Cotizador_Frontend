export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  usersActiveToday: number;
  usersActiveLast7Days: number;
  usersActiveLast30Days: number;
  totalPreQuotes: number;
  preQuotesToday: number;
  preQuotesThisWeek: number;
  preQuotesThisMonth: number;
}

export type AdminUserRole = "USER" | "ADMIN";

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  role: AdminUserRole;
  lastLoginAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  preQuoteCount: number;
}

export interface AdminUsersPage {
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminUsersQuery {
  search?: string;
  status?: "active" | "inactive" | "all";
  role?: AdminUserRole;
  page?: number;
  pageSize?: number;
}

export interface AdminPreQuoteUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
}

export interface AdminPreQuoteProject {
  id: string;
  code: string;
  name: string;
}

export interface AdminPreQuoteListItem {
  id: string;
  projectId: string;
  serial: string;
  name: string | null;
  documentCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;

  createdBy: AdminPreQuoteUser;
  project: AdminPreQuoteProject;

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

export interface AdminPreQuotesPage {
  items: AdminPreQuoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminPreQuotesQuery {
  search?: string;
  userId?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
}