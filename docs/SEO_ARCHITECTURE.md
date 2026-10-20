# Marketing Site SEO Architecture

Applies to `apps/marketing-site` only. The patient, clinician and admin portals
are private applications and are excluded from indexing (see *Private surfaces*).

## Public route inventory

Every route below is implemented as a page in `apps/marketing-site/app` and is
declared once in `apps/marketing-site/app/content.ts`.

| Path | Purpose | FAQ JSON-LD |
|---|---|---|
| `/` | Service overview and pathway entry | yes |
| `/adhd-assessment` | What the assessment involves | yes |
| `/adhd-treatment` | Treatment and titration explanation | yes |
| `/how-it-works` | Step-by-step pathway | no |
| `/eligibility` | Who the service suits and what is excluded | no |
| `/pricing` | Charges, payment timing, what is included | no |
| `/faq` | Frequently asked questions | yes (from homepage set) |
| `/contact` | Contact routes | no |
| `/privacy` | Privacy notice | no |
| `/accessibility` | Accessibility statement | no |
| `/terms` | Terms of use | no |

The sitemap is generated from the same `publicPages` array, so a route cannot be
published without also being declared for SEO. There is no route drift.

## Technical SEO controls

| Control | Implementation |
|---|---|
| Unique title | `pageByPath(path).title`, each verified unique |
| Unique description | `pageByPath(path).description`, each verified unique |
| Canonical URL | `canonical(path)` from one `SITE_URL` source |
| Open Graph | `title`, `description`, `type`, `url`, `siteName`, `locale` |
| Twitter card | `summary_large_image` |
| Language | `<html lang="en-GB">` |
| Sitemap | `app/sitemap.ts` generated from `publicPages` |
| Robots | `app/robots.ts` — allows public paths, disallows account/API paths |
| Structured data | `app/seo.ts` — Organization, WebSite, WebPage, BreadcrumbList, Service, FAQPage |
| Status codes | real pages return 200; unknown paths return Next.js 404 |

## Structured data rules

Only types that match visible page content are emitted:

- `Organization` — name, url, logo-free description (no invented addresses or phone numbers)
- `WebSite` — name, url, in `en-GB`
- `WebPage` — name, description, url, inLanguage, breadcrumb
- `BreadcrumbList` — derived from the route hierarchy
- `Service` — only on service pages (`/`, `/adhd-assessment`, `/adhd-treatment`)
- `FAQPage` — only where the same Q&A pairs are rendered visibly on the page

Explicitly **not** emitted: `AggregateRating`, `Review`, `LocalBusiness`,
`MedicalClinic`, `Person` (no real, publicly listed clinicians are published),
`Offer` with prices (pricing is described in prose, not a schema offer).

No clinician credentials, ratings, patient numbers, waiting times, outcomes,
awards, partnerships or regulator status are published anywhere.

## Private surfaces

| Application | Indexing control |
|---|---|
| `apps/neurocare-platform` (patient) | `app/robots.ts` disallows all paths; layout metadata sets `robots: { index: false, follow: false }` |
| `apps/clinician-portal` | layout metadata sets `robots: { index: false, follow: false }`; no sitemap emitted |
| `apps/admin-portal` | layout metadata sets `robots: { index: false, follow: false }`; no sitemap emitted |

Robots directives are defence in depth only. The actual protection is the
authentication and authorisation boundary in the backend — private data is
never served to an unauthenticated request regardless of crawler directives.

## Content quality model

`apps/marketing-site/app/content.ts` holds title, description, path and FAQ
pairs per page. Content is written for a lay reader, states service scope
explicitly, and does not give emergency or individual clinical advice.

The Python validator in `python-services/content-validator` checks these
properties automatically and is runnable locally and in CI:

- every public route has exactly one declared page
- titles are unique and length-bounded
- descriptions are unique and length-bounded
- canonical path matches the route
- FAQ pairs are non-empty and unique
- JSON-LD parses and contains no forbidden types

## Conversion paths

| Intent | Primary action | Secondary action |
|---|---|---|
| New patient | Start the pathway (`/how-it-works` → registration) | Check eligibility |
| Cost question | Pricing | How the pathway works |
| Existing patient | Sign in to the patient portal | Contact support |
| Service detail | ADHD assessment / ADHD treatment | FAQ |

No urgency or scarcity language is used. Payment requirements are stated
plainly rather than presented as free.

## Known limitations

- No analytics or conversion tracking is installed, so conversion effectiveness
  cannot be measured yet.
- No `next/image` usage on the marketing site (no raster imagery shipped yet).
- Structured data is not validated against a third-party rich-results tester
  in CI; only JSON syntax and type allow-list are checked automatically.
