import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Pricing and payment | NeuroCare",
  description: "How assessment and treatment are charged, when payment is taken, and what is included.",
  alternates: { canonical: canonical("/pricing") },
  openGraph: {
    title: "Pricing and payment | NeuroCare",
    description: "How assessment and treatment are charged, when payment is taken, and what is included.",
    url: canonical("/pricing"),
    type: "website",
  },
};

export default function PricingPage() {
  const page = pageByPath("/pricing")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/pricing"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Pricing", path: "/pricing" }]} />
        <section className="mkt-hero">
          <h1>Pricing and payment</h1>
          <p>
            We explain what each stage costs before you commit to it. You are not charged for
            anything you have not agreed to.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="charges-heading">
          <h2 id="charges-heading">How charges work</h2>
          <ul>
            <li>
              <strong>Assessment stage.</strong> Payment is taken when you book the assessment, after
              eligibility and consent have been recorded.
            </li>
            <li>
              <strong>Treatment stage.</strong> Where treatment is recommended, the charges for
              prescribing and reviews are explained and agreed before they begin.
            </li>
            <li>
              <strong>Clinician reviews.</strong> Each review is charged separately and is listed with
              its cost before you attend.
            </li>
          </ul>
          <div className="mkt-note">
            <strong>Specific prices</strong>
            <p style={{ margin: 0 }}>
              Current prices for each stage are shown in your patient portal before payment, and are
              also confirmed with you by the team. Nothing is charged without your agreement.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
