import { ORG_DESCRIPTION, ORG_LEGAL_NAME, SITE_NAME, SITE_URL, type PageMeta } from "./content";

type JsonLd = Record<string, unknown>;

const organization = (): JsonLd => ({
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: ORG_LEGAL_NAME,
  url: SITE_URL,
  description: ORG_DESCRIPTION,
});

const website = (): JsonLd => ({
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "en-GB",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

const webPage = (page: PageMeta, canonicalUrl: string): JsonLd => ({
  "@type": "WebPage",
  "@id": `${canonicalUrl}#webpage`,
  url: canonicalUrl,
  name: page.title,
  description: page.description,
  inLanguage: "en-GB",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
});

const breadcrumb = (page: PageMeta, canonicalUrl: string): JsonLd => {
  const segments = page.path.split("/").filter(Boolean);
  const items = [{ name: "Home", path: "/" }];
  let accumulated = "";
  for (const segment of segments) {
    accumulated += `/${segment}`;
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    items.push({ name: label, path: accumulated });
  }
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
};

const service = (page: PageMeta, canonicalUrl: string): JsonLd => ({
  "@type": "Service",
  "@id": `${canonicalUrl}#service`,
  name: page.title,
  description: page.description,
  url: canonicalUrl,
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: { "@type": "Country", name: "United Kingdom" },
});

const faq = (page: PageMeta, canonicalUrl: string): JsonLd | null => {
  if (!page.faq || page.faq.length === 0) return null;
  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    mainEntity: page.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
};

/**
 * Builds the JSON-LD graph for a public page.
 * Only types that match visible page content are emitted.
 */
export function buildJsonLd(page: PageMeta, canonicalUrl: string): JsonLd[] {
  const graph: JsonLd[] = [organization(), website(), webPage(page, canonicalUrl), breadcrumb(page, canonicalUrl)];

  if (["/", "/adhd-assessment", "/adhd-treatment"].includes(page.path)) {
    graph.push(service(page, canonicalUrl));
  }

  const faqGraph = faq(page, canonicalUrl);
  if (faqGraph) graph.push(faqGraph);

  return graph;
}
