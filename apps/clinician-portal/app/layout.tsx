import type { Metadata } from "next";
import "@neurocare/clarity/tokens.css";
import "./styles.css";

export const metadata: Metadata = {
  title: "NeuroCare Clinical Workstation",
  description:
    "Clinical workstation for ADHD assessment, titration and follow-up: caseload, patient workspace, questionnaire review, document review and clinical tasks.",
  applicationName: "NeuroCare Clinical Workstation",
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
