import { resolve } from "node:path";

const apiTarget =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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
