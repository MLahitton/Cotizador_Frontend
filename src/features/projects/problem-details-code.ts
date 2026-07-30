import type { ApiProblemDetails } from "@/lib/http/api-error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getProblemDetailsCode(
  problemDetails: ApiProblemDetails | undefined,
): string | null {
  if (!isRecord(problemDetails)) {
    return null;
  }

  const code = problemDetails.code;
  if (typeof code !== "string") {
    return null;
  }

  const trimmedCode = code.trim();
  return trimmedCode.length > 0 ? trimmedCode : null;
}
