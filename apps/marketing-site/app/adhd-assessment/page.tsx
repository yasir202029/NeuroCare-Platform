import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "ADHD assessment | NeuroCare",
  description: "What a remote ADHD assessment involves: referral review, questionnaires, clinical interview, differential reasoning, formulation and a written outcome.",
  alternates: { canonical: canonical("/adhd-assessment") },
  openGraph: {
    title: "ADHD assessment | NeuroCare",
    description: "What a remote ADHD assessment involves: referral review, questionnaires, clinical interview, differential reasoning, formulation and a written outcome.",
    url: canonical("/adhd-assessment"),
    type: "website",
  },
};

export default function AdhdAssessmentPage() {
  const page = pageByPath("/adhd-assessment")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/adhd-assessment"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "ADHD assessment", path: "/adhd-assessment" }]} />
        <section className="mkt-hero">
          <h1>ADHD assessment</h1>
          <p>
            A structured assessment by a qualified clinician, using your referral, your questionnaires
            and your evidence — followed by a written outcome you can read in your portal.
          </p>
          <div className="mkt-actions">
            <Link className="mkt-btn mkt-btn--primary" href="/how-it-works">
              See how the pathway works
            </Link>
            <Link className="mkt-btn mkt-btn--secondary" href="/eligibility">
              Check eligibility
            </Link>
          </div>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="involves-heading">
          <h2 id="involves-heading">What the assessment involves</h2>
          <ul>
            <li>Review of your referral, GP details and any information you have uploaded.</li>
            <li>Structured clinical interview covering developmental history, symptoms and impairment across settings.</li>
            <li>Review of your questionnaires and any supporting evidence you provided.</li>
            <li>Reasoning about differential considerations alongside your clinical formulation.</li>
            <li>A written outcome recording the assessment, formulation, recommendations and follow-up plan.</li>
          </ul>
          <p>
            Questionnaire scores support the assessment but never determine a diagnosis on their own.
            The clinical decision is made by the clinician who assessed you.
          </p>
        </section>

        <section className="mkt-section" aria-labelledby="assessment-faq-heading">
          <h2 id="assessment-faq-heading">Questions about assessment</h2>
          <FaqList entries={page.faq ?? []} />
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
