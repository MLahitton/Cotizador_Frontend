import type {
  UserDashboard,
  UserDashboardActivityItem,
  UserDashboardAttentionItem,
  UserDashboardRecentProject,
} from "@/features/dashboard/dashboard-types";

import { ApiError } from "@/lib/http/api-error";
import { apiRequest } from "@/lib/http/api-client";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
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
      "El servidor devolvió una respuesta de panel inesperada.",
  });
}

function requireString(value: unknown): string {
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

  return requireString(value);
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

function requireBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponseError();
  }

  return value;
}

function parseRecentProject(
  value: unknown,
): UserDashboardRecentProject {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    projectId: requireString(value.projectId),
    code: requireString(value.code),
    name: requireString(value.name),
    clientId: requireString(value.clientId),
    clientName: requireString(value.clientName),
    isActive: requireBoolean(value.isActive),
    updatedAtUtc: requireString(value.updatedAtUtc),
  };
}

function parseAttentionItem(
  value: unknown,
): UserDashboardAttentionItem {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    projectId: requireString(value.projectId),
    projectCode: requireString(value.projectCode),
    projectName: requireString(value.projectName),
    preQuoteId: requireString(value.preQuoteId),
    preQuoteSerial: requireString(value.preQuoteSerial),
    preQuoteName: requireNullableString(
      value.preQuoteName,
    ),
    requirementId: requireString(value.requirementId),
    type: requireString(value.type),
    title: requireString(value.title),
    description: requireString(value.description),
    updatedAtUtc: requireString(value.updatedAtUtc),
  };
}

function parseActivityItem(
  value: unknown,
): UserDashboardActivityItem {
  if (!isRecord(value)) {
    throw invalidResponseError();
  }

  return {
    projectId: requireString(value.projectId),
    projectCode: requireString(value.projectCode),
    projectName: requireString(value.projectName),
    preQuoteId: requireNullableString(
      value.preQuoteId,
    ),
    preQuoteSerial: requireNullableString(
      value.preQuoteSerial,
    ),
    preQuoteName: requireNullableString(
      value.preQuoteName,
    ),
    type: requireString(value.type),
    title: requireString(value.title),
    description: requireString(value.description),
    occurredAtUtc: requireString(
      value.occurredAtUtc,
    ),
  };
}

function parseDashboard(
  value: unknown,
): UserDashboard {
  if (
    !isRecord(value) ||
    !Array.isArray(value.recentProjects) ||
    !Array.isArray(value.attentionItems) ||
    !Array.isArray(value.recentActivity)
  ) {
    throw invalidResponseError();
  }

  return {
    activeProjects: requireNumber(
      value.activeProjects,
    ),
    totalPreQuotes: requireNumber(
      value.totalPreQuotes,
    ),
    requirementsInProgress: requireNumber(
      value.requirementsInProgress,
    ),
    proposalsRequiringReview: requireNumber(
      value.proposalsRequiringReview,
    ),
    recentProjects: value.recentProjects.map(
      parseRecentProject,
    ),
    attentionItems: value.attentionItems.map(
      parseAttentionItem,
    ),
    recentActivity: value.recentActivity.map(
      parseActivityItem,
    ),
  };
}

export async function getUserDashboard(): Promise<UserDashboard> {
  const value = await apiRequest(
    "/api/v1/dashboard",
    {
      authenticated: true,
    },
  );

  return parseDashboard(value);
}   