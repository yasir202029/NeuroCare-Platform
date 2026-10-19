# Portal Separation Audit

## Current State (Before Refactor)

### Mixed Architecture Problem
`apps/neurocare-platform` is a single Next.js app using `PlatformShell` component with role-based navigation.
The `portalConfig` object defines 6 personas (patient, clinician, titration, prescriber, admin, finance)
all rendered through one shared shell with role-conditional nav items.

This violates portal separation: one universal dashboard with role-hidden menus.

### Route Classification

#### neurocare-platform (MIXED — contains all portals)
- /patient/* → PATIENT (should stay here)
- /clinician/* → CLINICIAN (should move to clinician-portal)
- /prescriber/* → CLINICIAN (should move to clinician-portal)
- /titration/* → CLINICIAN (should move to clinician-portal)
- /admin/* → ADMIN (should move to admin-portal)
- /finance/* → ADMIN (should move to admin-portal)
- /saas-admin/* → ADMIN (should move to admin-portal)
- /engine, /workflows, /tasks, /rules, /events, /states → SHARED (admin/clinician tooling)
- /patient/* → PATIENT (correct location)
- /login, /onboarding, /about, /contact → SHARED-AUTH / PUBLIC
- /ai-insights, /health-dashboard, /visual-dashboard, /hooks-console, /live-data → MISPLACED (mixed)
- /telehealth, /saas-plans → MISPLACED (mixed)
- /portal → MISPLACED (universal portal hub — should not exist)

#### clinician-portal (STUB)
- app/layout.tsx, app/page.tsx — minimal stub ("NeuroAssess | clinician portal")
- No real functionality yet

#### admin-portal (STUB)
- app/layout.tsx, app/page.tsx — minimal stub ("NeuroAssess | admin portal")
- No real functionality yet

#### marketing-site (PUBLIC)
- app/layout.tsx, app/page.tsx — public marketing site
- OK as-is

#### mobile (PATIENT COMPANION)
- Expo app, patient-focused
- OK as-is

### Shared Components (INTENTIONAL)
- PlatformShell: currently universal — needs splitting into PatientShell, ClinicianShell, AdminShell
- ui-components.tsx: shared primitives (OK)
- accessibility.tsx: shared (OK)
- error-boundary.tsx: shared (OK)
- components/*: mixed — some patient-specific, some generic

### Portal Leakage Found
1. Single nav array with all 6 portals in PlatformShell — ALL portals see all nav items
2. One sidebar contains every role's navigation
3. One home page (PortalExperience) renders role-based cards for all personas
4. /portal route is a universal portal hub (should not exist)
5. Patient page imports PlatformShell with portal="patient" (correct usage but shared shell)

### Shared Primitives to KEEP
- Button, Input, Modal, Table primitives (ui-components.tsx)
- Date/time utilities
- API client (authenticatedFetch, patient-api, document-api)
- Auth primitives (server-auth.ts)
- Design tokens (clarity package)
- ErrorBoundary, LoadingState, EmptyState
- Form primitives
- Audit types

### Portal-Specific Shells Needed
- PatientShell: minimal, calm, simple nav, mobile-friendly, task-oriented
- ClinicianShell: high-density, clinical context, keyboard-friendly, desktop-optimized
- AdminShell: operational, queue-oriented, filter-focused, bulk-capable

### Route Ownership Target
- Patient (neurocare-platform): /, /appointments, /questionnaires, /documents, /treatment, /messages, /profile, /onboarding, /book, /patient/journey
- Clinician (clinician-portal): /, /schedule, /patients, /patients/:id, /assessments, /tasks, /messages, /reports
- Admin (admin-portal): /, /operations, /patients, /bookings, /workforce, /tasks, /finance, /configuration, /access, /audit
- Public (marketing-site): /, /about, /contact, /services
- Mobile: patient companion (high-frequency interactions)

### Next Steps
1. Create portal-specific shells
2. Move clinician routes to clinician-portal
3. Move admin routes to admin-portal
4. Remove universal PlatformShell usage
5. Remove /portal hub route
6. Update portal routing (resolvePortalForUser)
