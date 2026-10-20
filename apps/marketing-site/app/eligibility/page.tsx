import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Am I eligible for remote ADHD assessment? | NeuroCare",
  description: "Who remote ADHD assessment is suitable for, what is excluded, and what to check before starting.",
  alternates: { canonical: canonical("/eligibility") },
  openGraph: {
    title: "Am I eligible for remote ADHD assessment? | NeuroCare",
    description: "Who remote ADHD assessment is suitable for, what is excluded, and what to check before starting.",
    url: canonical("/eligibility"),
    type: "website",
  },
};

export default function EligibilityPage() {
  const page = pageByPath("/eligibility")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/eligibility"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Eligibility", path: "/eligibility" }]} />
        <section className="mkt-hero">
          <h1>Is remote assessment right for you?</h1>
          <p>
            Remote assessment suits many people. Some people are better assessed in person, or by a
            different service, and we will say so.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="suited-heading">
          <h2 id="suited-heading">Remote assessment is usually suitable when</h2>
          <ul>
            <li>You have a referral from a GP or a recognised provider.</li>
            <li>You are comfortable with video appointments and can complete questionnaires online.</li>
            <li>You can give a clear account of your childhood and current symptoms.</li>
            <li>You can attend appointments at agreed times.</li>
          </ul>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="not-suited-heading">
          <h2 id="not-suited-heading">Remote assessment may not be suitable when</h2>
          <ul>
            <li>A physical examination or blood test is needed as part of the assessment.</li>
            <li>You need medication that can only be prescribed and monitored in person.</li>
            <li>You need urgent support — please contact your GP or NHS 111 instead.</li>
            <li>You are not able to take part in a video appointment.</li>
          </ul>
          <div className="mkt-note">
            <strong>Eligibility is confirmed clinically</strong>
            <p style={{ margin: 0 }}>
              These are general guidelines. A clinician reviews your referral against the service
              criteria before you are booked.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
