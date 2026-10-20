import { NextResponse } from "next/server";

/**
 * Server-side helpers for the clinician workstation's own auth routes.
 *
 * The backend base URL is resolved on the server so the internal address
 * (e.g. http://backend:4000 inside Docker) never reaches the browser bundle.
 */
const apiBase = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

const secureCookie = process.env.NODE_ENV === "production" ? "; Secure" : "";

export async function forwardAuthRequest(path: string, body?: unknown) {
  const response = await fetch(`${apiBase}/api/v1/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response
    .json()
    .catch(() => ({ message: "Authentication service unavailable." }));
  return { response, payload };
}

export function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  response.headers.append(
    "Set-Cookie",
    `neurocare_access=${tokens.accessToken}; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=900${secureCookie}`,
  );
  response.headers.append(
    "Set-Cookie",
    `neurocare_refresh=${tokens.refreshToken}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=2592000${secureCookie}`,
  );
}

export function clearSessionCookies(response: NextResponse) {
  response.headers.append(
    "Set-Cookie",
    `neurocare_access=; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=0${secureCookie}`,
  );
  response.headers.append(
    "Set-Cookie",
    `neurocare_refresh=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0${secureCookie}`,
  );
}
