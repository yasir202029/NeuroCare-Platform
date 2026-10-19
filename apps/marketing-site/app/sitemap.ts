import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://neurocare.example.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
