# Deployment — NeuroCare Platform (launch-it)

Single-command local deployment: one shared Express API + one role-routed
Next.js frontend + the native Engine, all wired to the same PostgreSQL database.

## Prerequisites

- Node 20+, pnpm 9+
- PostgreSQL 14+ running locally (default: `localhost:5432`, database `clinic`)
- Ports free: `4000` (API), `3000` (web)

## 1. Backend (Express + Prisma)

```bash
cd backend
cp .env.example .env   # then set DATABASE_URL + JWT secrets
npx prisma generate
npx prisma db push     # sync schema (or: npx prisma migrate dev)
npx tsx prisma/seed.ts # permissions, teams, demo users (password: Neurocare123)
npx tsc -p tsconfig.json --noEmit   # typecheck (must be clean)
npm test -- --run       # vitest
node dist/server.js     # production (or: npm run dev for watch mode)
```

Health: `GET http://localhost:4000/api/v1/health`

## 2. Frontend (Next.js master app)

```bash
cd apps/neurocare-platform
# .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
npx tsc --noEmit
npx next build
npx next start --port 3000
```

Auth: browser posts to `/api/auth/login` (Next.js route), which forwards to the
API and sets `neurocare_access` (`Path=/api/v1`) + `neurocare_refresh`
(`Path=/api/auth`) HttpOnly cookies. API calls go through the `/api/:path*`
rewrite to the Express backend with cookies attached; 401s auto-refresh once.

## 3. Engine (native, mounted at `/api/v1/engine`)

- `GET /engine` — snapshot (states, rules, workflow counts, task counts, events)
- `GET /engine/states|rules|events|tasks|workflows`
- `POST /engine/workflows/transition` — rule-validated state change + queue
  item + audit event in one transaction; returns next permitted stages
- `POST /engine/tasks/:id/complete` — complete a queue item with audit event
- UI: `/engine`, `/workflows`, `/states`, `/rules`, `/events`, `/tasks`
  (transition form + task completion mounted in the console)

## Demo accounts (password: `Neurocare123`)

| Email | Role | Workspace |
|---|---|---|
| admin@neurocare.test | ADMIN | /admin, /engine, /finance |
| psychiatrist@neurocare.test | PSYCHIATRIST | /clinician, /engine |
| prescriber@neurocare.test | PRESCRIBER | /prescriber, /clinician |
| nurse@neurocare.test | NURSE | /titration, /clinician |
| finance@neurocare.test | FINANCE | /finance |
| patient@neurocare.test | PATIENT | /patient |

## Verify end to end

```bash
# login through the frontend (sets cookies)
curl -c /tmp/c.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@neurocare.test","password":"Neurocare123"}'
# engine via the frontend rewrite
curl -b /tmp/c.txt http://localhost:3000/api/v1/engine | head -c 200
# run a transition (use real patient/team cuid ids)
curl -b /tmp/c.txt -X POST http://localhost:3000/api/v1/engine/workflows/transition \
  -H 'Content-Type: application/json' \
  -d '{"patientId":"<cuid>","toStage":"OUTCOME","reason":"...","teamId":"<cuid>"}'
```
