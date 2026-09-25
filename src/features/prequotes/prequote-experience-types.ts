import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";

export type ExperienceDimensionKey =
  | "view"
  | "tranquility"
  | "temperature"
  | "solar"
  | "security"
  | "outdoorConnection"
  | "airtightness"
  | "privacy"
  | "threshold"
  | "insects"
  | "finish";

export type ExperienceSource = "placeholder";

export interface ExperienceSelection {
  dimension: ExperienceDimensionKey;
  value: string;
  source: ExperienceSource;
}

export type ExperienceSelections = Record<ExperienceDimensionKey, string | null>;

export interface ItemExperienceDraft {
  itemId: string;
  spaceType: string;
  relevantDimensions: ExperienceDimensionKey[];
  selections: ExperienceSelections;
  wasReviewedByUser: boolean;
}

export type ItemExperienceDrafts = Record<string, ItemExperienceDraft>;

export type ExperienceDraftFactory = (item: TechnicalProposalItem) => ItemExperienceDraft;
export interface ExperienceLocationField {
  value: string;
  source: "real" | "derived" | "placeholder" | "manual";
}

export type ExperienceLocationFields = Record<string, ExperienceLocationField>;