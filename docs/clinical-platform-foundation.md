# Clinical platform foundation

This change creates the security boundary required before storing clinical records.

- Roles are defined in `artifacts/api-server/src/security/roles.ts`.
- API routes except `/api/healthz` require a valid Supabase access token and an assigned role in token app metadata.
- The migration adds clinics and memberships, clinic isolation indexes, and Supabase RLS policies. Apply it from an environment that can reach the database; this repository does not run live migrations.
- `SUPABASE_SERVICE_ROLE_KEY`, database URLs, provider keys, and payment credentials remain server-only and must be set in the relevant Vercel project environment settings. Never set their values in source control.

Before enabling clinician or patient data entry, add role-specific RLS write policies, replace the prototype route arrays with database-backed repositories, and test tenant-isolation using two clinics.
