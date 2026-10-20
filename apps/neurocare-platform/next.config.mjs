import { resolve } from "node:path";

/**
 * The API is proxied through this app so the browser always talks to its own
 * origin. API_INTERNAL_URL is server-side only and takes precedence — inside
 * Docker it points at the backend service (http://backend:4000) rather than
 * localhost, which is not reachable from the app container.
 */
const configuredTarget = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

const apiTarget = configuredTarget.endsWith("/api/v1")
  ? configuredTarget.slice(0, -"/api/v1".length)
  : configuredTarget;

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
