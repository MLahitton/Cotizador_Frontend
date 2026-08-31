export type RequirementChatMessage = {
  messageId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sequence: number;
  createdAtUtc: string;
};

export type RequirementChat = {
  threadId: string;
  requirementId: string;
  technicalProposalItemId: string | null;
  scope: "REQUIREMENT" | "ITEM";
  createdAtUtc: string;
  updatedAtUtc: string;
  messages: RequirementChatMessage[];
};
