import { Badge } from "@/components/ui/badge";
import {
  formatStructuredStatus,
} from "@/features/prequotes/structured-extraction-formatters";
import type { StructuredExtractionStatus } from "@/features/prequotes/structured-extraction-types";

export function StructuredExtractionStatusBadge({
  value,
}: {
  value: StructuredExtractionStatus;
}) {
  return (
    <Badge tone={value === "COMPLETED" ? "success" : "warning"} size="sm">
      {formatStructuredStatus(value)}
    </Badge>
  );
}
