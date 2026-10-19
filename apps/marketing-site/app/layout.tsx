import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "NeuroCare Platform — Remote ADHD Clinic",
  description: "Advanced remote ADHD clinic platform: assessments, titration, prescribing, shared care, and finance — UK GDPR compliant.",
  keywords: ["ADHD", "remote clinic", "telehealth", "titration", "prescribing", "NICE"],
  openGraph: {
    title: "NeuroCare Platform — Remote ADHD Clinic",
    description: "Advanced remote ADHD clinic platform for clinicians and patients.",
    type: "website",
    locale: "en_GB",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
