export const PROJECT_ERROR_CODES = {
  invalidRequest: "PROJECT_INVALID_REQUEST",
  unauthorized: "AUTH_UNAUTHORIZED",
  inactiveUser: "AUTH_USER_INACTIVE",
  internalServerError: "INTERNAL_SERVER_ERROR",
  methodNotAllowed: "API_METHOD_NOT_ALLOWED",
  payloadTooLarge: "API_PAYLOAD_TOO_LARGE",
  clientNotFound: "PROJECT_CLIENT_NOT_FOUND",
  clientInactive: "PROJECT_CLIENT_INACTIVE",
  projectNotFound: "PROJECT_NOT_FOUND",
  duplicateCode: "PROJECT_CODE_DUPLICATE",
  queryError: "PROJECT_QUERY_ERROR",
  persistenceError: "PROJECT_PERSISTENCE_ERROR",
} as const;

export type ProjectErrorCode =
  (typeof PROJECT_ERROR_CODES)[keyof typeof PROJECT_ERROR_CODES];
