import { isDateTime, isNonEmptyString, isNonNegativeInteger, isRecord } from "@/features/prequotes/newpipe-guards";
import type { RequirementChat, RequirementChatAction, RequirementChatActionPlan, RequirementChatInteraction, RequirementChatMessage } from "@/features/prequotes/requirement-chat-types";
import { apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";

function isGuidOrNull(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isMessage(value: unknown): value is RequirementChatMessage {
  return isRecord(value) && isNonEmptyString(value.messageId) &&
    (value.role === "USER" || value.role === "ASSISTANT") &&
    typeof value.content === "string" && isNonNegativeInteger(value.sequence) &&
    isDateTime(value.createdAtUtc);
}

function isInteraction(value: unknown): value is RequirementChatInteraction {
  if (!isRecord(value) || !["INFORMATIONAL", "ACTION_PLAN", "CLARIFICATION"].includes(String(value.messageType))) return false;
  const target = value.target;
  return isGuidOrNull(value.planId) && typeof value.requiresConfirmation === "boolean" &&
    isNullableString(value.actionType) &&
    (target === null || (isRecord(target) && isGuidOrNull(target.technicalProposalItemId) && isNullableString(target.reference))) &&
    isNullableString(value.currentValue) && isNullableString(value.requestedValue) &&
    isNullableString(value.pricingImpactExpected) && isNullableString(value.pricingStatus) && isStringArray(value.reasons);
}

function isRequirementChat(value: unknown): value is RequirementChat {
  return isRecord(value) && isNonEmptyString(value.threadId) &&
    isNonEmptyString(value.requirementId) && isGuidOrNull(value.technicalProposalItemId) &&
    (value.scope === "REQUIREMENT" || value.scope === "ITEM") &&
    isDateTime(value.createdAtUtc) && isDateTime(value.updatedAtUtc) &&
    Array.isArray(value.messages) && value.messages.every(isMessage) &&
    (value.lastInteraction === null || isInteraction(value.lastInteraction));
}

function isAction(value: unknown): value is RequirementChatAction {
  if (!isRecord(value)) return false;
  const resolved = value.resolvedCatalogEntity;
  return isNonEmptyString(value.actionId) && isNonEmptyString(value.actionType) &&
    isGuidOrNull(value.targetTechnicalProposalItemId) && isNullableString(value.targetReference) &&
    isNullableString(value.requestedValue) && isNullableString(value.currentValue) &&
    (resolved === null || (isRecord(resolved) && isNonEmptyString(resolved.id) && isNonEmptyString(resolved.code) && isNonEmptyString(resolved.displayName) && isNonEmptyString(resolved.entityType))) &&
    isNonEmptyString(value.validationState) && isStringArray(value.validationReasons) &&
    typeof value.requiresConfirmation === "boolean" && Array.isArray(value.availableOptions) &&
    value.availableOptions.every((option) => isRecord(option) && isGuidOrNull(option.id) && isNullableString(option.code) && isNonEmptyString(option.displayName) && isNonEmptyString(option.optionType));
}

function isActionPlan(value: unknown): value is RequirementChatActionPlan {
  return isRecord(value) && isNonEmptyString(value.planId) && isNonEmptyString(value.requirementId) &&
    isNonEmptyString(value.technicalProposalId) && (value.scope === "REQUIREMENT" || value.scope === "ITEM") &&
    isNonEmptyString(value.status) && typeof value.requiresConfirmation === "boolean" &&
    isDateTime(value.createdAtUtc) && (value.expiresAtUtc === null || isDateTime(value.expiresAtUtc)) &&
    isNullableString(value.pricingStatus) && isStringArray(value.executionReasons) &&
    Array.isArray(value.actions) && value.actions.every(isAction);
}

function invalidResponse(): ApiError {
  return new ApiError({ status: 0, title: "Respuesta inválida", detail: "El servidor no devolvió un chat válido." });
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

export async function confirmRequirementChatAction(requirementId: string, planId: string): Promise<RequirementChatActionPlan> {
  const response = await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/chat/actions/${encodeURIComponent(planId)}/confirm`, {
    method: "POST",
    authenticated: true,
  });
  if (!isActionPlan(response)) throw invalidResponse();
  return response;
}
