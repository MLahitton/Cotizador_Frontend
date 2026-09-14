export type UserRole = "USER" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  role: UserRole;
}

export interface GoogleSignInRequest {
  idToken: string;
}

export interface GoogleSignInResponse {
  accessToken: string;
  tokenType: string;
  expiresAtUtc: string;
  isNewUser: boolean;
  user: AuthenticatedUser;
}