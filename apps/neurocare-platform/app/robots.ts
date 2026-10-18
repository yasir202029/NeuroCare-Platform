import { MetadataRoute } from "next";

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/_next/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
