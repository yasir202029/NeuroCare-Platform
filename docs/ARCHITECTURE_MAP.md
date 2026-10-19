# NeuroCare Platform — Architecture Map

## Apps
- `apps/neurocare-platform` (Next.js 16) — role-routed master frontend (patient, clinician, prescriber, titration, admin, finance, engine, workflows, tasks, states, rules, events, hooks-console, live-data, visual-dashboard, ai-insights, portal hub). Depends on workspace packages.
- `apps/marketing-site` (Next.js 16) — public marketing site (SEO: metadata, sitemap, robots).

## Backend
- `backend` (@workspace/clinic-backend) — Fastify/Express + Prisma + PostgreSQL. Modules: adhd, admin, ai, auth, autism, billing, booking, clinical-ai, clinical-forms, clinical-notes, clinical-risk, clinician, config, coordination, engine, finance, gdpr, gp-communication, hooks, live-data, messaging, notifications, onboarding, patients, portals, rails, report-engine, reports, saas, saas-plans, teams, telehealth, video. Entry: src/server.ts → src/app.ts → src/routes/index.ts.

## Packages (shared)
- access, audit, clarity, clinical-consent, config, feature-flags, journey, notifications, permissions, timeline, workflow-engine.
- Dependency direction: apps → packages → (no app imports). Packages are independent (no cross-package imports except access/config).

## Python Services
- python-services/report-engine (FastAPI) — report generation (PDF).
- python-services/clinical-ai (FastAPI) — draft reports, validate prescriptions, summarise notes, pathway guidance, portal-specific features.

## Database
- PostgreSQL 16 via Prisma (backend/prisma/schema.prisma). 117 models, 71 enums. Migrations via `prisma db push` (no committed migrations dir).

## Auth Boundary
- JWT (access/refresh) in HttpOnly cookies; requireAuth/requireRole/requirePortal/requirePatientOrStaff in backend/src/middleware/auth.ts. RBAC enforced server-side. Frontend route guards are UX only.

## Clinical-Data Boundary
- All clinical data flows through backend modules → Prisma → PostgreSQL. AI/report Python services are stateless proxies. Audit events via middleware/audit.ts.

## API Contract Flow
Prisma schema → backend services/routes → /api/v1/* → frontend authenticatedFetch. No separate OpenAPI spec consumed by frontend (lib/api-spec, api-client-react, api-zod are from template and unused).

## Deployment Boundaries
- Docker Compose: postgres → migrate → backend → frontend + web + report-engine + clinical-ai.
- GitHub Actions: .github/workflows/deploy.yml (typecheck + build + docker build). summary.yml (issue summariser).
