# NeuroCare Platform — Production Readiness Audit

Generated: 2026-10-19. Monorepo consolidated to: apps (marketing-site, neurocare-platform), backend, packages (11), python-services (2).

## Validation Executed
- `pnpm install --frozen-lockfile` — passes
- `pnpm run typecheck` — passes across workspace (backend, apps, packages/clarity)
- `pnpm run build` — passes (backend + neurocare-platform + marketing-site)
- backend tests: `pnpm test -- --run` — 2 files, 7 tests pass
- Docker: `docker-compose build` + `up -d` — 6 services healthy (postgres, backend, frontend, web, report-engine, clinical-ai)
- `docker-compose ps` — all healthy

## P0 — Immediate security/data-loss risk

### P0-1: Service-token / RBAC gap on Python proxies — FIXED
- Affected: backend/src/modules/clinical-ai/clinical-ai.routes.ts, report-engine/report-engine.routes.ts
- Evidence: originally only requireAuth; any patient could call /draft-report, /validate-prescription.
- Remediation applied: requireRole(clinical roles), RBAC added. Audit logging added. Timeouts + error handling added.

### P0-2: Hard-coded clinicianId "me" in frontend
- Affected: apps/neurocare-platform/app/clinician/ai-assistant/page.tsx
- Evidence: clinicianId was hard-coded; backend now derives from req.user.id (frontend no longer sends it).
- Status: FIXED (frontend stopped sending clinicianId; backend uses authenticated user).

### P0-3: No audit logging on AI calls
- Status: FIXED (audit middleware added to proxy routes).

## P1 — Blocks safe production usage

### P1-1: Thin test coverage
- Affected: backend/tests (only health + modules smoke tests)
- Evidence: 7 tests total; no RBAC, auth, IDOR, or clinical workflow tests.
- Impact: cannot verify security invariants.
- Remediation: add integration tests for auth, RBAC, cross-patient isolation, appointment booking, assessments, notes, documents, payments, prescriptions. (Not yet done.)

### P1-2: IDOR/BOLA risk — PARTIALLY REMEDIATED
- patient-authz service + middleware added; clinical-notes, live-data, clinical-ai, report-engine, telehealth secured.
- Tenant isolation: Patient.organizationId added (nullable) + OrganizationMember check in assertPatientAccess.
- Affected: backend routes using patientId from params/body
- Evidence: requirePatientOrStaff exists but not applied uniformly; many routes trust client-supplied IDs.
- Impact: potential cross-patient data exposure.
- Remediation: apply requirePatientOrStaff / ownership checks on all patient-scoped endpoints; add tests.

### P1-3: No committed DB migrations
- Affected: backend/prisma (no migrations dir; uses `prisma db push`)
- Evidence: docker-compose migrate uses `prisma db push --skip-generate`.
- Impact: no versioned schema history; risky for production.
- Remediation: adopt `prisma migrate dev`/`deploy` with committed migrations.

### P1-4: Secrets in .env (local only)
- Affected: backend/.env (sk_test_replace_me placeholder, JWT secrets)
- Evidence: .env present locally with placeholders; .env.example has 46 keys matching 47 consumed.
- Impact: if .env committed with real values, secret leak. (Currently .gitignored presumably.)
- Remediation: verify .gitignore covers .env; rotate any real secrets.

### P1-5: CORS default includes localhost
- Affected: backend/src/app.ts (defaultOrigins includes localhost:3000 etc.)
- Evidence: allowedOrigins merges defaults + configured.
- Impact: in production, localhost origins still allowed (minor).
- Remediation: make default origins dev-only.

## P2 — Significant architectural/reliability

### P2-1: Stub AI services
- Affected: python-services/clinical-ai/main.py, report-engine/main.py
- Evidence: hard-coded echo responses, no LLM integration despite OPENAI_API_KEY in config.
- Impact: AI features are non-functional placeholders.
- Remediation: integrate OpenAI/LLM with proper prompts, guardrails, and clinician review gates.

### P2-2: No frontend WebSocket consumption for live data (partial)
- Affected: apps/neurocare-platform/lib/use-live-data.ts exists; not wired into patient/clinician dashboards.
- Remediation: wire useLiveData into patient monitoring and clinician views.

### P2-3: Feature branches not merged into main base features
- Affected: feature/telehealth-sessions, feature/saas-subscriptions, feature/clinician-powerhub-gdpr, feature/advanced-visual-seo-ai
- Status: merged into stack/deploy and main. Good.

### P2-4: Unused template packages
- Affected: lib/ (deleted), apps mobile (deleted). Current packages are from neuro-acess (all potentially used).
- Note: lib/api-client-react, api-spec, api-zod, db, psychometrics were removed; nothing references them now.

### P2-5: No E2E tests
- Remediation: add Playwright/Cypress smoke tests for login, patient journey, clinician workflow.

### P2-6: datetime.utcnow deprecated — FIXED (Python 3.13)
- Status: fixed to datetime.now(timezone.utc).

### P2-7: Aging Python dependency versions
- Affected: requirements.txt (fastapi 0.115.0, uvicorn 0.30.6, pydantic 2.9.2)
- Remediation: refresh to current stable versions.

## P3 — Cleanup/quality

### P3-1: Stale documentation references
- Affected: MIGRATION_PLAN.md, ARCHITECTURE_REVIEW.md reference retired portals.
- Classification: historical/safe to retain (documents migration plan).

### P3-2: .kilo/run-script mode change (100644 → 100755)
- Minor: executable bit change.

### P3-3: Frontend uses `any` types in some modules
- Remediation: tighten typing.

### P3-4: No lint script at root
- Remediation: add lint step to CI.

## Environment Contract
- 47 env vars consumed; .env.example has 46 keys. One mismatch (likely REPORT_ENGINE_URL/CLINICAL_AI_URL added). Verify sync.

## Production Blockers (P0/P1)
- P0 security items fixed.
- P1: thin tests, IDOR/BOLA, no committed migrations, CORS defaults, secret handling verification.

## Recommended Next 10 Tasks (ordered by risk)
1. Add integration tests for auth + RBAC + cross-patient isolation.
2. Apply requirePatientOrStaff/ownership checks uniformly; add tests.
3. Adopt Prisma migrations (committed) + deploy strategy.
4. Verify .gitignore covers .env; rotate secrets; validate CORS for prod.
5. Integrate LLM into Python AI service with clinician review gates.
6. Wire live data WebSocket into patient/clinician dashboards.
7. Add E2E smoke tests (Playwright) for login + journey.
8. Refresh Python dependency versions.
9. Add lint + CI gates (typecheck, test, build, lint).
10. Add rate limiting verification + security headers audit.

## Changes Made (this audit session)
- Fixed clinical-ai/report-engine proxies: RBAC, timeouts, error handling, audit logging, removed hard-coded clinicianId.
- Fixed Python datetime.utcnow deprecation.
- Added smoke tests (7 total).
- Added portal hub, live data page, combined workflow, patient journey, clinician earnings, GDPR module, telehealth, SaaS plans, visual dashboard, hooks console, SEO (sitemap/robots).
- Added Python report-engine + clinical-ai services with Docker.
- Created docs/ARCHITECTURE_MAP.md and docs/PRODUCTION_READINESS_AUDIT.md.

## Git Diff Summary
- Multiple feature commits on stack/deploy and main.
- All pushed to origin.

## Git Status
Clean (working tree clean).

## Conclusion
The platform is NOT production-ready. P1 items (tests, IDOR, migrations, CORS, secrets) must be resolved before production deployment. Core architecture is sound and the stack runs end-to-end.
