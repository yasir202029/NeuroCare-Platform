"use client";

/**
 * Client-side session helpers for the clinician workstation.
 *
 * The access token is kept in sessionStorage so a shared workstation does not
 * keep a signed-in session beyond the browser tab. The backend also accepts
 * the `neurocare_access` cookie, so the Authorization header is only sent
 * when a token is actually present — an empty `Bearer ` header would
 * otherwise stop the backend from falling back to the cookie.
 */

export const ACCESS_TOKEN_KEY = "neurocare.accessToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };
}
