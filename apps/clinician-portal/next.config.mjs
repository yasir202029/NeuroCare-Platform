import { resolve } from "node:path";

/**
 * The API is proxied through this app so the browser always talks to its own
 * origin — no CORS preflight, and the backend's internal address (for example
 * http://backend:4000 inside Docker) is never exposed to the client.
 *
 * API_INTERNAL_URL is server-side only and takes precedence; it is the
 * address the Next server uses to reach the backend. NEXT_PUBLIC_API_BASE_URL
 * remains the browser-visible address for anything that must reach the API
 * directly.
 */
const configuredTarget = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

const apiTarget = configuredTarget.endsWith("/api/v1")
  ? configuredTarget.slice(0, -"/api/v1".length)
  : configuredTarget;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: resolve(process.cwd(), "../.."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};
export default config;
