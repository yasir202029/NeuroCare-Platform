# Cross-Persona Handoffs

Each handoff is a domain state change. Portals never call each other — the
shared backend coordinates who owns the next step.

## H1 — Patient submits a questionnaire

| Field | Value |
|---|---|
| Triggering actor | Patient |
| Action | Answer the questionnaire and submit |
| Domain event / state change | `ClinicalFormSubmission.status`: `DRAFT` → `SUBMITTED`; `submittedAt` and `completedAt` set |
| Next owner | Clinician |
| Next action | Review the submitted questionnaire |
| Source resource | `ClinicalFormSubmission` |
| Destination experience | Clinician PowerHub → "Questionnaire review" queue |
| Task generated | `ClinicalTask` type `QUESTIONNAIRE_REVIEW`, created idempotently via the unique `questionnaireSubmissionId` |
| Completion condition | Clinician records the review through `SUBMITTED` → `UNDER_REVIEW` → `REVIEWED`; the task is set to `COMPLETED` |
| Error condition | Repeat submit is rejected (400). Editing a submitted questionnaire is rejected (403). A clinician not assigned to the patient is rejected (403). |
| Status | IMPLEMENTED — live-verified against the running stack |

## H2 — Clinician reviews a questionnaire

| Field | Value |
|---|---|
| Triggering actor | Clinician |
| Action | Record the review |
| Domain event / state change | `ClinicalFormSubmission.status`: `SUBMITTED` → `UNDER_REVIEW` → `REVIEWED`; `reviewedAt`, `reviewedById`, `reviewNotes` recorded |
| Next owner | Clinician (while `UNDER_REVIEW`), then Patient (once `REVIEWED`) |
| Next action | Clinician continues the review, then the patient's pathway recomputes |
| Source resource | `ClinicalFormSubmission` |
| Destination experience | Patient journey projection (the questionnaire leaves the outstanding list) |
| Task generated | The existing review task is completed |
| Completion condition | `status = REVIEWED` and the clinical task is `COMPLETED` |
| Error condition | Reviewing a `DRAFT` submission is rejected (400). Reviewing a `REVIEWED` submission is rejected (400). |
| Status | IMPLEMENTED — live-verified |

## H3 — Patient starts a questionnaire (in-progress work)

| Field | Value |
|---|---|
| Triggering actor | Patient |
| Action | Begin or continue answering |
| Domain event / state change | `ClinicalFormSubmission` created/updated with `status = DRAFT` |
| Next owner | Patient |
| Next action | Finish and submit |
| Source resource | `ClinicalFormSubmission` |
| Destination experience | Patient home next action becomes `COMPLETE_QUESTIONNAIRE` → `/patient/questionnaires` |
| Task generated | None — this is patient-owned work |
| Completion condition | Submission reaches `SUBMITTED` |
| Error condition | Editing a submitted questionnaire is rejected (403) |
| Status | IMPLEMENTED — in-progress drafts take priority over earlier pathway stages in the journey projection |

## H4 — Clinician assigns a patient to a team

| Field | Value |
|---|---|
| Triggering actor | Admin / clinical supervisor |
| Action | Assign a patient to a team member |
| Domain event / state change | `PatientAssignment` created; `WorkflowTransition` recorded; optional `TeamQueueItem` created |
| Next owner | Assigned clinician |
| Next action | Review the assigned patient's record |
| Source resource | `PatientAssignment`, `WorkflowTransition` |
| Destination experience | Clinician caseload (`/clinician/workspace`) |
| Task generated | Optional `TeamQueueItem` |
| Completion condition | — |
| Error condition | The selected user must be an active member of the selected team, otherwise the request is rejected |
| Status | IMPLEMENTED (pre-existing backend); the clinician caseload consumes it |

## H5 — Clinician requests evidence, patient uploads it

| Field | Value |
|---|---|
| Triggering actor | Clinician |
| Action | Request supporting evidence from a patient |
| Domain event / state change | `DocumentRequest` created with `status = PENDING` |
| Next owner | Patient |
| Next action | Upload the requested document |
| Source resource | `DocumentRequest` |
| Destination experience | Patient home next action becomes `UPLOAD_EVIDENCE` → `/patient/documents` |
| Task generated | None — this is patient-owned work |
| Completion condition | The request reaches `SUBMITTED` |
| Error condition | A clinician who is not assigned to the patient is rejected (403) |
| Status | IMPLEMENTED — live-verified |

## H6 — Patient uploads against a document request

| Field | Value |
|---|---|
| Triggering actor | Patient |
| Action | Upload the requested document |
| Domain event / state change | `Document` and `DocumentVersion` created; `DocumentRequest.status` → `SUBMITTED` |
| Next owner | Clinician |
| Next action | Review the uploaded document |
| Source resource | `Document`, `DocumentVersion` |
| Destination experience | Clinician "My document requests" list in the patient workspace |
| Task generated | `ClinicalTask` type `DOCUMENT_REVIEW`, created idempotently via the unique `documentRequestId` |
| Completion condition | Clinician accepts or rejects the request |
| Error condition | Uploading twice against the same request is rejected (400). A patient fulfilling another patient's request is rejected (403). |
| Status | IMPLEMENTED — live-verified |

## H7 — Clinician reviews an uploaded document

| Field | Value |
|---|---|
| Triggering actor | Clinician |
| Action | Accept or reject the document |
| Domain event / state change | `DocumentRequest.status` → `ACCEPTED` or `REJECTED`; `reviewedAt`, `reviewNotes` recorded |
| Next owner | Patient |
| Next action | `ACCEPTED`: nothing more is needed. `REJECTED`: the request returns to the outstanding list with a reason. |
| Source resource | `DocumentRequest` |
| Destination experience | Patient home next action recomputes; a rejected request becomes outstanding again |
| Task generated | The existing review task is completed |
| Completion condition | The request is `ACCEPTED` |
| Error condition | Reviewing a request that was never submitted is rejected (400). A clinician who did not make the request is rejected (403). |
| Status | IMPLEMENTED — live-verified |

## H6 — Patient books an appointment

| Field | Value |
|---|---|
| Triggering actor | Patient |
| Action | Request an available slot |
| Domain event / state change | `Appointment` created with `status = REQUESTED`; `Availability` marked booked |
| Next owner | Admin / booking staff, then the clinician |
| Next action | Confirm the booking |
| Source resource | `Appointment` |
| Destination experience | Admin command centre (booking counts), clinician schedule |
| Task generated | **Not implemented** — no booking-confirmation task |
| Completion condition | — |
| Error condition | A slot that is no longer available is rejected by the booking transaction |
| Status | PARTIAL — the appointment is created and visible, but the confirmation step has no task and no dedicated admin queue item |

## H7 — Payment failure

| Field | Value |
|---|---|
| Triggering actor | Payment provider / admin |
| Action | — |
| Domain event / state change | `Payment` / `Invoice` status change |
| Next owner | Patient or admin |
| Next action | Retry payment or resolve the exception |
| Source resource | `Invoice`, `Payment` |
| Destination experience | Patient journey projection surfaces `PAY_INVOICE` when an invoice is `OPEN`/`OVERDUE` |
| Task generated | **Not implemented** — no payment-resolution task is created for the admin queue |
| Completion condition | — |
| Error condition | — |
| Status | PARTIAL — the patient side is connected; the admin-side task is missing |

## Summary

| Handoff | Status |
|---|---|
| H1 Patient submits questionnaire → clinician | IMPLEMENTED |
| H2 Clinician reviews → patient | IMPLEMENTED |
| H3 Patient starts questionnaire → patient | IMPLEMENTED |
| H4 Admin assigns patient → clinician | IMPLEMENTED |
| H5 Clinician requests evidence → patient | IMPLEMENTED |
| H6 Patient uploads against a request → clinician | IMPLEMENTED |
| H7 Clinician reviews document → patient | IMPLEMENTED |
| H8 Patient books → admin/clinician | PARTIAL (no confirmation task or admin queue item) |
| H9 Payment failure → admin | PARTIAL (no admin task) |

No portal calls another portal. All handoffs are domain state changes
observed by the owning persona's read models.
