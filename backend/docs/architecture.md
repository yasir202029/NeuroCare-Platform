# NeuroCare backend architecture

## Shape

The backend is a TypeScript modular monolith. `src/server.ts` owns process lifecycle, `src/app.ts` owns HTTP composition, and each feature under `src/modules` owns its routes and application orchestration. Shared concerns live under `src/shared` and cross-cutting adapters live under `src/services` and `src/infrastructure`.

```text
HTTP -> middleware -> module route -> application/service -> Prisma -> PostgreSQL
                                  \-> provider adapter (Supabase, Stripe, OpenAI, messaging)
```

## Modules

- `auth`: registration, password login, refresh-token rotation, password reset, TOTP MFA.
- `patients`: patient demographics, NHS number, contact consent, medical history.
- `booking`: availability, assessment appointments, status changes.
- `adhd` and `autism`: screening responses and assessment workflow state.
- `clinical-notes`: clinician notes, signing, attachment relationship, audit events.
- `ai`: clinician-only draft and summarisation endpoints. AI output is always marked for human review.
- `billing`: invoices, payments, Stripe checkout and webhook boundary.
- `messaging`: in-app/email/SMS message boundary.
- `admin`: users, user status, summary reporting.

## Security baseline

- JWT access tokens are short lived; refresh tokens are rotated and stored hashed.
- Passwords and reset tokens are hashed at rest.
- All protected clinical writes can emit an `AuditEvent`.
- Helmet, CORS allow-list, body-size limit, request IDs, structured errors, and Zod validation are enabled.
- NHS numbers and clinical content must be encrypted at rest by the production database/storage layer and must not be logged.
- Supabase service keys, Stripe secrets, and OpenAI keys are server-only environment variables.
- AI output is a draft only; clinician approval is required before a report is shared.

## Production hardening still required

Before handling live patient data, add a secrets manager/KMS-backed encryption service, real Supabase Storage client, OpenAI policy controls and prompt logging, Stripe signature verification, provider retry/dead-letter queues, rate limiting/WAF, CSP tuning, backup/restore tests, DPIA/UK GDPR retention policies, safeguarding escalation workflows, and independent clinical/security review.
