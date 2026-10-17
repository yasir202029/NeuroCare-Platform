# Multi-portal architecture

Each app in `apps/` is deployed as an independent Vercel project. `main` is Production, `develop` is Staging, feature branches produce Preview deployments, and UAT is a Vercel custom environment. Environment values are managed per project in Vercel, not committed.

| App | Intended domain | Role boundary |
|---|---|---|
| marketing-site | neuroassess.co.uk | public |
| patient-portal | portal.neuroassess.co.uk | PATIENT |
| clinician-portal | clinician.neuroassess.co.uk | CLINICIAN |
| admin-portal | admin.neuroassess.co.uk | ADMIN, FINANCE, RECEPTIONIST, SUPPORT |
| super-admin-portal | system.neuroassess.co.uk | SUPER_ADMIN |

Domain assignment happens only after the domain is added and verified in Vercel.
