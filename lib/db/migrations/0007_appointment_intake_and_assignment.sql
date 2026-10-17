alter table public.appointments add column if not exists intake jsonb;
alter table public.appointments add column if not exists assigned_at timestamptz;
alter table public.appointments add column if not exists assigned_by_profile_id text references public.profiles(id) on delete set null;
create index if not exists appointments_clinician_scheduled_idx on public.appointments(clinician_id, scheduled_date);
-- Intake must only be read through the assigned clinician or an authorised clinic role; enforce this in the repository alongside RLS.
