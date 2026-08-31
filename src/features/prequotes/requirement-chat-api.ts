import { isDateTime, isNonEmptyString, isNonNegativeInteger, isRecord } from "@/features/prequotes/newpipe-guards";
import type { RequirementChat, RequirementChatMessage } from "@/features/prequotes/requirement-chat-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isGuidOrNull(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isMessage(value: unknown): value is RequirementChatMessage {
  return isRecord(value) && isNonEmptyString(value.messageId) &&
    (value.role === "USER" || value.role === "ASSISTANT") &&
    typeof value.content === "string" && isNonNegativeInteger(value.sequence) &&
    isDateTime(value.createdAtUtc);
}

function isRequirementChat(value: unknown): value is RequirementChat {
  return isRecord(value) && isNonEmptyString(value.threadId) &&
    isNonEmptyString(value.requirementId) && isGuidOrNull(value.technicalProposalItemId) &&
    (value.scope === "REQUIREMENT" || value.scope === "ITEM") &&
    isDateTime(value.createdAtUtc) && isDateTime(value.updatedAtUtc) &&
    Array.isArray(value.messages) && value.messages.every(isMessage);
}

function invalidResponse(): ApiError {
  return new ApiError({ status: 0, title: "Respuesta invalida", detail: "El servidor no devolvio un chat valido." });
}

function path(requirementId: string, itemId?: string | null): string {
  const encodedRequirement = encodeURIComponent(requirementId);
  if (!itemId) return `/api/v2/requirements/${encodedRequirement}/chat`;
  return `/api/v2/requirements/${encodedRequirement}/items/${encodeURIComponent(itemId)}/chat`;
}

export async function getRequirementChat(requirementId: string, itemId?: string | null): Promise<RequirementChat> {
  const response = await apiRequest(path(requirementId, itemId), { authenticated: true });
  if (!isRequirementChat(response)) throw invalidResponse();
  return response;
}

export async function sendRequirementChatMessage(requirementId: string, itemId: string | null, message: string): Promise<RequirementChat> {
  const response = await apiRequest(`${path(requirementId, itemId)}/messages`, {
    method: "POST",
    authenticated: true,
    body: { message },
  });
  if (!isRequirementChat(response)) throw invalidResponse();
  return response;
}
