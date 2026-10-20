import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Privacy notice | NeuroCare",
  description: "How NeuroCare processes personal data, the lawful bases used, retention periods, and how to exercise your UK data-protection rights.",
  alternates: { canonical: canonical("/privacy") },
  openGraph: {
    title: "Privacy notice | NeuroCare",
    description: "How NeuroCare processes personal data, the lawful bases used, retention periods, and how to exercise your UK data-protection rights.",
    url: canonical("/privacy"),
    type: "website",
  },
};

export default function PrivacyPage() {
  const page = pageByPath("/privacy")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/privacy"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Privacy notice", path: "/privacy" }]} />
        <section className="mkt-hero">
          <h1>Privacy notice</h1>
          <p>
            This notice explains what personal data the service holds, why it is held, and what you
            can ask us to do with it.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="what-heading">
          <h2 id="what-heading">What we hold</h2>
          <ul>
            <li>Identity and contact details you provide, including your GP practice details.</li>
            <li>Assessment records, clinical notes, observations, correspondence and prescriptions.</li>
            <li>Questionnaire responses and the version of each questionnaire you completed.</li>
            <li>Documents you upload, and records of who accessed them.</li>
            <li>Consent decisions, including the version of each policy you agreed to.</li>
            <li>Audit records of access to and changes within your record.</li>
          </ul>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="why-heading">
          <h2 id="why-heading">Why we hold it</h2>
          <p>
            Special-category health data is processed on the basis of your consent for diagnosis and
            treatment, and on the basis of statutory and contractual obligations where applicable.
            Data is minimised to what is needed to deliver and govern the service.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="rights-heading">
          <h2 id="rights-heading">Your rights</h2>
          <ul>
            <li>Ask for a copy of the data we hold about you.</li>
            <li>Ask us to correct inaccurate data.</li>
            <li>Ask us to delete data where we are not required to keep it.</li>
            <li>Ask us to restrict processing while a concern is investigated.</li>
            <li>Receive data in a portable format.</li>
            <li>Object to processing, and withdraw consent at any time.</li>
          </ul>
          <p>
            Requests are handled through your patient portal or by contacting the team. You also have
            the right to complain to the Information Commissioner&rsquo;s Office.
          </p>
        </section>

        <div className="mkt-note">
          <strong>Note on this document</strong>
          <p style={{ margin: 0 }}>
            This notice describes the service in general terms. The specific processing that applies to
            your care is recorded in your own consent decisions in your patient portal.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
