# Prisma

Run `corepack pnpm --dir backend prisma:generate` after installing dependencies.

For local development:

```bash
corepack pnpm --dir backend prisma:migrate --name init
```

Production migrations should run from CI with `prisma migrate deploy`. Never commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
