import { apiRequest } from "@/lib/http/api-client";
import type {
  AuthenticatedUser,
  GoogleSignInRequest,
  GoogleSignInResponse,
} from "@/features/auth/auth-types";
import { ApiError } from "@/lib/http/api-error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUser(value: unknown): AuthenticatedUser {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    typeof value.firstName !== "string" ||
    !(typeof value.lastName === "string" || value.lastName === null) ||
    !(
      typeof value.profilePictureUrl === "string" ||
      value.profilePictureUrl === null
    ) ||
    typeof value.isActive !== "boolean"
  ) {
    throw invalidResponseError();
  }

  return {
    id: value.id,
    email: value.email,
    firstName: value.firstName,
    lastName: value.lastName,
    profilePictureUrl: value.profilePictureUrl,
    isActive: value.isActive,
  };
}

function invalidResponseError(): ApiError {
  return new ApiError({
    status: 0,
    title: "Respuesta inválida",
    detail: "El servidor devolvió una respuesta inesperada.",
  });
}

export async function signInWithGoogleRequest(
  idToken: string,
): Promise<GoogleSignInResponse> {
  const body: GoogleSignInRequest = { idToken };
  const value = await apiRequest("/api/v1/auth/google", {
    method: "POST",
    body,
  });

  if (
    !isRecord(value) ||
    typeof value.accessToken !== "string" ||
    typeof value.tokenType !== "string" ||
    typeof value.expiresAtUtc !== "string" ||
    typeof value.isNewUser !== "boolean"
  ) {
    throw invalidResponseError();
  }

  return {
    accessToken: value.accessToken,
    tokenType: value.tokenType,
    expiresAtUtc: value.expiresAtUtc,
    isNewUser: value.isNewUser,
    user: parseUser(value.user),
  };
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const value = await apiRequest("/api/v1/auth/me", {
    authenticated: true,
  });
  return parseUser(value);
}
