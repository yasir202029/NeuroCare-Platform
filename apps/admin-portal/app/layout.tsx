import type { Metadata } from "next";
import "@neurocare/clarity/tokens.css";
import "./styles.css";

export const metadata: Metadata = {
  title: "NeuroCare Operations — Admin workstation",
  description:
    "Operational command centre for the NeuroCare remote ADHD clinic: patient pipeline, booking exceptions, workforce, finance, access and audit.",
  applicationName: "NeuroCare Operations",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
