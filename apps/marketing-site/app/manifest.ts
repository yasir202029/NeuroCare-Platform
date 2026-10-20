import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "./content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Remote ADHD assessment and treatment`,
    short_name: SITE_NAME,
    description:
      "Remote ADHD assessment and treatment pathway: referral, assessment, clinical review, medication titration and ongoing monitoring.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#1f4f8f",
    lang: "en-GB",
    dir: "ltr",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
