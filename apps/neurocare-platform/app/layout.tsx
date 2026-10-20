import type { Metadata } from "next";
import "./styles.css";
import { SkipLink } from "../components/accessibility";

const siteName = "NeuroCare Platform";
const siteDescription =
  "Connected patient and clinical operations for remote ADHD assessment, titration, and shared care in the UK.";
const siteUrl = process.env.APP_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    template: "%s | NeuroCare Platform",
    default: "NeuroCare Platform — Remote ADHD Assessment & Shared Care",
  },
  description: siteDescription,
  keywords: [
    "ADHD assessment",
    "remote clinic",
    "shared care",
    "titration",
    "mental health",
    "UK clinic",
    "neurocare",
    "clinical workflow",
    "patient portal",
  ],
  authors: [{ name: "NeuroCare Platform", url: siteUrl }],
  creator: "NeuroCare Platform",
  publisher: "NeuroCare Platform",
  // Private patient surface: excluded from indexing. Authentication and
  // authorisation on the backend remain the actual protection.
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "NeuroCare Platform — Remote ADHD Assessment & Shared Care",
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: `${siteUrl}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "NeuroCare Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuroCare Platform — Remote ADHD Assessment & Shared Care",
    description: siteDescription,
    images: [`${siteUrl}/opengraph-image.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "health",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalOrganization",
              name: siteName,
              url: siteUrl,
              description: siteDescription,
              telephone: "",
              address: {
                "@type": "PostalAddress",
                addressCountry: "GB",
              },
              specialty: "Mental Health",
              availableService: [
                {
                  "@type": "MedicalProcedure",
                  name: "ADHD Assessment",
                },
                {
                  "@type": "MedicalProcedure",
                  name: "Medication Titration",
                },
                {
                  "@type": "MedicalProcedure",
                  name: "Shared Care",
                },
              ],
              founder: {
                "@type": "Organization",
                name: siteName,
              },
            }),
          }}
        />
      </head>
      <body>
        <SkipLink />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-#ffffff focus:text-#145742 focus:border focus:border-#145742 focus:rounded-md focus:font-semibold focus:text-sm"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
