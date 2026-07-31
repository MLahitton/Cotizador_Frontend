import type {
  DocumentProcessingAttemptSummary,
  DocumentProcessingAvailability,
} from "@/features/prequotes/prequote-documents-types";

export type EvidenceSourceType = "NATIVE" | "OCR";

export type StructuredElementType =
  | "WINDOW"
  | "DOOR"
  | "FACADE"
  | "PARTITION"
  | "RAILING"
  | "SKYLIGHT"
  | "OTHER";

export type RequirementCategory =
  | "GLASS_SPECIFICATION"
  | "PROFILE_SPECIFICATION"
  | "FINISH"
  | "ACCESSORIES_AND_SEALANTS"
  | "GENERAL_NOTE";

export type StructuredIssueCode =
  | "PROJECT_NAME_NOT_FOUND"
  | "NO_QUOTEABLE_ITEMS_FOUND"
  | "INCOMPLETE_TABLE_ROW"
  | "MISSING_ITEM_REFERENCE"
  | "MISSING_OR_INVALID_MEASUREMENTS"
  | "MISSING_OR_INVALID_QUANTITY"
  | "UNKNOWN_ELEMENT_TYPE"
  | "OCR_REVIEW_REQUIRED";

export type StructuredConflictCode =
  | "CONFLICTING_PROJECT_NAME"
  | "CONFLICTING_CLIENT_NAME"
  | "CONFLICTING_LOCATION"
  | "DUPLICATE_ITEM_REFERENCE";

export type StructuredExtractionStatus = "COMPLETED" | "REQUIRES_REVIEW";

export interface StructuredEvidence {
  pageNumber: number;
  sourceType: EvidenceSourceType;
  text: string;
}

export interface StructuredProject {
  name: string | null;
  clientName: string | null;
  location: string | null;
  sourcePages: number[];
  evidence: StructuredEvidence[];
}

export interface StructuredRequirement {
  sequence: number;
  category: RequirementCategory;
  value: string;
  evidence: StructuredEvidence[];
}

export interface StructuredItem {
  sequence: number;
  reference: string | null;
  description: string;
  elementType: StructuredElementType;
  rawMeasurements: string | null;
  widthMillimeters: number | null;
  heightMillimeters: number | null;
  quantity: number | null;
  requiresReview: boolean;
  reviewReasons: string[];
  sourcePages: number[];
  evidence: StructuredEvidence[];
}

export interface StructuredDocumentReference {
  sequence: number;
  reference: string | null;
  description: string;
  detail: string | null;
  quantity: number | null;
  sourcePages: number[];
  evidence: StructuredEvidence[];
}

export interface StructuredIssue {
  sequence: number;
  code: StructuredIssueCode;
  message: string;
  itemSequence: number | null;
  pageNumbers: number[];
}

export interface StructuredConflict {
  sequence: number;
  code: StructuredConflictCode;
  message: string;
  itemSequences: number[];
  pageNumbers: number[];
}

export interface StructuredSummary {
  itemCount: number;
  documentReferenceCount: number;
  itemsRequiringReview: number;
  knownQuoteableUnitCount: number;
  issueCount: number;
  conflictCount: number;
}

export interface StructuredProcessingMetadata {
  method: string;
  durationMs: number;
}

export interface StructuredExtractionDetails {
  structuredExtractionId: string;
  sourceProcessingAttemptId: string;
  isFromLatestAttempt: boolean;
  status: StructuredExtractionStatus;
  project: StructuredProject;
  requirements: StructuredRequirement[];
  items: StructuredItem[];
  documentReferences: StructuredDocumentReference[];
  issues: StructuredIssue[];
  conflicts: StructuredConflict[];
  summary: StructuredSummary;
  processingMetadata: StructuredProcessingMetadata;
  createdAtUtc: string;
}

export interface StructuredDocument {
  documentId: string;
  preQuoteId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAtUtc: string;
}

export interface StructuredDocumentExtractionDetailsResponse {
  document: StructuredDocument;
  processingAvailability: DocumentProcessingAvailability;
  latestAttempt: DocumentProcessingAttemptSummary | null;
  structuredExtraction: StructuredExtractionDetails | null;
}
