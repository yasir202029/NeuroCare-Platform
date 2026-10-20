import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "ADHD treatment and medication titration | NeuroCare",
  description: "What happens after an assessment: treatment planning, medication titration with monitored reviews, and ongoing clinical review.",
  alternates: { canonical: canonical("/adhd-treatment") },
  openGraph: {
    title: "ADHD treatment and medication titration | NeuroCare",
    description: "What happens after an assessment: treatment planning, medication titration with monitored reviews, and ongoing clinical review.",
    url: canonical("/adhd-treatment"),
    type: "website",
  },
};

export default function AdhdTreatmentPage() {
  const page = pageByPath("/adhd-treatment")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/adhd-treatment"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "ADHD treatment", path: "/adhd-treatment" }]} />
        <section className="mkt-hero">
          <h1>ADHD treatment and medication titration</h1>
          <p>
            Where an assessment supports it, treatment is planned with you and reviewed over time —
            with monitored doses, recorded responses and a clear next step at every review.
          </p>
          <div className="mkt-actions">
            <Link className="mkt-btn mkt-btn--primary" href="/how-it-works">
              See how the pathway works
            </Link>
            <Link className="mkt-btn mkt-btn--secondary" href="/pricing">
              See pricing
            </Link>
          </div>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="treatment-involves-heading">
          <h2 id="treatment-involves-heading">What treatment involves</h2>
          <ul>
            <li>A treatment plan agreed with you after the clinical review.</li>
            <li>Prescribing decisions taken by an authorised prescriber, never automatically.</li>
            <li>Titration reviews that record your response, side effects and physical observations.</li>
            <li>Agreed review intervals, with adjustments, pauses or discontinuation considered where appropriate.</li>
          </ul>
          <div className="mkt-note">
            <strong>Monitoring between reviews</strong>
            <p style={{ margin: 0 }}>
              You may be asked to submit observations and information between reviews. Anything you
              record is kept separate from observations verified by a clinician.
            </p>
          </div>
        </section>

        <section className="mkt-section" aria-labelledby="treatment-faq-heading">
          <h2 id="treatment-faq-heading">Questions about treatment</h2>
          <FaqList entries={page.faq ?? []} />
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
