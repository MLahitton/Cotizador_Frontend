export type DocumentProcessingAvailability =
  | "NOT_PROCESSED"
  | "PENDING"
  | "PROCESSING"
  | "FAILED"
  | "LEGACY_ONLY"
  | "AVAILABLE_CURRENT"
  | "AVAILABLE_PREVIOUS";

export type DocumentProcessingState = "PENDING" | "PROCESSING" | "FINISHED";

export type DocumentProcessingOutcome =
  | "COMPLETED"
  | "REQUIRES_REVIEW"
  | "FAILED";

export type PdfClassification = "PDF_TEXT" | "PDF_SCANNED" | "PDF_MIXED";

export type StructuredExtractionStatus = "COMPLETED" | "REQUIRES_REVIEW";

export interface DocumentExtractionResultMetadata {
  schemaVersion: string;
  classification: PdfClassification;
  requiresOcr: boolean;
  pageCount: number;
  processingMethod: string;
  durationMs: number;
}

export interface DocumentProcessingAttemptSummary {
  processingAttemptId: string;
  processingState: DocumentProcessingState;
  outcome: DocumentProcessingOutcome | null;
  errorCode: string | null;
  createdAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  resultMetadata: DocumentExtractionResultMetadata | null;
}

export interface StructuredExtractionSummary {
  structuredExtractionId: string;
  sourceProcessingAttemptId: string;
  isFromLatestAttempt: boolean;
  status: StructuredExtractionStatus;
  projectName: string | null;
  clientName: string | null;
  location: string | null;
  itemCount: number;
  documentReferenceCount: number;
  itemsRequiringReview: number;
  knownQuoteableUnitCount: number;
  issueCount: number;
  conflictCount: number;
  processingMethod: string;
  durationMs: number;
  createdAtUtc: string;
}

export interface PreQuoteDocumentListItem {
  documentId: string;
  preQuoteId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAtUtc: string;
  processingAvailability: DocumentProcessingAvailability;
  latestAttempt: DocumentProcessingAttemptSummary | null;
  structuredExtractionSummary: StructuredExtractionSummary | null;
}

export interface PreQuoteDocumentsPage {
  items: PreQuoteDocumentListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetPreQuoteDocumentsParameters {
  preQuoteId: string;
  page: number;
  pageSize: number;
}
