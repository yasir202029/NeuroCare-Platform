import Link from "next/link";
import { SITE_NAME } from "./content";

const nav = [
  { href: "/adhd-assessment", label: "ADHD assessment" },
  { href: "/adhd-treatment", label: "Treatment" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="mkt-header">
      <div className="mkt-header__inner">
        <Link className="mkt-brand" href="/">
          {SITE_NAME}
        </Link>
        <nav className="mkt-nav" aria-label="Primary">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer__inner">
        <div>
          <strong>{SITE_NAME}</strong>
          <p>Remote ADHD assessment and treatment pathway.</p>
        </div>
        <nav aria-label="Legal and support">
          <ul>
            <li>
              <Link href="/privacy">Privacy notice</Link>
            </li>
            <li>
              <Link href="/accessibility">Accessibility</Link>
            </li>
            <li>
              <Link href="/terms">Terms of use</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": data }) }}
    />
  );
}

export function Breadcrumbs({ trail }: { trail: Array<{ name: string; path: string }> }) {
  return (
    <nav className="mkt-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {trail.map((item, index) => (
          <li key={item.path}>
            {index === trail.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path}>{item.name}</Link>
            )}
            {index < trail.length - 1 ? <span aria-hidden="true"> / </span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqList({ entries }: { entries: Array<{ question: string; answer: string }> }) {
  return (
    <div className="mkt-faq">
      {entries.map((entry) => (
        <details key={entry.question}>
          <summary>{entry.question}</summary>
          <p>{entry.answer}</p>
        </details>
      ))}
    </div>
  );
}
