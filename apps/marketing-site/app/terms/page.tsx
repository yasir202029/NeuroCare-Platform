import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, JsonLd, MarketingFooter, MarketingHeader } from "../marketing-ui";
import { buildJsonLd } from "../seo";
import { canonical, pageByPath } from "../content";

export const metadata: Metadata = {
  title: "Terms of use | NeuroCare",
  description: "The terms that apply to use of the NeuroCare website and patient portal.",
  alternates: { canonical: canonical("/terms") },
  openGraph: {
    title: "Terms of use | NeuroCare",
    description: "The terms that apply to use of the NeuroCare website and patient portal.",
    url: canonical("/terms"),
    type: "website",
  },
};

export default function TermsPage() {
  const page = pageByPath("/terms")!;
  return (
    <>
      <JsonLd data={buildJsonLd(page, canonical("/terms"))} />
      <MarketingHeader />
      <main className="mkt-main" id="main">
        <Breadcrumbs trail={[{ name: "Terms of use", path: "/terms" }]} />
        <section className="mkt-hero">
          <h1>Terms of use</h1>
          <p>These terms apply to the NeuroCare website and patient portal.</p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="use-heading">
          <h2 id="use-heading">Use of this site and portal</h2>
          <ul>
            <li>Keep your sign-in details secure and tell us promptly if you think they have been used by someone else.</li>
            <li>Use the portal only for your own care, unless you are acting with recorded authority on someone else&rsquo;s behalf.</li>
            <li>Do not attempt to access records that are not yours.</li>
            <li>Content in the portal is a record of your care and should not be treated as emergency advice.</li>
          </ul>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="clinical-heading">
          <h2 id="clinical-heading">Clinical information</h2>
          <p>
            Information on the public website is general information about the service. It is not
            advice about your circumstances, and it does not create a clinical relationship. A
            clinical relationship begins only once a clinician has assessed you and recorded a plan.
          </p>
        </section>

        <section className="mkt-section mkt-prose" aria-labelledby="changes-heading">
          <h2 id="changes-heading">Changes</h2>
          <p>
            We review these terms as the service changes. The version that applied when you used the
            service is recorded in your patient portal.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
