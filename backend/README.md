# NeuroCare clinic backend

Enterprise-oriented TypeScript/Express modular monolith for a UK ADHD and autism assessment clinic.

## Local setup

```bash
cd /Users/iramarshad/Downloads/NeuroCare-Platform
cp backend/.env.example backend/.env
corepack pnpm install
corepack pnpm --dir backend prisma:generate
corepack pnpm --dir backend prisma:migrate --name init
corepack pnpm --dir backend dev
```

The API listens on `http://localhost:4000` and health checks at `GET /api/v1/health`.

Start PostgreSQL first when needed:

```bash
corepack pnpm --dir backend exec docker compose up -d postgres
```

Run checks:

```bash
corepack pnpm --dir backend typecheck
corepack pnpm --dir backend test
corepack pnpm --dir backend build
```

See [docs/architecture.md](docs/architecture.md) for boundaries, security assumptions, and production hardening requirements.
