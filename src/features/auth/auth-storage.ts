const ACCESS_TOKEN_KEY = "sng.auth.access_token";

export const UNAUTHORIZED_EVENT_NAME = "sng:auth:unauthorized";

let unauthorizedNotificationSent = false;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(accessToken: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  unauthorizedNotificationSent = false;
}

export function removeAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function notifyUnauthorized(): void {
  if (typeof window === "undefined" || unauthorizedNotificationSent) {
    return;
  }

  unauthorizedNotificationSent = true;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT_NAME));
}
