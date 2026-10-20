import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NeuroCare — remote ADHD assessment and treatment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card for the public marketing site.
 * Deliberately minimal and factual — no claims, ratings or statistics.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1f4f8f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -0.02 }}>
          NeuroCare
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.03 }}>
            Remote ADHD assessment and treatment
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#d9e4f5" }}>
            Assessment, clinical review, medication titration and ongoing monitoring.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#b9cbe8" }}>
          neurocare.example.com
        </div>
      </div>
    ),
    size,
  );
}
