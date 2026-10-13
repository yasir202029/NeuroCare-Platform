# NeuroCare Platform architecture review

## Decision

`neurocare-platform` is the master application. It is the only target for portal functionality. No new portal projects should be created.

The target runtime is one role-routed Next.js frontend (`apps/neurocare-platform`) and one shared Express API backed by the existing Prisma/PostgreSQL data model. The existing API already contains patients, booking, ADHD/autism assessments, notes, AI, billing, messages, reports, finance, teams, authentication, and portals under `/api/v1`.

## Current project inventory

| Project group | Source root | Disposition |
| --- | --- | --- |
| `neurocare-platform` | `apps/neurocare-platform` | Master frontend. Keep and extend. |
| `neuro-care-platform-api-server` | `artifacts/api-server` | Canonical API candidate; validate environment configuration and promote as the shared backend. |
| `neuroassess-patient-portal` | `apps/patient-portal` | Merge into `/patient`; retire after cutover. |
| `neuroassess-clinician-portal` | `apps/clinician-portal` | Merge into `/clinician`, `/titration`, `/prescriber`; retire after cutover. |
| `neuroassess-admin-portal`, `neuro-care-platform-admin-portal`, `neuro-care-platform-admin-portal-p2ce` | `apps/admin-portal` or `apps/neurocare-platform` | Duplicates; merge into `/admin`; retire after cutover. |
| `neuroassess-system-portal` | `apps/super-admin-portal` | Merge into `/platform`; retire after cutover. |
| `neuroassess-web`, `neuroassess-web-tjei` | `artifacts/neuroassess-web` | Duplicate Vite surfaces; retain source only if specific reusable components are confirmed. |
| `neuroassess-marketing` | `apps/marketing-site` | Keep only if a separate public marketing site is intentional; otherwise move public pages into the master app. |
| `neurocare` | standalone Next.js project | No source relationship verified; do not modify until the owner confirms its purpose. |

## Shared engines and services

The existing Prisma schema already supplies durable primitives for the native engine:

- **State and workflow**: `WorkflowStage`, `WorkflowTransition`, and assessment workflow events.
- **Tasks**: `TeamQueueItem`, `ClinicalTask`, task status/type enums, and notifications.
- **Transfers**: `PatientAssignment`, `Team`, `TeamMember`, cover arrangements, and workflow transitions.
- **Rules**: typed policy definitions plus validated command handlers; clinical outcomes must be explicit rather than inferred by UI state.
- **Events and audit**: `AuditEvent`, document access logs, prescription status events, appointment status events, and AI-run records.
- **Permissions and navigation**: existing JWT authentication, Prisma roles, backend route guards, and role-filtered navigation configuration.
- **AI orchestration**: existing AI routes/services and `AiRun` records. AI output remains reviewable and never performs an unauthorised clinical state change.

## Target route model

| Route | Role | Engine-facing responsibilities |
| --- | --- | --- |
| `/patient` | Patient | Journey progress, tasks, appointments, messages, uploads, documents, medication, finance. |
| `/clinician` | Psychiatrist, nurse, prescriber | Assessment, records, reports, clinical task queues, care handoffs. |
| `/titration` | Nurse, prescriber, psychiatrist | Medication monitoring, physical health and escalation queues. |
| `/prescriber` | Prescriber, psychiatrist | Prescription, shared care, signed documents and discharge flow. |
| `/admin` | Admin | Visual controller for Engine commands, patients, appointments, queues, workflow transfers, finance, audit and permissions. |
| `/finance` | Finance, admin | Invoices, payments, balances, clinician earnings and finance exceptions. |
| `/platform` | Super admin | Tenant, global policy, audit and feature governance. |
| `/engine`, `/workflows`, `/rules`, `/events`, `/states`, `/tasks` | Authorised staff | Engine observability and controller surfaces, not separate portals. |

## Current integration gaps

- `apps/neurocare-platform` builds successfully but its browser API calls need a deployed shared API base URL and frontend session/token integration.
- The current Engine API is implemented in the repository, but the canonical API deployment source is `artifacts/api-server`; the backend source must be packaged/deployed from the same revision before the UI can execute Engine commands in production.
- Existing static portal shells must be replaced by connected route-level record and command views before legacy deployments are retired.
