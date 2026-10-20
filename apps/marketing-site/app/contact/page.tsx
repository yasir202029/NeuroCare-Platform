import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Contact the NeuroCare team",
  description: "How to contact NeuroCare about the ADHD pathway, existing assessments, or support with an appointment.",
  alternates: { canonical: canonical("/contact") },
  openGraph: {
    title: "Contact the NeuroCare team",
    description: "How to contact NeuroCare about the ADHD pathway, existing assessments, or support with an appointment.",
    url: canonical("/contact"),
    type: "website",
  },
};

export default function ContactPage() {
  const page = pageByPath("/contact")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/contact"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Contact", path: "/contact" }]} />
        <section className="mkt-hero">
          <h1>Contact us</h1>
          <p>
            If you are already registered, the quickest route is the messages area of your patient
            portal, which is linked to your record.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Getting help</h2>
          <ul>
            <li>
              <strong>Existing patients.</strong> Use the messages area in your patient portal so your
              question is linked to your record and reaches the right team.
            </li>
            <li>
              <strong>Before you register.</strong> Use the enquiry form on this page and tell us what
              you need help with.
            </li>
            <li>
              <strong>Urgent medical concerns.</strong> Contact your GP or NHS 111. This service is
              not for emergencies.
            </li>
          </ul>
          <div className="mkt-note">
            <strong>Please do not send clinical detail by email</strong>
            <p style={{ margin: 0 }}>
              Messages sent through the patient portal are seen by the clinical team and recorded
              against your record.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
