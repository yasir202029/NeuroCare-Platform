# NeuroCare Engine recommendation

## Recommendation: native Engine modules inside NeuroCare-Platform

Do not introduce a separate external workflow engine at this stage. Build and operate the NeuroCare Engine natively in the existing shared backend. The platform already has the database entities required for durable workflow state, tasks, ownership transfers, audit records, notifications, and AI runs. Adding a second workflow datastore would create dual sources of truth for clinical state.

This is the lightest path that preserves patient-level auditability and keeps portal actions within the existing authenticated API boundary.

## Evaluation

| Option | Fit for NeuroCare | Decision |
| --- | --- | --- |
| n8n | Useful for external, non-clinical integrations and notifications; not the clinical source of truth. | Do not use for core patient workflows. Integrate later only for isolated operational automation. |
| Node-RED | Visual integration tooling but adds a separate runtime and state surface. | Do not use for clinical workflows. |
| Workflow Core | Requires an additional application/runtime stack and does not reduce the existing TypeScript/Prisma implementation. | Do not adopt. |
| Temporal | Strong durable orchestration, but introduces infrastructure, worker operations, and a second operational plane before the native model is exhausted. | Defer. Re-evaluate only for high-volume, multi-day, retry-heavy external integrations. |
| Camunda | Powerful BPMN/governance tooling but operationally heavier than the current clinic workflow scope. | Do not adopt. |
| Native TypeScript + Prisma | Reuses existing authenticated API, `WorkflowTransition`, `TeamQueueItem`, `PatientAssignment`, `AuditEvent`, and `AiRun` records. | Adopt now. |

## Native module boundaries

- `engine/state`: allowed states and valid transition graph.
- `engine/workflow`: command handlers for referral, assessment, outcome, titration, prescribing, shared care and discharge.
- `engine/task`: creates, assigns, completes and escalates patient tasks.
- `engine/transfer`: atomically updates ownership, queue assignment, transition history and audit event.
- `engine/rules`: deterministic clinical-operational policy definitions. Clinical decisions require authorised human actions.
- `engine/events`: immutable event/audit append operations and read models.
- `engine/navigation`: role/permission route mapping and context-aware related-record links.
- `engine/ai`: records AI inputs/outputs, requires review, and emits proposed actions instead of directly modifying patient state.

## Required command pattern

Portals must never write workflow tables directly. Every action calls an authenticated Engine command. A command must:

1. validate the actor’s role and patient assignment;
2. validate the current state and requested transition;
3. change state and task/ownership records in one transaction;
4. append audit/event records with actor, timestamp, previous state, new state, reason and affected record IDs;
5. return the next permitted pathways for the portal to render.

## Example pathways

- Assessment complete → authorised clinician selects ADHD, ASD, combined outcome, information required, ECG required, follow-up, medication or discharge.
- ECG required → create patient task and queue item → document verification event → reopen assessment review.
- ADHD confirmed → create titration or prescriber queue based on authorised outcome.
- Discharge → create letter/report action → record delivery/approval → close case only after required actions complete.

## Escalation threshold

Reconsider Temporal only when a workflow needs durable external retries or long-running fan-out beyond Vercel Function invocation limits and cannot be represented as persisted Engine commands plus scheduled jobs. Until then, native modules are simpler, auditable, and aligned with the single-platform goal.
