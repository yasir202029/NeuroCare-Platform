# NeuroCare Platform Architecture

## Overview
NeuroCare is a full-stack ADHD remote clinic platform built with Next.js (frontend), Express + Prisma + PostgreSQL (backend), and a workflow engine for clinical pathway management.

## Architecture Layers

### 1. Client Layer (Frontend - Next.js)
- **Pages:** Role-based portals (patient, clinician, prescriber, titration, finance, admin)
- **Shared:** Components, hooks, API client, types
- **SEO:** Meta tags, sitemap, robots.txt, Open Graph, structured data
- **Styling:** CSS-in-JS with consistent design tokens

### 2. API Layer (Backend - Express)
- **Auth:** JWT authentication with HttpOnly cookies
- **Routes:** RESTful API endpoints grouped by domain
- **Middleware:** Auth, audit, rate-limiting, error handling

### 3. Business Logic Layer
- **Workflow Engine:** Rule-based clinical pathway transitions
- **Clinical Risk:** NICE-aligned stratification
- **SaaS:** Subscription, org management, feature flags
- **GP Communication:** Shared care referrals
- **Hooks/Rails:** Event system and guardrails

### 4. Data Layer (PostgreSQL + Prisma)
- **Models:** Patient, Clinician, Appointment, Assessment, WorkflowTransition, etc.
- **Relations:** Proper foreign keys and indexes

## Portal Architecture (One by One)

### Portal 1: Patient
- Download: Clinical reports, prescriptions, forms
- Workflow: Referral → Assessment → Titration → Prescribing → Shared Care → Discharge
- Features: Book appointments, message care team, view records

### Portal 2: Clinician
- Download: Patient summaries, workflow reports
- Workflow: Transition patients through stages
- Features: Risk-ranked worklist, clinical notes

### Portal 3: Prescriber
- Download: Prescriptions, medication guides
- Workflow: Review → Sign → Issue prescriptions

### Portal 4: Titration
- Download: Titration schedules, monitoring charts
- Workflow: Dose adjustment tracking

### Portal 5: Finance
- Download: Invoices, payment receipts, revenue reports
- Workflow: Invoice → Payment → Reconciliation

### Portal 6: Admin
- Download: Audit logs, user reports, system exports
- Workflow: User management, system configuration

## Tech Stack
- Frontend: Next.js 14, React, TypeScript
- Backend: Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: JWT with HttpOnly cookies
- Real-time: WebSocket for live data
- Deployment: Docker Compose, GitHub Actions CI/CD
## Wired Runtime (Docker Compose)

Services (docker-compose.yml + override):
- postgres (5432) — PostgreSQL 16
- migrate — Prisma db push (one-shot)
- backend (4000) — Express API + mounted Engine (/api/v1/engine), JWT auth, rate limiting
- frontend (3000) — Next.js neurocare-platform (role-routed portals + engine UI)
- web (3001) — Next.js marketing-site

Health endpoints:
- Backend: GET /api/v1/health
- Frontend/Web: GET /
- Engine: GET /api/v1/engine

Startup order: postgres → migrate → backend → frontend/web

## Advanced Features (Remote ADHD Clinic)

- SEO: metadata, sitemap.xml, robots.txt on both frontend and marketing site
- Visual analytics dashboard: pathway throughput charts
- Extension hooks & rails console: plugin-style extension points, guardrails
- AI integration: AI insights page wired to backend AI module
- Clinician Powerhub: advanced EHR workstation with GDPR controls
- UK GDPR: SAR, erasure, rectification, portability, consent, ROPA, breach log, retention, DPIA

## Remote ADHD/ASD Clinic — Full Journey Architecture

### Patient Journey (entry → completion)
1. Referral & Intake (GP referral, demographics, consent)
2. Initial Assessment (clinical interview, rating scales, risk stratification)
3. Diagnosis (ADHD/ASD formulation)
4. Titration (medication initiation & dose optimization)
5. Prescribing (issue, CD/non-CD, courier dispatch)
6. Shared Care (GP agreement)
7. Discharge (outcome review, planning)

### Clinician Journey (powerhub workstation)
- Single workspace: assessment + titration + prescribing (CD & non-CD) + report writing/signing + follow-up
- Patient worklist, risk ranking, task queues, transfer/escalation
- AI assistant: draft reports, validate prescriptions, summarise notes, pathway guidance
- Earnings & accounts, audit trail, GDPR controls

### Admin Role
- User/patient management, permissions, audit, governance, AI policy, feature flags, SaaS billing

### Services (Docker)
- postgres (5432) → migrate → backend (4000, engine at /api/v1/engine, hooks/rails, GDPR, clinical-ai proxy, report-engine proxy)
- frontend (3000) — neurocare-platform (role-routed portals + powerhub + AI + live data)
- web (3001) — marketing site (SEO)
- report-engine (8000) — Python/FastAPI report generation
- clinical-ai (8001) — Python/FastAPI clinical AI (draft reports, validate Rx, summarise, pathway)

### Live Data
- WebSocket /api/v1/live-data/ws for real-time vitals/symptoms/adherence
- Frontend useLiveData hook consumes the stream

### Integration
- Backend proxies to Python services (REPORT_ENGINE_URL, CLINICAL_AI_URL)
- Engine mounted at /api/v1/engine (rule-validated transitions, tasks, audit)
- Hooks & rails: extensible guardrails (BLOCK/WARN/LOG/REQUIRE_APPROVAL)
