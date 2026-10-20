import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "./marketing-ui";
import { buildJsonLd } from "./seo";
import { canonical, pageByPath } from "./content";

export const metadata: Metadata = {
  title: "Remote ADHD assessment and treatment | NeuroCare",
  description:
    "A remote ADHD pathway covering referral, assessment, clinical review, medication titration and ongoing monitoring, delivered by a remote clinical team.",
  alternates: { canonical: canonical("/") },
  openGraph: {
    title: "Remote ADHD assessment and treatment | NeuroCare",
    description:
      "A remote ADHD pathway covering referral, assessment, clinical review, medication titration and ongoing monitoring.",
    url: canonical("/"),
    type: "website",
  },
};

const pathway = [
  { title: "Register and consent", body: "Create your record, give consent and provide your GP practice details." },
  { title: "Complete questionnaires", body: "Structured questionnaires help the clinician understand your history before the appointment." },
  { title: "Upload evidence", body: "Share school reports, previous assessments or other records that support your referral." },
  { title: "Clinical assessment", body: "A structured clinical interview covering development, symptoms across settings and impairment." },
  { title: "Clinical review and outcome", body: "A clinician reviews the record and records a written outcome, formulation and recommendations." },
  { title: "Treatment and monitoring", body: "Where appropriate, treatment planning, medication titration and ongoing clinical review." },
];

export default function HomePage() {
  const page = pageByPath("/")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <section className="mkt-hero">
          <h1>Remote ADHD assessment and treatment, without the waiting room</h1>
          <p>
            A structured pathway from referral through assessment, diagnosis and — where clinically
            appropriate — treatment and ongoing review, delivered remotely by a clinical team.
          </p>
          <div className="mkt-actions">
            <Link className="mkt-btn mkt-btn--primary" href="/how-it-works">
              See how the pathway works
            </Link>
            <Link className="mkt-btn mkt-btn--secondary" href="/eligibility">
              Check whether it suits you
            </Link>
          </div>
        </section>

        <section className="mkt-section" aria-labelledby="pathway-heading">
          <h2 id="pathway-heading">The pathway</h2>
          <p className="mkt-section__lede">
            Each step is delivered through your patient portal. You always know what is outstanding and
            what happens next.
          </p>
          <ol className="mkt-steps">
            {pathway.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <p className="mkt-section__lede" style={{ margin: "4px 0 0" }}>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mkt-section" aria-labelledby="services-heading">
          <h2 id="services-heading">What we do</h2>
          <div className="mkt-grid">
            <article className="mkt-card">
              <h3>ADHD assessment</h3>
              <p>
                Structured clinical interview, review of your questionnaires and evidence, and a written
                outcome with a clear clinical formulation.
              </p>
              <p>
                <Link href="/adhd-assessment">About ADHD assessment</Link>
              </p>
            </article>
            <article className="mkt-card">
              <h3>Treatment and titration</h3>
              <p>
                Where assessment supports it, a prescriber reviews the record and agrees a treatment
                plan with monitored reviews.
              </p>
              <p>
                <Link href="/adhd-treatment">About treatment and titration</Link>
              </p>
            </article>
            <article className="mkt-card">
              <h3>Transparent pricing</h3>
              <p>
                You can see what each stage costs and when payment is taken before you commit to a
                step.
              </p>
              <p>
                <Link href="/pricing">See pricing</Link>
              </p>
            </article>
          </div>
        </section>

        <section className="mkt-section" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Common questions</h2>
          <p className="mkt-section__lede">
            These answers are also published on the dedicated FAQ page.
          </p>
          <FaqList entries={page.faq ?? []} />
          <p>
            <Link href="/faq">See all questions</Link>
          </p>
        </section>

        <div className="mkt-note">
          <strong>If you need urgent help</strong>
          <p style={{ margin: 0 }}>
            This service is not for emergencies. If you need urgent medical attention, contact your GP
            or NHS 111. If you are in crisis, contact Samaritans or 999.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
