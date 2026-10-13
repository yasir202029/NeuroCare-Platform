# AI report generation engine

## Report lifecycle

```text
Select report template
  -> choose transcript, notes, questionnaires, or manual source
  -> generate AI draft
  -> persist AiOutput with model and prompt version
  -> persist ReportVersion
  -> clinician rewrites/expands/shortens/formats
  -> persist a new ReportVersion for every change
  -> clinician compares versions
  -> clinician approves
  -> report may be shared with patient, GP, school, employer, or shared-care provider
```

## API

```text
GET  /api/v1/reports/templates
POST /api/v1/reports/generate
GET  /api/v1/reports/:id
POST /api/v1/reports/:id/transform
GET  /api/v1/reports/:id/compare?left=1&right=2
POST /api/v1/reports/:id/approve
```

Supported report kinds include ADHD initial, follow-up, titration, shared care, and discharge reports; autism assessment, developmental history, informant, and diagnostic reports; GP, shared-care, school, employer, and supporting-evidence letters.

## Prompt and template management

`ReportTemplate` is the stable template identity. `ReportTemplateVersion` stores the versioned body, system prompt, and prompt version. `AiOutput` stores the input snapshot, provider model, action, output, and review status. Templates must be seeded and reviewed by the clinical governance owner before activation.

## Safety and access

- Report generation is restricted to authorised clinical roles.
- Patient and assessment ownership must be checked before production use.
- AI output is always `REVIEW_REQUIRED` until clinician approval.
- Every rewrite, expansion, shortening, formatting action, and approval creates an audit event.
- Reports must not be shared externally before approval.
- Prompts must instruct the model to use only supplied clinical facts and never invent diagnoses, medication, risk, or physical-health findings.
- OpenAI or another provider must be configured with an approved data-processing agreement before real patient content is sent.
- Production should add input redaction, provider-region controls, prompt injection detection, output validation, and a human safeguarding escalation path.
