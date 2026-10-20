import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Accessibility statement | NeuroCare",
  description: "The accessibility approach for the NeuroCare website and patient portal, including known limitations and how to report a barrier.",
  alternates: { canonical: canonical("/accessibility") },
  openGraph: {
    title: "Accessibility statement | NeuroCare",
    description: "The accessibility approach for the NeuroCare website and patient portal, including known limitations and how to report a barrier.",
    url: canonical("/accessibility"),
    type: "website",
  },
};

export default function AccessibilityPage() {
  const page = pageByPath("/accessibility")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/accessibility"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Accessibility", path: "/accessibility" }]} />
        <section className="mkt-hero">
          <h1>Accessibility statement</h1>
          <p>
            We aim to make the website and patient portal usable by as many people as possible,
            including people who use assistive technology.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="approach-heading">
          <h2 id="approach-heading">Our approach</h2>
          <ul>
            <li>Semantic landmarks and a skip link on every public page.</li>
            <li>Visible keyboard focus indicators and logical focus order.</li>
            <li>Status information conveyed in text, not by colour alone.</li>
            <li>Content written at a plain reading level where possible.</li>
            <li>Layouts that reflow on small screens and at increased zoom.</li>
            <li>Motion reduced when your device requests reduced motion.</li>
          </ul>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading">Known limitations</h2>
          <p>
            Some parts of the patient portal are still being improved, in particular the onboarding
            forms and the clinician-facing workspace. If something does not work for you, please tell
            us and we will arrange an alternative.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="report-heading">
          <h2 id="report-heading">Reporting a barrier</h2>
          <p>
            If you encounter an accessibility barrier, contact us through the contact page and
            describe the page and the problem. We will respond and work towards a fix.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
