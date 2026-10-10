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
  level1Resolution: RequirementExperienceLevel1Resolution | null;
  answers: RequirementExperienceAnswer[];
}

export interface RequirementExperienceLevel1Resolution {
  systemTier: string | null;
  glassFamily: string | null;
  isComplete: boolean;
  answeredBenefits: number;
  requiredBenefits: number;
}

export type RequirementExperienceLevel2State =
  | "RESOLVED"
  | "REQUIRES_REVIEW"
  | "PENDING"
  | "BLOCKED"
  | "PENDING_EXTERNAL_SOURCE";

export type RequirementExperienceLevel2CandidateState =
  | "COMPATIBLE"
  | "REQUIRES_REVIEW"
  | "INCOMPATIBLE";

export interface RequirementExperienceLevel2SystemCandidate {
  id: string;
  code: string;
  name: string;
  technicalName: string | null;
  commercialName: string | null;
  functionalType: string | null;
  family: string | null;
  series: string | null;
  compatibilityState: RequirementExperienceLevel2CandidateState;
  rank: number;
  reviewReasons: string[];
  blockingReasons: string[];
}

export interface RequirementExperienceLevel2System {
  state: RequirementExperienceLevel2State;
  suggested: RequirementExperienceLevel2SystemCandidate | null;
  candidates: RequirementExperienceLevel2SystemCandidate[];
  reviewReasons: string[];
  blockingReasons: string[];
}

export interface RequirementExperienceLevel2GlassCandidate {
  id: string;
  code: string;
  name: string;
  family: string | null;
  composition: string | null;
  treatment: string | null;
  outerThicknessMm: number | null;
  innerThicknessMm: number | null;
  compatibilityState: RequirementExperienceLevel2CandidateState;
  rank: number;
  reviewReasons: string[];
  blockingReasons: string[];
}

export interface RequirementExperienceLevel2Glass {
  state: RequirementExperienceLevel2State;
  glassFamily: string | null;
  suggested: RequirementExperienceLevel2GlassCandidate | null;
  candidates: RequirementExperienceLevel2GlassCandidate[];
  reviewReasons: string[];
  blockingReasons: string[];
}

export interface RequirementExperienceLevel2Finish {
  state: RequirementExperienceLevel2State;
  reviewReasons: string[];
  blockingReasons: string[];
}

export interface RequirementExperienceLevel2Response {
  technicalProposalId: string;
  technicalProposalItemId: string;
  effectiveFunctionalType: string | null;
  system: RequirementExperienceLevel2System;
  glass: RequirementExperienceLevel2Glass;
  finish: RequirementExperienceLevel2Finish;
  overallState: RequirementExperienceLevel2State;
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
  level1Resolution: RequirementExperienceLevel1Resolution | null;
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
