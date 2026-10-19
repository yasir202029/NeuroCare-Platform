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

## 3. Detailed Route Classification — `apps/neurocare-platform` (Universal Portal — to be split)

| Route | Classification | Disposition |
|-------|---------------|-------------|
| `/` | MISPLACED | Portal chooser listing all personas — remove; patient app should show patient home |
| `/patient` | PATIENT | Keep — move to patient-only app |
| `/patient/book` | PATIENT | Keep — patient booking |
| `/patient/journey` | PATIENT | Keep — patient journey |
| `/clinician` | MISPLACED | Move to `apps/clinician-portal` |
| `/admin` | MISPLACED | Move to `apps/admin-portal` |
| `/prescriber` | MISPLACED | Move to `apps/clinician-portal` |
| `/titration` | MISPLACED | Move to `apps/clinician-portal` |
| `/finance` | MISPLACED | Move to `apps/admin-portal` |
| `/engine` | MISPLACED | Operational — admin/clinician tooling only |
| `/workflows` | MISPLACED | Operational — admin/clinician tooling only |
| `/uk-adhd` | MISPLACED | Clinical assessment — clinician only |
| `/risk-ranking` | MISPLACED | Clinical safety — clinician only |
| `/ai-insights` | MISPLACED | AI clinical insights — clinician only |
| `/medication-safety` | MISPLACED | Medication safety — clinician only |
| `/letter-generator` | MISPLACED | AI letter generator — clinician only |
| `/saas-admin` | MISPLACED | Platform operations — admin only |
| `/saas-plans` | MISPLACED | Billing — admin only |
| `/tasks` | MISPLACED | Task queue — operational |
| `/notifications` | SHARED-AUTH | Could be patient/clinician/admin |
| `/documents` | PATIENT | Patient documents |
| `/messages` | PATIENT | Patient messages |
| `/profile` | PATIENT | Patient profile |
| `/about` | PUBLIC | Move to marketing-site |
| `/contact` | PUBLIC | Move to marketing-site |
| `/login` | SHARED-AUTH | Shared authentication entry |
| `/api-docs` | SHARED-AUTH | Shared API documentation |
| `/health-dashboard` | MISPLACED | Remove from patient app |
| `/hooks-console` | MISPLACED | Developer tool — remove |
| `/live-data` | MISPLACED | Operational — remove from patient app |
| `/events` | MISPLACED | Operational — remove |
| `/rules` | MISPLACED | Rules engine — remove |
| `/states` | MISPLACED | States — remove |
| `/visual-dashboard` | MISPLACED | Analytics — remove |
| `/telehealth` | MISPLACED | Mixed — remove |
| `/portal` | MISPLACED | Universal portal hub — should not exist |

## 4. Route Classification — Other Portal Apps

| App | Route | Classification | Reasoning |
|-----|-------|---------------|-----------|
| `apps/clinician-portal` | `/` | CLINICIAN | Clinician workspace — correct app, minimal stub |
| `apps/admin-portal` | `/` | ADMIN | Placeholder "System Online" — needs full admin shell |
| `apps/marketing-site` | `/` | PUBLIC | Marketing placeholder — needs public acquisition content |
| `apps/mobile` | `/` | PATIENT | Mobile patient companion — minimal |

## 5. Portal Leakage Findings

### 5.1 `PlatformShell` — Universal Shell (PORTAL LEAKAGE)

**File:** `apps/neurocare-platform/components/platform-shell.tsx`

`PlatformShell` renders ALL portals (patient, clinician, titration, prescriber, finance, admin) with role-based configuration in `portalConfig`. Contains all portal navigation, workflow stages, and cards in one component.

**Classification:** PORTAL LEAKAGE — must be replaced by `PatientShell`, `ClinicianShell`, `AdminShell`.

### 5.2 `portal-experience.tsx` — Universal Experience Component (PORTAL LEAKAGE)

**File:** `apps/neurocare-platform/components/portal-experience.tsx` (1,399 lines)

Contains patient, clinician, titration, prescriber, admin, and finance experiences all in one file with shared state and API calls.

**Classification:** PORTAL LEAKAGE — must be split into portal-specific experience components.

### 5.3 Root Page `/` — Portal Chooser (MISPLACED)

**File:** `apps/neurocare-platform/app/page.tsx`

## 8. Shared Infrastructure (TO RETAIN)

| Item | File | Classification |
|------|------|---------------|
| API client (`authenticatedFetch`) | `apps/neurocare-platform/lib/client-api.ts` | SHARED — retain |
| Server auth helpers | `apps/neurocare-platform/lib/server-auth.ts` | SHARED — retain |
| Patient API client | `apps/neurocare-platform/lib/patient-api.ts` | SHARED — retain (patient-specific DTOs) |
| Document API client | `apps/neurocare-platform/lib/document-api.ts` | SHARED — retain |
| Live data hook | `apps/neurocare-platform/lib/use-live-data.ts` | SHARED — retain |
| Dynamic config / feature flags | `apps/neurocare-platform/lib/dynamic-config.ts` | SHARED — retain |
| Permissions engine | `packages/permissions` | SHARED — retain |
| Access roles | `packages/access` | SHARED — retain |
| Backend API | `backend/` | SHARED — retain |
| Database | `backend/prisma/` | SHARED — retain |

## 9. Target Product Topology

```
                         MARKETING SITE (apps/marketing-site)
                              │
                     Identity / Authentication
                              │
                   ┌──────────┼───────────┐
                   │          │           │
                   ▼          ▼           ▼
                PATIENT    CLINICIAN     ADMIN
                PORTAL     WORKSTATION   WORKSTATION
       (apps/neurocare-platform)  (apps/clinician-portal)  (apps/admin-portal)
                   │          │           │
                   └──────────┼───────────┘
                              ▼
                       Shared API Layer (backend/)
                              │
                              ▼
                    Domain/Application Layer
                              │
                              ▼
                         Data Layer (PostgreSQL)
```

## 10. Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **PHASE A** | Portal ownership audit (this document) | COMPLETE |
| **PHASE B** | Authentication → persona → portal-routing correction | PENDING |
| **PHASE C** | Patient shell and patient journey | PENDING |
| **PHASE D** | Clinician shell | PENDING |
| **PHASE E** | Clinician longitudinal patient workspace | PENDING |
| **PHASE F** | Admin shell and operations home | PENDING |
| **PHASE G** | Remove remaining portal leakage | PENDING |
| **PHASE H** | Full journey validation | PENDING |

## 11. Next Immediate Actions

1. Create `packages/portal-routing` with `resolvePortalForUser()` contract
2. Create `ClinicianShell` in `apps/clinician-portal`
3. Create `AdminShell` in `apps/admin-portal`
4. Refactor `apps/neurocare-platform` to be patient-only (remove clinician/admin/finance/titration/prescriber routes)
5. Create `docs/USER_JOURNEYS.md` with separate patient/clinician/admin journey maps
6. Remove `PlatformShell` and `portal-experience.tsx` universal components


Renders "Choose your workspace" with links to all personas — a mixed dashboard.

**Classification:** MISPLACED — should be patient home.

### 5.4 Clinician/Admin/Titration/Prescriber/Finance Pages (MISPLACED)

All render `PlatformShell portal="X"` — clinician/admin experiences inside the patient app.

**Classification:** MISPLACED — these belong in their own portal apps.

### 5.5 `NotificationBell` (INTENTIONAL SHARED PRIMITIVE)

**File:** `apps/neurocare-platform/components/NotificationBell.tsx`

Generic notification component. Acceptable as shared primitive.

### 5.6 `FeatureGate` (INTENTIONAL SHARED PRIMITIVE)

**File:** `apps/neurocare-platform/components/FeatureGate.tsx`

Feature flag gate component. Acceptable as shared primitive.

### 5.7 `patient-shell.tsx` (INTENTIONAL SHARED PRIMITIVE — needs refinement)

**File:** `apps/neurocare-platform/components/patient-shell.tsx`

Simple patient navigation shell. Already portal-specific but only used by patient-dashboard-client.

**Classification:** INTENTIONAL SHARED PRIMITIVE — keep, refine for patient product.

## 6. Missing Portal Shells

| Shell | Status | File |
|-------|--------|------|
| `PatientShell` | EXISTS | `apps/neurocare-platform/components/patient-shell.tsx` |
| `ClinicianShell` | MISSING | — |
| `AdminShell` | MISSING | — |

## 7. Missing Portal-Routing Contract

| Contract | Status |
|----------|--------|
| `packages/portal-routing` | MISSING — directory does not exist despite being in `pnpm-workspace.yaml` |
| `resolvePortalForUser(user, memberships, context)` | MISSING |
| Persona selection for multi-persona users | MISSING |
