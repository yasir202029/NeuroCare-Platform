import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Frequently asked questions | NeuroCare",
  description: "Answers to common questions about the remote ADHD pathway, consent, records, appointments and treatment.",
  alternates: { canonical: canonical("/faq") },
  openGraph: {
    title: "Frequently asked questions | NeuroCare",
    description: "Answers to common questions about the remote ADHD pathway, consent, records, appointments and treatment.",
    url: canonical("/faq"),
    type: "website",
  },
};

export default function FaqPage() {
  const page = pageByPath("/faq")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/faq"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Frequently asked questions", path: "/faq" }]} />
        <section className="mkt-hero">
          <h1>Frequently asked questions</h1>
          <p>Answers about the pathway, consent, records, appointments and treatment.</p>
        </section>

        <section className="mkt-section" aria-labelledby="faq-list-heading">
          <h2 id="faq-list-heading">Questions</h2>
          <FaqList entries={page.faq ?? []} />
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
