import { NextResponse } from "next/server";

// Server-side only: inside Docker this is the backend service name
// (http://backend:4000); localhost is not reachable from the app container.
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

export function refreshTokenFromRequest(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("neurocare_refresh="))
    ?.slice("neurocare_refresh=".length);
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
