import type { Metadata } from "next";
import "./styles.css";
import { ORG_DESCRIPTION, SITE_NAME, SITE_URL } from "./content";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Remote ADHD assessment and treatment`,
    template: `%s | ${SITE_NAME}`,
  },
  description: ORG_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    url: SITE_URL,
    title: `${SITE_NAME} — Remote ADHD assessment and treatment`,
    description: ORG_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Remote ADHD assessment and treatment`,
    description: ORG_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "medical",
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
