import { Badge } from "@/components/ui/badge";
import type {
  DocumentProcessingAvailability,
  StructuredExtractionStatus,
} from "@/features/prequotes/prequote-documents-types";
import {
  formatProcessingAvailability,
  formatStructuredExtractionStatus,
} from "@/features/prequotes/prequote-document-formatters";

function availabilityTone(value: DocumentProcessingAvailability) {
  switch (value) {
    case "AVAILABLE_CURRENT":
      return "success";
    case "AVAILABLE_PREVIOUS":
    case "LEGACY_ONLY":
      return "info";
    case "PENDING":
    case "PROCESSING":
      return "warning";
    case "FAILED":
      return "danger";
    case "NOT_PROCESSED":
      return "neutral";
  }
}

function structuredTone(value: StructuredExtractionStatus) {
  switch (value) {
    case "COMPLETED":
      return "success";
    case "REQUIRES_REVIEW":
      return "warning";
  }
}

export function ProcessingAvailabilityBadge({
  value,
}: {
  value: DocumentProcessingAvailability;
}) {
  return (
    <Badge tone={availabilityTone(value)} size="sm">
      {formatProcessingAvailability(value)}
    </Badge>
  );
}

export function StructuredExtractionStatusBadge({
  value,
}: {
  value: StructuredExtractionStatus;
}) {
  return (
    <Badge tone={structuredTone(value)} size="sm">
      {formatStructuredExtractionStatus(value)}
    </Badge>
  );
}
