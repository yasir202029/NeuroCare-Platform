import { MetadataRoute } from "next";

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

const pages = [
  "",
  "/patient",
  "/clinician",
  "/prescriber",
  "/titration",
  "/admin",
  "/finance",
  "/engine",
  "/workflows",
  "/states",
  "/rules",
  "/events",
  "/tasks",
  "/uk-adhd",
  "/risk-ranking",
  "/ai-insights",
  "/medication-safety",
  "/letter-generator",
  "/saas-admin",
  "/onboarding",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date().toISOString(),
    changeFrequency: page === "" ? "daily" : "weekly",
    priority: page === "" ? 1 : page === "/patient" || page === "/clinician" ? 0.9 : 0.8,
  }));
}
