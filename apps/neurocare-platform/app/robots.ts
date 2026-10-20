import type { MetadataRoute } from "next";

/**
 * The patient portal contains private care data. It is excluded from indexing.
 * This is defence in depth only — the real protection is the backend
 * authentication and authorisation boundary.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
