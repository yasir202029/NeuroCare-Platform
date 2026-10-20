import type { MetadataRoute } from "next";

/**
 * Private application surface. Not indexed and no sitemap emitted.
 * Authentication and authorisation remain the actual protection.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
