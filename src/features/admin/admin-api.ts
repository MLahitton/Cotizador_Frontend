import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

import type {
  AdminDashboard,
  AdminPreQuoteListItem,
  AdminPreQuoteProject,
  AdminPreQuotesPage,
  AdminPreQuotesQuery,
  AdminPreQuoteUser,
  AdminUserListItem,
  AdminUserRole,
  AdminUsersPage,
  AdminUsersQuery,
} from "@/features/admin/admin-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function invalidResponseError(): ApiError {
  return new ApiError({
    status: 0,
    title: "Respuesta inválida",
    detail:
      "El servidor devolvió una respuesta administrativa inesperada.",
  });
}

function requireString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw invalidResponseError();
  }

  return value;
}

function requireNullableString(
  value: unknown,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw invalidResponseError();
  }

  return value;
}

function requireBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponseError();
  }

  return value;
}

function requireNumber(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw invalidResponseError();
  }

  return value;
}

function requireNullableNumber(value: unknown): number | null {
  if (value === null) {
    return null;
  }

  return requireNumber(value);
}
function parseRole(value: unknown): AdminUserRole {
  if (value !== "USER" && value !== "ADMIN") {
    throw invalidResponseError();
  }

  return value;
}

function parseDashboard(value: unknown): AdminDashboard {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    totalUsers: requireNumber(value.totalUsers),
    activeUsers: requireNumber(value.activeUsers),
    usersActiveToday: requireNumber(value.usersActiveToday),
    usersActiveLast7Days: requireNumber(
      value.usersActiveLast7Days,
    ),
    usersActiveLast30Days: requireNumber(
      value.usersActiveLast30Days,
    ),
    totalPreQuotes: requireNumber(value.totalPreQuotes),
    preQuotesToday: requireNumber(value.preQuotesToday),
    preQuotesThisWeek: requireNumber(
      value.preQuotesThisWeek,
    ),
    preQuotesThisMonth: requireNumber(
      value.preQuotesThisMonth,
    ),
  };
}

function parseAdminUser(
  value: unknown,
): AdminUserListItem {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    id: requireString(value.id, "id"),
    email: requireString(value.email, "email"),
    firstName: requireString(
      value.firstName,
      "firstName",
    ),
    lastName: requireNullableString(value.lastName),
    profilePictureUrl: requireNullableString(
      value.profilePictureUrl,
    ),
    isActive: requireBoolean(value.isActive),
    role: parseRole(value.role),
    lastLoginAtUtc: requireNullableString(
      value.lastLoginAtUtc,
    ),
    createdAtUtc: requireString(
      value.createdAtUtc,
      "createdAtUtc",
    ),
    updatedAtUtc: requireString(
      value.updatedAtUtc,
      "updatedAtUtc",
    ),
    preQuoteCount: requireNumber(value.preQuoteCount),
  };
}

function parseAdminUsersPage(
  value: unknown,
): AdminUsersPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items)
  ) {
    throw invalidResponseError();
  }

  return {
    items: value.items.map(parseAdminUser),
    page: requireNumber(value.page),
    pageSize: requireNumber(value.pageSize),
    totalCount: requireNumber(value.totalCount),
    totalPages: requireNumber(value.totalPages),
  };
}

function parsePreQuoteUser(
  value: unknown,
): AdminPreQuoteUser {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    id: requireString(value.id, "createdBy.id"),
    email: requireString(
      value.email,
      "createdBy.email",
    ),
    firstName: requireString(
      value.firstName,
      "createdBy.firstName",
    ),
    lastName: requireNullableString(value.lastName),
  };
}

function parsePreQuoteProject(
  value: unknown,
): AdminPreQuoteProject {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    id: requireString(value.id, "project.id"),
    code: requireString(value.code, "project.code"),
    name: requireString(value.name, "project.name"),
  };
}

function parseAdminPreQuote(
  value: unknown,
): AdminPreQuoteListItem {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    id: requireString(value.id, "id"),
    projectId: requireString(
      value.projectId,
      "projectId",
    ),
    serial: requireString(value.serial, "serial"),
    name: requireNullableString(value.name),
    documentCount: requireNumber(
      value.documentCount,
    ),
    createdAtUtc: requireString(
      value.createdAtUtc,
      "createdAtUtc",
    ),
    updatedAtUtc: requireString(
      value.updatedAtUtc,
      "updatedAtUtc",
    ),

    createdBy: parsePreQuoteUser(value.createdBy),
    project: parsePreQuoteProject(value.project),

    hasRequirement: requireBoolean(
      value.hasRequirement,
    ),
    latestRequirementId: requireNullableString(
      value.latestRequirementId,
    ),
    latestRequirementStatus: requireNullableString(
      value.latestRequirementStatus,
    ),

    hasTechnicalProposal: requireBoolean(
      value.hasTechnicalProposal,
    ),
    technicalProposalId: requireNullableString(
      value.technicalProposalId,
    ),
    technicalProposalItemCount: requireNullableNumber(
      value.technicalProposalItemCount,
    ),

    latestAttemptState: requireNullableString(
      value.latestAttemptState,
    ),
    latestAttemptOutcome: requireNullableString(
      value.latestAttemptOutcome,
    ),
    latestAttemptErrorCode: requireNullableString(
      value.latestAttemptErrorCode,
    ),
  };
}

function parseAdminPreQuotesPage(
  value: unknown,
): AdminPreQuotesPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items)
  ) {
    throw invalidResponseError();
  }

  return {
    items: value.items.map(parseAdminPreQuote),
    page: requireNumber(value.page),
    pageSize: requireNumber(value.pageSize),
    totalCount: requireNumber(value.totalCount),
    totalPages: requireNumber(value.totalPages),
  };
}

function buildQueryString(
  params: Record<
    string,
    string | number | undefined
  >,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === ""
    ) {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString.length > 0
    ? `?${queryString}`
    : "";
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const value = await apiRequest(
    "/api/v1/admin/dashboard",
    {
      authenticated: true,
    },
  );

  return parseDashboard(value);
}

export async function getAdminUsers(
  query: AdminUsersQuery = {},
): Promise<AdminUsersPage> {
  const queryString = buildQueryString({
    search: query.search?.trim(),
    status: query.status,
    role: query.role,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  });

  const value = await apiRequest(
    `/api/v1/admin/users${queryString}`,
    {
      authenticated: true,
    },
  );

  return parseAdminUsersPage(value);
}

export async function getAdminPreQuotes(
  query: AdminPreQuotesQuery = {},
): Promise<AdminPreQuotesPage> {
  const queryString = buildQueryString({
    search: query.search?.trim(),
    userId: query.userId,
    fromUtc: query.fromUtc,
    toUtc: query.toUtc,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  });

  const value = await apiRequest(
    `/api/v1/admin/prequotes${queryString}`,
    {
      authenticated: true,
    },
  );

  return parseAdminPreQuotesPage(value);
}