import type { Metadata, Viewport } from "next";
import "@neurocare/clarity/tokens.css";
import "./styles.css";
export const metadata: Metadata = {
  title: "NeuroCare Clinical Workstation",
  description:
    "Clinical workstation for ADHD assessment, titration and follow-up: caseload, patient workspace, questionnaire review, document review and clinical tasks.",
  applicationName: "NeuroCare Clinical Workstation",
    robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#145742",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
