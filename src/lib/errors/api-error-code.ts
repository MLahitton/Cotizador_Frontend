import { ApiError } from "@/lib/http/api-error";

export const API_ERROR_CODES = {
  unauthorized: "AUTH_UNAUTHORIZED",
  inactiveUser: "AUTH_USER_INACTIVE",
  internalServerError: "INTERNAL_SERVER_ERROR",
  unsupportedMediaType: "API_UNSUPPORTED_MEDIA_TYPE",
  methodNotAllowed: "API_METHOD_NOT_ALLOWED",
  payloadTooLarge: "API_PAYLOAD_TOO_LARGE",
  routeNotFound: "API_ROUTE_NOT_FOUND",
} as const;

export function getApiErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const errorCode = error.problemDetails?.errorCode;

  if (typeof errorCode !== "string") {
    return null;
  }

  const trimmedErrorCode = errorCode.trim();
  return trimmedErrorCode.length > 0 ? trimmedErrorCode : null;
}
