# NeuroCare Platform — Feature Matrix & Implementation Plan

- **Status:** AUDIT COMPLETE — Implementation plan derived from actual state
- **Scope:** Remote ADHD/autism assessment, treatment, titration, monitoring, follow-up service

---

## 1. Feature Matrix

| # | FEATURE | STATUS | F/E | BACKEND | DB MODEL | AI/PYTHON | SECURITY/CLINICAL GAP | ACTION | PRIORITY |
|---|---------|--------|-----|---------|----------|-----------|----------------------|--------|----------|
| 1 | Patient portal (identity/profile) | PARTIAL | FE | patient routes | Patient, User | — | Consent flow needs provenance | Add consent recording + claim evidence | HIGH |
| 2 | Patient onboarding (identity→demographics→medical history→accessibility→consent) | COMPLETE | FE+BK | onboarding routes/service | Patient, ConsentRecord | — | None | No change | — |
| 3 | Patient booking (appointment) | COMPLETE | FE+BK | booking routes | Appointment, Availability | — | None | No change | — |
| 4 | Patient questionnaires (patient & informant) | COMPLETE | FE+BK | questionnaire routes/service | ClinicalFormSubmission, ClinicalFormDefinition | — | None | No change | — |
| 5 | Patient document upload/view | PARTIAL | FE+BK | documents routes | Document, DocumentRequest | — | OCR/extraction missing | Document intelligence integration | MED |
| 6 | Patient timeline | MISSING | FE | — | — | — | None | Create unified timeline endpoint + UI | HIGH |
| 7 | ADHD assessment workspace (structured) | PARTIAL | FE | adhd routes | Assessment, ADHD, MedicationReview | — | No structured history/collateral sheets | Extend assessment schemas + UI workspace | HIGH |
| 8 | Autism assessment workspace | PARTIAL | FE | autism routes | Assessment, Autism | — | No structured evidence matrix | Extend assessment schemas + UI workspace | HIGH |
| 9 | Clinical workflow engine (transition) | COMPLETE | BK | engine routes | WorkflowTransition | — | None | No change | — |
| 10 | Remote physical monitoring rules engine | MISSING | BK | — | — | — | None | Create monitoring rules API + front end | HIGH |
| 11 | Titration workstation | PARTIAL | FE | adhd routes (medication-reviews) | MedicationReview | — | No trend display; no structured safety data | Build titration dashboard + structured monitoring entry | HIGH |
| 12 | Risk/safeguarding structured module | PARTIAL | BK/FE | clinical-risk routes | ClinicalRiskScore | — | No structured domain fields | Extend to structured risk domains | HIGH |
| 13 | Consent tracking (purpose-scoped) | PARTIAL | BK | onboarding consents | ConsentRecord | — | No purpose taxonomy | Map consent types to domain taxonomy + granular view | MED |

---

## 2. P0 Selection — Highest Priority Unimplemented Vertical Slices

### Slice 1 (TOP PRIORITY): Patient 360 with remote monitoring + risk/safeguarding structured module

**Why this first:**
- Most gaps affect safety (monitoring, risk) and patient experience
- Builds on existing Prisma models (Patient, MedicationReview, ClinicalRiskScore, ClinicalAlert)
- Enables the clinician co-pilot to work against a complete single patient record

**Database:** None required (reuses existing models)

**Backend:**
- `monitoring` service + `/monitoring/**` routes with deterministic rules engine
- `risk` service + `/risk/**` routes with structured domains
- Extend clinican workspace to use single-patient data

**API contract (Zod):**
- `MonitoringReadingSchema` — weight, height, BMI, BP, pulse, context, source, notes
- `RiskEntrySchema` — current, historical, protective factors, action/plan, review status
- `Patient360QuerySchema` — packages=...&include=monitoring,timeline,risk

**AI/Python:** None yet (defer to later slice once data layer exists)

**Frontend:**
- Patient 360 tabbed workspace in patient-portal
- Monitoring entry form (structured)
- Risk entry form
- Timeline view

**Audit:**
- Patient monitoring entries audit log
- Risk record changes audit log
- consent changes audit log

---

## 3. Implementation Order

| Phase | Slice | Scope | Status |
|-------|-------|-------|--------|
| A | Patient 360 + monitoring + risk | db→bk→API→UI→tests | NOT STARTED |
| B | ADHD/autism assessment workspaces | db→bk→UI→tests | NOT STARTED |
| C | AI orchestration layer (co-pilot) | bk→AI→tests | NOT STARTED (CRITICAL) |
| D | Remote monitoring rules engine | bk→UI→tests | NOT STARTED |
| E | Document intelligence | bk→AI→UI→tests | NOT STARTED |
| F | Patient timeline | db→bk→UI→tests | NOT STARTED

## 4. Validation Strategy

Run after every slice:
- `pnpm run typecheck` (root)
- `pnpm test` (backend tests)
- `pnpm --filter @neurocare/platform build` (patient build)

**Do not claim completion unless:**
- Real HTTP workflows verified (not mocks)
- Type errors resolved
- Security tests for cross-patient access in place

---

*Last updated: 2026-10-19*