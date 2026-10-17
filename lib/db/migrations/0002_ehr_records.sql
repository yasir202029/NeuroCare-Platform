-- EHR records are created empty. This migration never seeds patient or clinical data.
create table if not exists public.clinical_notes (
  clinic_id text not null references public.clinics(id) on delete restrict,
  id text primary key,
  patient_id text not null references public.patients(id) on delete restrict,
  author_profile_id text not null references public.profiles(id) on delete restrict,
  note_type text not null check (note_type in ('assessment','progress','medication_review','risk_review')),
  body text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.diagnoses (
  clinic_id text not null references public.clinics(id) on delete restrict,
  id text primary key,
  patient_id text not null references public.patients(id) on delete restrict,
  clinician_id text not null references public.clinicians(id) on delete restrict,
  code_system text not null,
  code text not null,
  description text not null,
  status text not null default 'active' check (status in ('active','resolved','provisional')),
  diagnosed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clinical_notes_patient_occurred_idx on public.clinical_notes(patient_id, occurred_at desc);
create index if not exists diagnoses_patient_status_idx on public.diagnoses(patient_id, status);
alter table public.clinical_notes enable row level security;
alter table public.diagnoses enable row level security;
create policy clinical_notes_clinic_isolation on public.clinical_notes for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy diagnoses_clinic_isolation on public.diagnoses for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
