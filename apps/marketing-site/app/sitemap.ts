import type { MetadataRoute } from "next";
import { SITE_URL, publicPages } from "./content";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: `${SITE_URL}${page.path === "/" ? "" : page.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: page.path === "/" ? 1 : 0.7,
  }));
}
