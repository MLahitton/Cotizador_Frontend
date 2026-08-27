import type {
  PreQuoteDraftElementType,
  PreQuoteDraftRequirementCategory,
  PreQuoteDraftResolutionStatus,
} from "@/features/prequotes/prequote-draft-types";

export type DraftEditCollection = "items" | "requirements" | "references";

export interface DraftEditProjectModel {
  projectName: string;
  clientName: string;
  location: string;
}

export interface DraftEditItemModel {
  localId: string;
  draftItemId: string | null;
  sequence: number;
  isNew: boolean;
  reference: string;
  description: string;
  elementType: PreQuoteDraftElementType | "";
  rawMeasurements: string;
  widthMillimeters: string;
  heightMillimeters: string;
  quantity: string;
  isIncluded: boolean;
}

export interface DraftEditRequirementModel {
  localId: string;
  draftRequirementId: string | null;
  sequence: number;
  isNew: boolean;
  category: PreQuoteDraftRequirementCategory | "";
  value: string;
  isIncluded: boolean;
}

export interface DraftEditReferenceModel {
  localId: string;
  draftDocumentReferenceId: string | null;
  sequence: number;
  isNew: boolean;
  reference: string;
  description: string;
  detail: string;
  quantity: string;
  isIncluded: boolean;
}

export interface DraftEditFindingModel {
  id: string;
  sequence: number;
  resolutionStatus: PreQuoteDraftResolutionStatus;
  resolutionNote: string;
}

export interface DraftEditModel {
  project: DraftEditProjectModel;
  items: DraftEditItemModel[];
  requirements: DraftEditRequirementModel[];
  references: DraftEditReferenceModel[];
  issues: DraftEditFindingModel[];
  conflicts: DraftEditFindingModel[];
}

export type DraftEditErrors = Record<string, string>;
