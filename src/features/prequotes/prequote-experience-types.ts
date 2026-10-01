import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

export interface RequirementExperienceCatalogOption {
  optionCode: string;
  optionLabel: string;
  shortLabel: string | null;
  conditions: unknown[];
}

export interface RequirementExperienceCatalogQuestion {
  benefitCode: string;
  label: string;
  question: string;
  options: RequirementExperienceCatalogOption[];
}

export interface RequirementExperienceCatalogSpace {
  code: string;
  label: string;
  priorities: Record<string, number>;
}

export interface RequirementExperienceCatalog {
  version: string;
  questions: RequirementExperienceCatalogQuestion[];
  spaces: RequirementExperienceCatalogSpace[];
}

export interface RequirementExperienceAnswer {
  benefitCode: string;
  optionCode: string;
}

export interface RequirementExperienceItemDraft {
  technicalProposalItemId: string;
  catalogVersion: string | null;
  spaceTypeCode: string | null;
  resolutionState: string;
  revision: number;
  updatedAtUtc: string | null;
  updatedByUserId: string | null;
  answers: RequirementExperienceAnswer[];
}

export interface RequirementExperienceDraftsResponse {
  technicalProposalId: string;
  items: RequirementExperienceItemDraft[];
}

export interface UpdateRequirementExperienceDraftRequest {
  catalogVersion: string;
  spaceTypeCode: string | null;
  expectedRevision: number;
  answers: RequirementExperienceAnswer[];
}

export type ExperienceAnswers = Record<string, string>;

export interface ItemExperienceDraft {
  itemId: string;
  catalogVersion: string | null;
  spaceTypeCode: string | null;
  resolutionState: string;
  revision: number;
  updatedAtUtc: string | null;
  updatedByUserId: string | null;
  answers: ExperienceAnswers;
  hasServerDraft: boolean;
}

export type ItemExperienceDrafts = Record<string, ItemExperienceDraft>;

export type ExperienceDraftFactory = (item: TechnicalProposalItem) => ItemExperienceDraft;
export interface ExperienceLocationField {
  value: string;
  source: "real" | "derived" | "placeholder" | "manual";
}

export type ExperienceLocationFields = Record<string, ExperienceLocationField>;
