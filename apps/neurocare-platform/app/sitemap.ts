import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const routes = ["", "/patient", "/patient/journey", "/patient/book", "/documents", "/onboarding", "/login"];
  return routes.map((r) => ({ url: `${base}${r}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: r === "" ? 1 : 0.7 }));
}
