import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "How the pathway works | NeuroCare",
  description: "A step-by-step description of the NeuroCare ADHD pathway, from registration through assessment, treatment and ongoing review.",
  alternates: { canonical: canonical("/how-it-works") },
  openGraph: {
    title: "How the pathway works | NeuroCare",
    description: "A step-by-step description of the NeuroCare ADHD pathway, from registration through assessment, treatment and ongoing review.",
    url: canonical("/how-it-works"),
    type: "website",
  },
};

export default function HowItWorksPage() {
  const page = pageByPath("/how-it-works")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/how-it-works"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "How it works", path: "/how-it-works" }]} />
        <section className="mkt-hero">
          <h1>How the pathway works</h1>
          <p>
            Every stage happens in your patient portal, which always shows what is outstanding and what
            happens next.
          </p>
        </section>

        <section className="mkt-section" aria-labelledby="steps-heading">
          <h2 id="steps-heading">The steps</h2>
          <ol className="mkt-steps">
            <li>
              <strong>Create your record</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Register with your email, verify your address and record your personal details.
              </p>
            </li>
            <li>
              <strong>Eligibility and consent</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                We check the referral against the service criteria, then record your consent
                decisions with the version of each policy you agreed to.
              </p>
            </li>
            <li>
              <strong>GP details and payment</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                We record your GP practice so results can be shared, and take payment for the
                assessment stage.
              </p>
            </li>
            <li>
              <strong>Book your assessment</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Choose an available appointment time that works for you.
              </p>
            </li>
            <li>
              <strong>Questionnaires and evidence</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Complete the questionnaires and upload any supporting evidence before the
                appointment.
              </p>
            </li>
            <li>
              <strong>Assessment</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Meet the clinician for a structured remote assessment.
              </p>
            </li>
            <li>
              <strong>Outcome and treatment planning</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Read your written outcome. If treatment is recommended, a plan is agreed and, where
                appropriate, medication is titrated with monitored reviews.
              </p>
            </li>
            <li>
              <strong>Ongoing review, transfer or discharge</strong>
              <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                Reviews continue at agreed intervals, or care is transferred to your GP or another
                service.
              </p>
            </li>
          </ol>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
