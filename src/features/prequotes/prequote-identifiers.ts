import { isValidUuid } from "@/features/projects/project-identifiers";

export function isValidPreQuoteId(value: string): boolean {
  return isValidUuid(value);
}
