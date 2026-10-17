-- Tenant-scoped care operations. No patient, prescription, or notification data is seeded.
create table if not exists public.patient_journeys (
  id text primary key,
  clinic_id text not null references public.clinics(id) on delete restrict,
  patient_id text not null references public.patients(id) on delete restrict,
  phase text not null check (phase in ('REFERRAL','SCREENING','QUESTIONNAIRES','ASSESSMENT_BOOKED','ASSESSMENT_IN_PROGRESS','EVIDENCE_COLLECTION','CLINICAL_REVIEW','DIAGNOSIS_DECISION','REPORT_PREPARATION','REPORT_ISSUED','MEDICATION_ELIGIBILITY_REVIEW','TITRATION','STABLE_TREATMENT','SHARED_CARE','ANNUAL_REVIEW')),
  entered_at timestamptz not null default now(), completed_at timestamptz, updated_by_profile_id text references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (clinic_id, patient_id)
);
create table if not exists public.prescription_cases (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, patient_id text not null references public.patients(id) on delete restrict, clinician_id text not null references public.clinicians(id) on delete restrict,
  status text not null check (status in ('PENDING_INFORMATION','AWAITING_CLINICAL_REVIEW','APPROVED','ISSUED','COLLECTED','EXPIRED','REVIEW_REQUIRED')), medication text, dose text, due_at timestamptz, last_reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.prescription_requirements (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, prescription_case_id text not null references public.prescription_cases(id) on delete cascade,
  requirement_type text not null check (requirement_type in ('BLOOD_PRESSURE','HEART_RATE','WEIGHT','HEIGHT','ECG','BLOOD_TESTS','INFORMANT_REPORT','SCHOOL_REPORT','CONSENT_FORM','RISK_ASSESSMENT','SIDE_EFFECT_REVIEW','MEDICATION_EFFECTIVENESS_REVIEW')), status text not null default 'OUTSTANDING' check (status in ('OUTSTANDING','SUBMITTED','VERIFIED','WAIVED')), due_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.review_schedules (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, patient_id text not null references public.patients(id) on delete restrict, prescription_case_id text references public.prescription_cases(id) on delete cascade,
  review_type text not null check (review_type in ('MEDICATION','FOLLOW_UP','ANNUAL')), due_at timestamptz not null, completed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.patient_signals (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, patient_id text not null references public.patients(id) on delete restrict,
  signal_type text not null check (signal_type in ('SIDE_EFFECT','MEDICATION_CONCERN','SAFEGUARDING_CONCERN','URGENT_QUERY','COMPLAINT','PRESCRIPTION_ISSUE')), priority text not null check (priority in ('LOW','MEDIUM','HIGH','URGENT')), status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED')), details text not null, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table if not exists public.portal_notifications (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, recipient_profile_id text not null references public.profiles(id) on delete cascade, event_type text not null, payload jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.patient_timeline_events (
  id text primary key, clinic_id text not null references public.clinics(id) on delete restrict, patient_id text not null references public.patients(id) on delete restrict, actor_profile_id text references public.profiles(id) on delete set null, event_type text not null, resource_type text not null, resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists prescription_cases_clinician_status_idx on public.prescription_cases(clinician_id, status, updated_at desc);
create index if not exists prescription_requirements_case_status_idx on public.prescription_requirements(prescription_case_id, status);
create index if not exists review_schedules_due_idx on public.review_schedules(clinic_id, due_at) where completed_at is null;
create index if not exists patient_signals_clinic_priority_idx on public.patient_signals(clinic_id, priority, created_at desc) where status <> 'RESOLVED';
create index if not exists notifications_recipient_idx on public.portal_notifications(recipient_profile_id, created_at desc);
create index if not exists timeline_patient_idx on public.patient_timeline_events(patient_id, created_at desc);
alter table public.patient_journeys enable row level security; alter table public.prescription_cases enable row level security; alter table public.prescription_requirements enable row level security; alter table public.review_schedules enable row level security; alter table public.patient_signals enable row level security; alter table public.portal_notifications enable row level security; alter table public.patient_timeline_events enable row level security;
create policy patient_journeys_clinic_isolation on public.patient_journeys for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy prescription_cases_clinic_isolation on public.prescription_cases for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy prescription_requirements_clinic_isolation on public.prescription_requirements for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy review_schedules_clinic_isolation on public.review_schedules for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy patient_signals_clinic_isolation on public.patient_signals for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy portal_notifications_clinic_isolation on public.portal_notifications for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy patient_timeline_events_clinic_isolation on public.patient_timeline_events for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
