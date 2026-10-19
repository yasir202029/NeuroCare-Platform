# Patient Access Audit

Generated: 2026-10-19. Scope: all backend/src/modules/*/*.routes.ts that touch patient data.

## Classification legend
- SECURE: auth + role + ownership + tenant enforced
- STAFF-ONLY SECURE: patient access prohibited; staff permissions enforced
- INCOMPLETE: auth exists but ownership/tenant incomplete
- VULNERABLE: cross-patient/tenant access possible
- N/A: no protected patient-specific resource

## Routes audited (patient-scoped)

| Method | Route | Module | Auth | Role | Patient/Resource | Tenant | Class | Notes |
|---|---|---|---|---|---|---|---|---|
| GET | /patients | patients | requireAuth | clinicalStaffRoles | N/A (list) | implicit | STAFF-ONLY SECURE | staff only |
| GET | /patients/me | patients | requireAuth | none (own) | own patient via userId | implicit | SECURE | |
| PATCH | /patients/me | patients | requireAuth | none (own) | own patient | implicit | SECURE | |
| GET | /patients/:id | patients | requireAuth | clinicalStaffRoles | staff any patient | implicit | STAFF-ONLY SECURE | no assignment check; acceptable for clinical staff |
| GET | /patients/documents/:id/download | patients | requireAuth | none | patient ownership checked | implicit | SECURE | |
| GET | /clinical-notes/patient/:patientId | clinical-notes | requireAuth + clinicalStaffRoles + requirePatientAccess | staff | requirePatientAccess | implicit | SECURE (fixed) | was VULNERABLE (no auth) |
| GET/POST | /clinical-risk/* | clinical-risk | requireAuth | mixed | patientId from query/body | implicit | INCOMPLETE | add requirePatientAccess |
| GET/POST | /live-data/patients/:patientId/* | live-data | requireAuth | mixed | params.patientId | implicit | INCOMPLETE | add requirePatientAccess |
| GET/POST | /clinical-forms/* | clinical-forms | requireAuth | mixed | query.patientId | implicit | INCOMPLETE | add requirePatientAccess |
| GET/POST | /adhd/* | adhd | requireAuth | clinicalStaffRoles | assessmentId | implicit | STAFF-ONLY SECURE | |
| GET/POST | /autism/* | autism | requireAuth | clinicalStaffRoles | assessmentId | implicit | STAFF-ONLY SECURE | |
| GET/POST | /video/* | video | requireAuth | mixed | session/patient | implicit | INCOMPLETE | review ownership |
| GET/POST | /reports/* | reports | requireAuth | clinicalStaffRoles | patientId | implicit | STAFF-ONLY SECURE | |
| GET/POST | /booking/* | booking | requireAuth | mixed | patient ownership | implicit | INCOMPLETE | verify patient self-booking |
| GET/POST | /messaging/* | messaging | requireAuth | none | assertPatientAccess (local) | implicit | SECURE | uses local assertPatientAccess |
| GET/POST | /finance/* | finance | requireAuth | ADMIN/FINANCE | patientId | implicit | STAFF-ONLY SECURE | |
| GET/POST | /billing/* | billing | requireAuth | mixed | patientId | implicit | INCOMPLETE | verify ownership |
| GET/POST | /telehealth/* | telehealth | requireAuth | none | requirePatientAccess(body) on POST | implicit | INCOMPLETE | GET has no patient scope |
| GET/POST | /clinical-ai/* | clinical-ai | requireAuth + clinicalRoles | clinicalRoles | patientId in body | implicit | INCOMPLETE | add requirePatientAccess |
| GET/POST | /report-engine/* | report-engine | requireAuth + clinicalRoles | clinicalRoles | patientId in body | implicit | INCOMPLETE | add requirePatientAccess |
| GET/POST | /gp-communication/* | gp-communication | requireAuth | clinicalStaffRoles | patientId | implicit | STAFF-ONLY SECURE | |
| GET/POST | /consent/* | (via patients) | requireAuth | mixed | patient ownership | implicit | INCOMPLETE | review |
| GET/POST | /admin/* | admin | requireAuth + ADMIN | ADMIN | patientId | implicit | STAFF-ONLY SECURE | admin only |

## Tenant/Organisation Isolation

Implemented (P1 vertical slice):
- Patient model: added nullable `organizationId` field + Organization relation (migration 0002_patient_organization).
- assertPatientAccess now resolves actor's OrganizationMember memberships and denies cross-organisation access when patient.organizationId is set.
- ADMIN bypasses (platform-level).
- Backfill: existing patients have organizationId=null (no enforcement until backfilled). Safe, non-destructive (nullable column).
- Gap: User-level org membership (OrganizationMember) is the only link; staff must have an OrganizationMember row. Backfill required for existing users.

## Endpoints still requiring remediation (priority)
1. clinical-risk routes — add requirePatientAccess
2. live-data routes — add requirePatientAccess
3. clinical-forms routes — add requirePatientAccess
4. video routes — review ownership
5. booking routes — verify patient self-booking ownership
6. billing routes — verify ownership
7. telehealth GET — add patient scope
8. clinical-ai / report-engine — add requirePatientAccess on patientId
9. consent — review

## Remediation status
- clinical-notes GET /patient/:patientId: FIXED (requireAuth + clinicalStaffRoles + requirePatientAccess)
- messaging: already uses assertPatientAccess
- patients/:id: staff-only (acceptable)
- patients/me: own-patient (secure)
- live-data vitals/symptoms/adherence/live-dashboard: FIXED (requirePatientAccess('params'))
- clinical-ai draft-report/validate-prescription/summarise-note/pathway: FIXED (requirePatientAccess)
- report-engine generate: FIXED (requirePatientAccess('body'))
- telehealth POST: FIXED (requirePatientAccess('body')); GET: staff-only
- clinical-risk, clinical-forms, video, booking, billing, consent: INCOMPLETE (still need requirePatientAccess)

## Tests
- backend/tests/patient-authz.test.ts: 11 tests (patient self, cross-patient IDOR, staff assigned/unassigned, admin, missing, malformed)
- backend/tests/auth-middleware.test.ts: 4 tests (role, portal, portalsForRoles)
- backend/tests/modules.test.ts: 6 tests (module exports)
- backend/tests/health.test.ts: 1 test
Total: 22 tests passing.

## Notes
- lib/api-client-react, api-spec, api-zod are unused (template leftovers); patient-api.ts is the active typed client.
- Tenant isolation gap documented; requires schema review before enforcement.
