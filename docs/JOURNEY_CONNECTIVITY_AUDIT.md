# Journey Connectivity Audit

Scope: patient portal (`apps/neurocare-platform`), clinician workstation
(`apps/clinician-portal`), admin operations workstation (`apps/admin-portal`),
public marketing site (`apps/marketing-site`).

Classification: CONNECTED / PARTIALLY CONNECTED / DEAD END / PLACEHOLDER /
ORPHAN ROUTE / BROKEN NAVIGATION / MISSING BACKEND / MISSING NEXT STATE /
MISSING CROSS-PERSONA HANDOFF.

## Route inventory (real routes only)

### Patient portal

| Route | Entry path | Real action | Backend state changed | Success destination | Class |
|---|---|---|---|---|---|
| `/` | marketing sign-in link, direct | public marketing content | none | service pages | CONNECTED |
| `/login` | shell, marketing CTA | authenticate | session created | `/patient` | CONNECTED |
| `/patient` | after login, patient nav | view journey projection | none (read) | next-action target | CONNECTED |
| `/patient/journey` | patient nav | view pathway milestones | none (read) | — | PARTIALLY CONNECTED (static copy alongside the live projection) |
| `/patient/questionnaires` | patient nav, next action | list own questionnaires with status | none (read) | `/patient/questionnaires/[key]` | CONNECTED |
| `/patient/questionnaires/[key]` | questionnaire list, next action | autosave draft, validate, review, submit | `ClinicalFormSubmission` DRAFT→SUBMITTED; `ClinicalTask` created | success panel → `/patient` | CONNECTED (closed loop) |
| `/patient/book` | patient nav, next action | list availability, request appointment | `Appointment` REQUESTED | confirmation | PARTIALLY CONNECTED (no cancel/reschedule command) |
| `/onboarding` | patient nav, next action | progressive profile, consent, complete | `Patient`, `ConsentRecord` | `/patient` | PARTIALLY CONNECTED (single long form, no per-step resume) |
| `/documents` | patient nav | upload document, list own | `Document`, `DocumentVersion` | list refresh | PARTIALLY CONNECTED (no patient-visible request list) |
| `/notifications` | patient nav | list notifications | none (read) | — | PARTIALLY CONNECTED (no deep links) |
| `/about`, `/contact` | footer | static copy | none | — | PLACEHOLDER (copied from the old marketing copy) |

### Clinician workstation

| Route | Entry path | Real action | Backend state changed | Success destination | Class |
|---|---|---|---|---|---|
| `/` | direct after sign-in | load assigned caseload, today list, questionnaire review queue | none (read) | patient workspace | CONNECTED |
| patient workspace (in-page tabs) | queue row / caseload row | read patient record, write report draft, approve report, send message, create follow-up task, start video | `Report` draft→approved, `Message`, `ClinicalTask` | same patient context | PARTIALLY CONNECTED (assessment tab is a generic textarea) |
| `/patients/:patientId` | **not implemented as a route** | — | — | — | MISSING BACKEND / ORPHAN — patient context is in-page only, so it cannot be deep-linked or refreshed safely |

### Admin operations workstation

| Route | Entry path | Real action | Backend state changed | Success destination | Class |
|---|---|---|---|---|---|
| `/` | direct after sign-in | read command centre (metrics, pipeline, queues) | none (read) | — | PARTIALLY CONNECTED (read-only; no exception resolution actions) |
| `/operations`, `/pipeline`, `/queues`, `/access`, `/audit`, `/reporting` | **not implemented as routes** | — | — | — | BROKEN NAVIGATION (nav items switch section state only) |

### Public marketing site

| Route | Entry path | Real action | Class |
|---|---|---|---|
| `/` | direct, search | public service overview + FAQ | CONNECTED |
| `/adhd-assessment`, `/adhd-treatment`, `/how-it-works`, `/eligibility`, `/pricing`, `/faq`, `/contact`, `/privacy`, `/accessibility`, `/terms` | header nav, internal links, sitemap | public content | CONNECTED |

## Dead ends and gaps found

| # | Gap | Persona | Priority | Status |
|---|---|---|---|---|
| DE-1 | Patient had no way to discover outstanding questionnaires; the next action pointed at `/onboarding` | patient | P1 | FIXED — `/questionnaires/assigned` + next action now resolves to `/patient/questionnaires` |
| DE-2 | Questionnaires were created already "complete" — no draft, no autosave, no review, no immutability | patient → clinician | P1 | FIXED — DRAFT→SUBMITTED→UNDER_REVIEW→REVIEWED state machine |
| DE-3 | No cross-persona handoff: a patient submission never created clinician work | patient → clinician | P1 | FIXED — submit creates a `QUESTIONNAIRE_REVIEW` clinical task (idempotent via a unique constraint) |
| DE-4 | No patient-visible outcome for a submitted questionnaire | patient | P1 | FIXED — success panel states what happened and who owns the next step |
| DE-5 | Clinician had no review queue for questionnaires | clinician | P1 | FIXED — `/questionnaires/review-queue` + review command in the PowerHub |
| DE-6 | Clinician had no persistent patient context route; context was in-page only | clinician | P2 | OPEN — in-page context preserved across tabs, but no `/patients/:patientId` route to deep-link |
| DE-7 | Admin portal navigation items point at nothing; the centre is read-only | admin | P2 | OPEN — needs exception resolution commands and real queue routes |
| DE-8 | Patient onboarding is one long form with no per-step resume | patient | P2 | OPEN |
| DE-9 | Patient `/patient/journey` shows static copy rather than the live projection | patient | P2 | OPEN — the live projection is on `/patient` |
| DE-10 | `/about` and `/contact` in the patient app are leftover copies of the old marketing content | patient | P3 | OPEN — should move to the marketing site or be removed |
| DE-11 | No terminal-state copy: a patient with nothing outstanding is told "nothing needs your attention" rather than who owns the next step | patient | P2 | PARTIALLY FIXED — `AWAIT_CLINICAL_OUTCOME` states the next owner |

## Terminal and blocked states now modelled

| State | Type | Where |
|---|---|---|
| `AWAIT_CLINICAL_OUTCOME` | terminal-ish (waiting on another actor) | patient journey projection |
| `PAY_INVOICE` | blocked (other actor: patient) | patient journey projection |
| `COMPLETE_CONSENT` | blocked (other actor: patient) | patient journey projection |
| `BOOK_APPOINTMENT` | blocked (other actor: patient) | patient journey projection |
| `SUBMITTED` / `UNDER_REVIEW` | waiting (other actor: clinician) | questionnaire submission status |
| `REVIEWED` | complete | questionnaire submission status |
| `DRAFT` | in progress (other actor: patient) | questionnaire submission status |

## Recommended next closed-loop workflows

1. **Document request loop** — clinician requests evidence → patient sees an outstanding request with a real upload target → clinician reviews → patient sees the outcome.
2. **Appointment booking loop** — patient books → admin sees the booking exception → clinician sees it on the schedule → patient sees the confirmed appointment.
3. **Clinician patient-context route** — `/patients/:patientId` so patient context survives a refresh and can be deep-linked.
4. **Admin exception resolution** — admin opens a queue item → permitted resolution action → the exception leaves the queue and the patient's next action updates.
5. **Consent loop** — plain-language consent with versioning, withdrawal, and the effect on the pathway.
