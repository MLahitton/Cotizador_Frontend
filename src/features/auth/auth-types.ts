export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
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
