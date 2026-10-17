# Clinical safety controls

## Psychometrics

Questionnaire scoring is deterministic, versioned, and stored with the instrument version used. Scores are **screening and decision-support information, not diagnoses**. The clinician remains responsible for interpretation in the context of clinical history, corroborative information, impairment, differential diagnosis, and risk.

The platform must create a high-priority clinical task whenever PHQ-9 item 9 is non-zero. It must not display emergency guidance conditionally based only on a score; the patient-facing flow must provide an immediately visible crisis route and local emergency guidance.

## AI-assisted content

AI output is draft-only. It must be clearly labelled, retain source provenance, never be sent to a patient without clinician sign-off, and never make a diagnostic, prescribing, or risk disposition decision. Do not send special-category personal data to an AI provider without a documented lawful basis, data-processing agreement, and an approved data-protection impact assessment.

## Release gates

Before production release, validate each instrument against its licensed/current scoring guidance, conduct clinical safety review (DCB0129/DCB0160 as applicable), complete DPIA and penetration testing, configure Supabase RLS policies, and exercise restore and incident-response procedures.
