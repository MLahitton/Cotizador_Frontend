export type RequirementChatMessage = {
  messageId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sequence: number;
  createdAtUtc: string;
};

export type RequirementChatMessageType = "INFORMATIONAL" | "ACTION_PLAN" | "CLARIFICATION";

export type RequirementChatActionTarget = { technicalProposalItemId: string | null; reference: string | null };

export type RequirementChatResolvedCatalogEntity = {
  id: string;
  code: string;
  displayName: string;
  entityType: string;
};

export type RequirementChatActionOption = {
  id: string | null;
  code: string | null;
  displayName: string;
  optionType: string;
};

export type RequirementChatInteractionAction = {
  actionId: string;
  actionType: string;
  target: RequirementChatActionTarget | null;
  currentValue: string | null;
  requestedValue: string | null;
  resolvedCatalogEntity: RequirementChatResolvedCatalogEntity | null;
  validationState: string;
  validationReasons: string[];
  requiresConfirmation: boolean;
  availableOptions: RequirementChatActionOption[];
};

export type RequirementChatInteraction = {
  messageType: RequirementChatMessageType;
  planId: string | null;
  requiresConfirmation: boolean;
  actionType: string | null;
  target: RequirementChatActionTarget | null;
  currentValue: string | null;
  requestedValue: string | null;
  pricingImpactExpected: string | null;
  pricingStatus: string | null;
  reasons: string[];
  availableOptions: RequirementChatActionOption[];
  actionCount: number;
  actions: RequirementChatInteractionAction[];
};

export type RequirementChatAction = {
  actionId: string;
  actionType: string;
  targetTechnicalProposalItemId: string | null;
  targetReference: string | null;
  requestedValue: string | null;
  currentValue: string | null;
  resolvedCatalogEntity: RequirementChatResolvedCatalogEntity | null;
  validationState: string;
  validationReasons: string[];
  requiresConfirmation: boolean;
  availableOptions: RequirementChatActionOption[];
};

export type RequirementChatActionPlan = {
  planId: string;
  requirementId: string;
  technicalProposalId: string;
  scope: "REQUIREMENT" | "ITEM";
  status: string;
  requiresConfirmation: boolean;
  createdAtUtc: string;
  expiresAtUtc: string | null;
  pricingStatus: string | null;
  executionReasons: string[];
  actions: RequirementChatAction[];
};

export type RequirementChat = {
  threadId: string;
  requirementId: string;
  technicalProposalItemId: string | null;
  scope: "REQUIREMENT" | "ITEM";
  createdAtUtc: string;
  updatedAtUtc: string;
  messages: RequirementChatMessage[];
  lastInteraction: RequirementChatInteraction | null;
};
