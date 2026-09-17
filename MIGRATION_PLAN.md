# NeuroCare Platform consolidation plan

## Decision

Consolidate the current portal applications into one Next.js application named `neurocare-platform` with role-scoped routes. Keep a single Express API deployment and a single Prisma database. Do not delete any existing Vercel project until the consolidated application has passed data, authentication, route, and rollback checks.

## Current evidence

- The repository is already a pnpm workspace with four Next.js portal applications: `apps/patient-portal`, `apps/clinician-portal`, `apps/admin-portal`, and `apps/super-admin-portal`.
- The clinician portal currently combines clinician, titration, and prescriber modes in a client-side selector; the admin portal combines operations and finance modes the same way. These must become server-authorized routes, not selectable UI modes.
- All portal UIs are currently static shells with duplicated sidebar/page structures and no connected data layer.
- The existing backend exposes one API under `/api/v1`, including authentication, patients, bookings, assessments, clinical notes, AI, billing, messaging, reports, finance, portals, and teams.
- The Prisma schema already contains workflow, assignment, team queue, titration, prescription, shared-care, notification, document, and audit models. The migration must reuse this model rather than create a second database.
- Vercel currently has multiple portal and duplicate candidate projects. There is no project named `neurocare-platform` in the reviewed project inventory, so the exact target project and custom-domain ownership must be established before production deployment.

## Target application

Create `apps/neurocare-platform` as the only deployable frontend app.

| Route | Authorized roles | Primary capability |
| --- | --- | --- |
| `/patient` | Patient | Journey, appointments, documents, messages, prescriptions, billing |
| `/clinician` | Psychiatrist, nurse, prescriber | Assessment and active-care queue |
| `/titration` | Nurse, psychiatrist, prescriber | Medication monitoring and titration reviews |
| `/prescriber` | Psychiatrist, prescriber | Prescription approval, issue, dispatch, shared care |
| `/admin` | Admin | Operations, users, bookings, governance, audit |
| `/finance` | Finance, admin | Invoices, payments, earnings, revenue |
| `/platform` | Super admin | Tenants, policy, global audit, feature controls |

Every route uses one application shell with global navigation, search, notifications, breadcrumbs, back navigation, related-record panels, and a patient timeline where patient context applies.

## Shared services to retain or extract

1. **Authentication and authorization**: centralize route guards around the backend JWT and Prisma `Role` values. Replace client-side portal-mode selectors with server-enforced route access.
2. **Workflow engine**: use `WorkflowStage`, `WorkflowTransition`, `AssessmentWorkflowEvent`, `TeamQueueItem`, and `PatientAssignment` for Referral → Booking → Assessment → Titration → Prescribing → Shared Care → Discharge. Record actor, timestamp, source team, target team, and reason for each transition.
3. **Transfer engine**: create API operations that atomically transfer assignment and queue ownership, append `WorkflowTransition`, and create an audit event. Never transfer ownership only in frontend state.
4. **Patient journey engine**: serve a single ordered timeline that combines assessments, appointments, workflow transitions, medication reviews, prescriptions, shared-care agreements, documents, messages, and discharge events.
5. **Navigation engine**: one shared layout package/component with role-filtered navigation and current-patient context.
6. **Shared API client**: extend the existing `lib/api-client-react`, `lib/api-spec`, and `lib/api-zod` packages; portal pages must not duplicate API contracts.
7. **AI and files**: retain the backend AI routes/services and `Document` models. Use Vercel Blob for new file storage; Blob URLs are CDN-cached for up to one month, so use immutable object URLs rather than overwriting a file path.

## Vercel project disposition

### Migrate into routes

- `neuroassess-patient-portal` → `/patient`
- `neuroassess-clinician-portal` → `/clinician`, `/titration`, `/prescriber`
- `neuroassess-admin-portal` and `admin-portal*` → `/admin`, `/finance`
- `super-admin-portal*` → `/platform`
- `neuroassess-system-portal` → `/platform` and shared shell capabilities
- `neuroassess-web*` and `mockup-sandbox*` → assess for reusable design/components only; do not retain as deployments

### Consolidate backend

- `api-server`, `api-server-y1h4`, and `neuro-care-platform-api-server` are duplicate backend candidates. Select exactly one as the canonical API project after comparing environment variables, domains, and production deployment health. Rename or replace it only after cutover validation.

### Keep separate only if intentionally public

- `marketing-site` and `neuroassess-marketing` should remain separate only if a public marketing site is required. Otherwise migrate public pages into the consolidated app under `/` and retire the duplicate.
- `adhdasd-xpej` is not attributable from the reviewed source and requires owner confirmation before any change.

## Implementation sequence

1. Create `apps/neurocare-platform` and move the shared portal shell into a reusable component layer.
2. Implement authenticated route groups for the seven target route areas. Use middleware/server guards for role checks.
3. Add API endpoints and contract types for patient journey, global search, notifications, queues, and atomic care-team transfers.
4. Connect all pages to the existing API client and Prisma-backed backend. Empty states must be data-driven, not hard-coded.
5. Add audit coverage for workflow changes, ownership transfers, prescription actions, finance operations, and privileged administration.
6. Create the canonical Vercel frontend project `neurocare-platform`; configure its root directory as `apps/neurocare-platform`.
7. Identify the canonical API project; configure `api.neurocare-platform.vercel.app` only after the frontend project and API target are verified. Vercel-generated `*.vercel.app` hostnames cannot be selected manually, so a custom domain is required for that exact hostname.
8. Migrate production environment variables and integrations to the canonical frontend/API projects without exposing values in source control.
9. Deploy preview, validate sign-in, route authorization, each portal workflow, transfer audit trail, file access, and rollback.
10. Cut production traffic to the consolidated application. Retain old portal projects during a defined rollback window, then manually delete confirmed duplicates from Vercel project Settings.

## Exit criteria

- One frontend project serves all role routes.
- One backend project and one Prisma database serve every workflow.
- No portal is selected by a client-side mode switch.
- Each workflow transfer retains a durable ownership and audit record.
- All protected routes reject unauthorized roles.
- The canonical frontend and API domains, environment variables, observability, and rollback procedure are verified.
- Legacy projects are removed only after the rollback window and explicit confirmation.
