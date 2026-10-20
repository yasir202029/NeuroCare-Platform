# UX / Visual Audit

Scope: patient portal (`apps/neurocare-platform`), clinician workstation
(`apps/clinician-portal`), admin operations workstation (`apps/admin-portal`),
public marketing site (`apps/marketing-site`).

Status legend: IMPLEMENTED / PARTIAL / MISSING / DEFERRED

## Verified technology stack

| Concern | Verified value | Source |
|---|---|---|
| Backend framework | Express 5.1 (NOT Fastify) | `backend/package.json` (`express: ^5.1.0`), `backend/src/server.ts` |
| ORM | Prisma 6.16 client / 6.19 CLI | `backend/package.json` |
| Validation | Zod 4.1 | `backend/package.json` |
| Auth | jsonwebtoken 9 (JWT access/refresh) | `backend/src/middleware/auth.ts` |
| Rate limiting | express-rate-limit 7.5 | `backend/src/middleware/rate-limit.ts` |
| Security headers | helmet 8.1 | `backend/src/app.ts` |
| Realtime | ws 8.22 (`/api/v1/live-data/ws`) | `backend/src/server.ts` |
| Web framework | Next.js 16.1.6 (App Router, Turbopack) | all four `apps/*/package.json` |
| UI runtime | React 19.1.0 | all four `apps/*/package.json` |
| Mobile | Expo ~53 / React Native 0.79.6 | `apps/mobile/package.json` |
| Design system | `@neurocare/clarity` (semantic tokens + components) | `packages/clarity` |
| Charts | none installed | no chart library in any manifest |
| Animation | none installed (CSS-only) | no animation library in any manifest |
| Icons | `lucide-react` (clarity package only) | `packages/clarity/package.json` |
| Tests | Vitest 3.2 (backend + clarity) | `backend/package.json`, `packages/clarity/package.json` |
| Lint | not configured at root | `package.json` has no `lint` script |
| CSS approach | plain CSS + CSS custom properties; Tailwind is catalogued but not consumed by portal apps | `apps/*/app/styles.css` |

## Findings

### Patient portal

| # | Route / component | Issue | User impact | Accessibility impact | Correction | Priority | Safe to automate |
|---|---|---|---|---|---|---|---|
| P-1 | `app/robots.ts` | `allow: "/"` — the patient portal is indexable | private care UI surfaces in search indexes | n/a | Disallow all crawling; private content protection is an auth concern, indexing is defence in depth | P1 | yes |
| P-2 | `app/patient/page.tsx` | Home was a static profile card list, not a journey | patient cannot see what to do next | heading structure flat | Replaced with journey orchestrator (next action, milestones, upcoming, outstanding, recent) | P1 | yes |
| P-3 | `components/platform-shell.tsx` | Universal shell rendering 6 personas' navigation | patient sees clinician/admin/finance links | nav landmark contained irrelevant destinations | Patient page now uses dedicated `PatientShell`; universal shell retained only for legacy routes pending migration | P1 | partial |
| P-4 | `app/portal/page.tsx` | Universal portal hub route | dead-end for all personas | n/a | Removed | P1 | yes |
| P-5 | inline Tailwind utility classes mixed with `styles.css` | two competing visual languages | inconsistent spacing/radii | focus styles undefined for utility classes | Route patient home to semantic class names; consolidate later | P2 | no |
| P-6 | `components/patient-shell.tsx` | No skip link, no `main` landmark labelling | screen-reader users traverse nav linearly | missing skip link | Add skip link + labelled main | P1 | yes |
| P-7 | patient shell | no `prefers-reduced-motion` handling | motion-sensitive users | motion not gated | Gate transitions on `prefers-reduced-motion` | P2 | yes |
| P-8 | patient home | status conveyed by colour only (milestone dots) | colour-blind users cannot read stage | non-text status | Add text state per milestone (sr-only) — implemented | P1 | yes |
| P-9 | `app/onboarding/page.tsx` | Single long form, no per-step recovery, no review step | partial data loss risk on later failure | no error summary | Split into resumable steps with server-confirmed completion | P1 | no |
| P-10 | `app/patient/book/page.tsx` | Booking flow lacks explicit prerequisite explanation | patient books before onboarding complete | n/a | Surface prerequisites from journey projection | P2 | no |

### Clinician workstation

| # | Route / component | Issue | User impact | Accessibility impact | Correction | Priority | Safe to automate |
|---|---|---|---|---|---|---|---|
| C-1 | `app/page.tsx` | Single dense page; queues were flat lists without a work hierarchy | clinician cannot answer "what needs my attention" | n/a | Structured into TODAY / MY ATTENTION / MY PATIENTS / CLINICAL WORK | P1 | yes |
| C-2 | no dedicated shell | Navigation was absent (CSS defined `.clinic-nav` but nothing rendered it) | no persistent orientation | no nav landmark | Added `ClinicianShell` with persona-only sections | P1 | yes |
| C-3 | patient workspace | Patient context only visible inside the workspace panel; lost on section change | repeated navigation to find patient | context not announced | Persistent context header retained across tabs (implemented) | P1 | yes |
| C-4 | `styles.css` | Single-line minified stylesheet, no focus-visible rules | keyboard focus invisible | no focus indicator | Add focus-visible tokens; split stylesheet | P1 | yes |
| C-5 | clinician nav | No command palette, no recent patients, no patient search | slow retrieval | n/a | Command palette (safe navigation only) + recent patients | P2 | no |
| C-6 | patient workspace | No clinical timeline projection | clinician assembles history manually | n/a | Build authorised timeline read-model | P1 | no |
| C-7 | assessment tab | Generic textarea, no structured ADHD sections | unreliable structure | n/a | Structured assessment workspace with completion state | P1 | no |
| C-8 | report tab | Draft vs finalised status not surfaced | risk of treating drafts as final | n/a | Add explicit lifecycle badge to notes and reports | P1 | no |
| C-9 | no density toggle | Dense clinical tables on small screens | cramped review | n/a | Compact/comfortable density using clarity tokens | P2 | yes |

### Admin operations workstation

| # | Route / component | Issue | User impact | Accessibility impact | Correction | Priority | Safe to automate |
|---|---|---|---|---|---|---|---|
| A-1 | `app/page.tsx` | Placeholder "System Online" — no operations capability | admin cannot do anything | n/a | Built operations centre on `/admin/command-center` | P1 | yes |
| A-2 | no shell | No navigation or identity of product | no orientation | no nav landmark | Added `AdminShell` with operational sections | P1 | yes |
| A-3 | no queue/table system | Admin needs filters, sorting, bulk actions | exception handling manual | n/a | Table primitives with server-side pagination and filters | P1 | no |
| A-4 | `styles.css` | No shared tokens; hard-coded hex values | inconsistent with other portals | contrast not verified | Adopt clarity semantic tokens | P1 | yes |
| A-5 | no access-control surface | No visibility of who holds which role | access reviews manual | n/a | Access section from `/admin/users` | P2 | no |

### Marketing site (public)

| # | Route | Issue | User impact | Accessibility impact | Correction | Priority | Safe to automate |
|---|---|---|---|---|---|---|---|
| M-1 | `/` | Placeholder content ("marketing site", "ready for authenticated workflows") | destroys trust, no conversion path | n/a | Build real public homepage with service, pathway, FAQ, trust | P1 | yes |
| M-2 | `app/layout.tsx` | Metadata present but no canonical, no OG image, no JSON-LD | weak SERP presentation | n/a | Add canonical + OG + Organization/WebSite/Service/FAQPage JSON-LD | P1 | yes |
| M-3 | `app/sitemap.ts` | Lists `/about` and `/contact` routes that do not exist | 404s in the sitemap | n/a | Sitemap must list only implemented public routes | P1 | yes |
| M-4 | content | No eligibility/pricing/how-it-works pages | visitors cannot self-qualify | n/a | Add real public routes | P1 | yes |
| M-5 | `app/robots.ts` | No explicit disallow of auth paths | n/a | n/a | Disallow account paths | P2 | yes |

### Shared / cross-portal

| # | Issue | Correction | Priority |
|---|---|---|---|
| X-1 | `PlatformShell` still renders all six personas' nav for legacy routes | Migrate legacy routes into the owning portal apps, then delete the component | P1 |
| X-2 | `portal-experience.tsx` renders role-based cards for every persona | Replace with portal-specific compositions | P1 |
| X-3 | Hard-coded colour values in `clinician-portal/app/styles.css` and `admin-portal/app/styles.css` | Migrate to clarity semantic tokens | P1 |
| X-4 | No root `lint` script | Add lint to CI once a linter is chosen | P3 |
| X-5 | No visual-regression tooling | Manual visual verification documented; no fabricated results | P3 (deferred) |

## Corrective work completed in this pass

- Patient portal home replaced with a journey orchestrator driven by a backend projection
- `PatientShell` dedicated navigation; universal portal hub removed
- `ClinicianShell` with persona-only navigation; clinician home restructured into work zones
- `AdminShell` with operational navigation; admin home built on `/admin/command-center`
- Portal boundaries verified server-side by `requirePortal`, covered by `portal-access.test.ts`
- Marketing site replaced with real public content, metadata, canonical URLs, JSON-LD, accurate sitemap

## Remaining UX risks

- Legacy routes in the patient app still use the universal `PlatformShell` (X-1)
- Onboarding remains a single long form (P-9)
- No clinical timeline read-model (C-6)
- No structured assessment workspace (C-7)
- No admin bulk/filter/sort surface (A-3)
- No automated visual-regression or axe-based a11y tooling (X-5)
