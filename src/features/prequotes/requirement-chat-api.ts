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

function isActionOption(value: unknown): boolean {
  return isRecord(value) && isGuidOrNull(value.id) && isNullableString(value.code) &&
    isNonEmptyString(value.displayName) && isNonEmptyString(value.optionType);
}

function isResolvedCatalogEntity(value: unknown): boolean {
  return isRecord(value) && isNonEmptyString(value.id) && isNonEmptyString(value.code) &&
    isNonEmptyString(value.displayName) && isNonEmptyString(value.entityType);
}

function isMessage(value: unknown): value is RequirementChatMessage {
  return isRecord(value) && isNonEmptyString(value.messageId) &&
    (value.role === "USER" || value.role === "ASSISTANT") &&
    typeof value.content === "string" && isNonNegativeInteger(value.sequence) &&
    isDateTime(value.createdAtUtc);
}

function isInteractionAction(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const target = value.target;
  return isNonEmptyString(value.actionId) && isNonEmptyString(value.actionType) &&
    (target === null || (isRecord(target) && isGuidOrNull(target.technicalProposalItemId) && isNullableString(target.reference))) &&
    isNullableString(value.currentValue) && isNullableString(value.requestedValue) &&
    (value.resolvedCatalogEntity === null || isResolvedCatalogEntity(value.resolvedCatalogEntity)) &&
    isNonEmptyString(value.validationState) && isStringArray(value.validationReasons) &&
    typeof value.requiresConfirmation === "boolean" && Array.isArray(value.availableOptions) &&
    value.availableOptions.every(isActionOption);
}

function normalizeInteraction(value: RequirementChatInteraction): RequirementChatInteraction {
  return {
    ...value,
    actionCount: isNonNegativeInteger(value.actionCount) ? value.actionCount : value.actions?.length ?? 0,
    actions: Array.isArray(value.actions) ? value.actions : [],
  };
}

function isInteraction(value: unknown): value is RequirementChatInteraction {
  if (!isRecord(value) || !["INFORMATIONAL", "ACTION_PLAN", "CLARIFICATION"].includes(String(value.messageType))) return false;
  const target = value.target;
  const actions = value.actions;
  return isGuidOrNull(value.planId) && typeof value.requiresConfirmation === "boolean" &&
    isNullableString(value.actionType) &&
    (target === null || (isRecord(target) && isGuidOrNull(target.technicalProposalItemId) && isNullableString(target.reference))) &&
    isNullableString(value.currentValue) && isNullableString(value.requestedValue) &&
    isNullableString(value.pricingImpactExpected) && isNullableString(value.pricingStatus) &&
    isStringArray(value.reasons) && Array.isArray(value.availableOptions) &&
    value.availableOptions.every(isActionOption) &&
    (value.actionCount === undefined || isNonNegativeInteger(value.actionCount)) &&
    (actions === undefined || (Array.isArray(actions) && actions.every(isInteractionAction)));
}

function isRequirementChat(value: unknown): value is RequirementChat {
  if (!isRecord(value) || !isNonEmptyString(value.threadId) ||
    !isNonEmptyString(value.requirementId) || !isGuidOrNull(value.technicalProposalItemId) ||
    (value.scope !== "REQUIREMENT" && value.scope !== "ITEM") ||
    !isDateTime(value.createdAtUtc) || !isDateTime(value.updatedAtUtc) ||
    !Array.isArray(value.messages) || !value.messages.every(isMessage) ||
    (value.lastInteraction !== null && !isInteraction(value.lastInteraction))) return false;
  if (value.lastInteraction !== null) {
    value.lastInteraction = normalizeInteraction(value.lastInteraction);
  }
  return true;
}

function isAction(value: unknown): value is RequirementChatAction {
  if (!isRecord(value)) return false;
  const resolved = value.resolvedCatalogEntity;
  return isNonEmptyString(value.actionId) && isNonEmptyString(value.actionType) &&
    isGuidOrNull(value.targetTechnicalProposalItemId) && isNullableString(value.targetReference) &&
    isNullableString(value.requestedValue) && isNullableString(value.currentValue) &&
    (resolved === null || isResolvedCatalogEntity(resolved)) &&
    isNonEmptyString(value.validationState) && isStringArray(value.validationReasons) &&
    typeof value.requiresConfirmation === "boolean" && Array.isArray(value.availableOptions) &&
    value.availableOptions.every(isActionOption);
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

export async function confirmRequirementChatAction(requirementId: string, planId: string): Promise<RequirementChatActionPlan> {
  const response = await apiRequest(`/api/v2/requirements/${encodeURIComponent(requirementId)}/chat/actions/${encodeURIComponent(planId)}/confirm`, {
    method: "POST",
    authenticated: true,
  });
  if (!isActionPlan(response)) throw invalidResponse();
  return response;
}
