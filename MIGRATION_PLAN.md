# NeuroCare Platform migration plan

## Objective

Consolidate all verified NeuroCare portal functionality into `neurocare-platform`. It becomes the master role-routed application. No new portal projects are needed.

## Phase 1 — establish the master application

1. Keep `apps/neurocare-platform` as the only frontend deployment target.
2. Add role route groups: `/patient`, `/clinician`, `/titration`, `/prescriber`, `/admin`, `/finance`, `/platform`.
3. Extract shared shell, navigation, global search, notifications, breadcrumbs, patient context and related-record components. Remove client-side portal mode switching.
4. Keep the shared API as the only backend and add the native Engine module boundary described in `ENGINE_RECOMMENDATION.md`.

## Phase 2 — connect each portal capability

| Existing source | Master route | Shared services |
| --- | --- | --- |
| Patient portal | `/patient` | patient record, appointments, documents/uploads, reports, messages, prescriptions, invoices, timeline |
| Clinician portal | `/clinician` | assessment, clinical notes, reports, queues, messages, patient timeline |
| Titration mode | `/titration` | titration plans, reviews, physical health, escalation tasks, transfer queue |
| Prescriber mode | `/prescriber` | prescription approval/issue, courier status, shared care, discharge |
| Admin portals | `/admin` | users, patients, appointments, workflow controller, transfers, complaints, audit, permissions |
| System portal | `/platform` | tenants, governance, AI policy, audit intelligence, feature controls |
| Finance mode | `/finance` | invoices, Stripe reconciliation, balances, payment plans, earnings, revenue |

## Phase 3 — Engine command integration

1. Add API commands for workflow transitions, task completion, assignment, transfer, escalation, document verification, report approval, prescription actions and finance exceptions.
2. Enforce RBAC and assignment checks in each command.
3. Run related record writes, queue updates, state transitions and audit events in one database transaction.
4. Return permitted next actions to the caller; portal UIs render these actions rather than embedding their own workflow logic.
5. Build patient-record tabs from the shared API: overview, appointments, assessments, uploads, reports, physical health, prescriptions, messages, timeline, finance and audit.

## Phase 4 — deployment cutover

1. Deploy the shared API from the same repository revision that contains the Engine module.
2. Set the master frontend’s public API base URL and configure authenticated browser-to-API sessions. Do not expose service credentials to the browser.
3. Validate every role route, patient record tab, workflow transition, task queue, transfer, audit event, AI review action and finance action in preview.
4. Promote the validated master frontend and shared API together.
5. Maintain old portals for a defined rollback period; redirect or disable access only after verified production cutover.

## Phase 5 — retire duplicates

Candidate projects for retirement after explicit confirmation and rollback expiry:

- `neuroassess-patient-portal`
- `neuroassess-clinician-portal`
- `neuroassess-admin-portal`
- `neuro-care-platform-admin-portal`
- `neuro-care-platform-admin-portal-p2ce`
- `neuroassess-system-portal`
- `neuroassess-web`
- `neuroassess-web-tjei`

Do not retire `neuroassess-marketing` unless public pages are migrated, or `neurocare` until its owner confirms its role.

## Exit criteria

- One frontend project serves every authorised portal route.
- One shared API and one database own patient data and Engine state.
- Workflow, task, transfer, AI, permission and navigation decisions are made by native Engine modules.
- Every patient operation has an immutable audit trail.
- No legacy portal receives production traffic after the rollback window.
