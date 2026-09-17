-- Consent is immutable history: withdrawal creates a new record; no patient data is seeded.
create table if not exists public.patient_consents (
  id text primary key,
  clinic_id text not null references public.clinics(id) on delete restrict,
  patient_id text not null references public.patients(id) on delete restrict,
  purpose text not null check (purpose in ('CONSULTATION_RECORDING','AI_CLINICAL_ASSISTANCE')),
  decision text not null check (decision in ('GRANTED','DECLINED','WITHDRAWN')),
  policy_version text not null,
  decided_at timestamptz not null default now(),
  recorded_by_profile_id text references public.profiles(id) on delete set null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists patient_consents_patient_purpose_decided_idx on public.patient_consents(patient_id, purpose, decided_at desc);
alter table public.patient_consents enable row level security;
create policy patient_consents_clinic_isolation on public.patient_consents for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));

create table if not exists public.care_requests (
  id text primary key,
  clinic_id text not null references public.clinics(id) on delete restrict,
  patient_id text not null references public.patients(id) on delete restrict,
  request_type text not null check (request_type in ('MEDICATION_REFILL','FOLLOW_UP','MEDICATION_REVIEW')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','COMPLETED','CANCELLED')),
  details text not null,
  requested_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  reviewed_by_profile_id text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists care_requests_clinic_status_idx on public.care_requests(clinic_id, status, requested_at desc);
alter table public.care_requests enable row level security;
create policy care_requests_clinic_isolation on public.care_requests for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
