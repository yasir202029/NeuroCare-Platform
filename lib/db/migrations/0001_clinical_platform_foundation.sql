-- Foundation only: no clinical data, users, or secrets are inserted by this migration.
create table if not exists public.clinics (
  id text primary key,
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_memberships (
  id text primary key,
  clinic_id text not null references public.clinics(id) on delete restrict,
  profile_id text not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','CLINICIAN','PATIENT','RECEPTIONIST','FINANCE','REFERRER','CORPORATE_CLIENT','SUPPORT_AGENT')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, profile_id)
);

alter table public.patients add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.clinicians add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.appointments add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.assessments add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.forms add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.reports add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.messages add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.documents add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.payments add column if not exists clinic_id text references public.clinics(id) on delete restrict;
alter table public.audit_logs add column if not exists clinic_id text references public.clinics(id) on delete restrict;

create index if not exists patients_clinic_id_idx on public.patients(clinic_id);
create index if not exists appointments_clinic_id_idx on public.appointments(clinic_id);
create index if not exists assessments_clinic_id_idx on public.assessments(clinic_id);
create index if not exists audit_logs_clinic_created_at_idx on public.audit_logs(clinic_id, created_at desc);

-- The authenticated user may access a clinic only through an active membership.
create or replace function public.has_clinic_membership(target_clinic_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clinic_memberships m
    where m.clinic_id = target_clinic_id and m.profile_id = auth.uid()::text and m.is_active
  );
$$;

alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.clinicians enable row level security;
alter table public.appointments enable row level security;
alter table public.assessments enable row level security;
alter table public.forms enable row level security;
alter table public.reports enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- Apply the same tenant boundary to every clinical table. Role-specific mutation
-- restrictions are enforced in the API and must be expanded before direct client writes.
do $$ declare t text; begin
  foreach t in array array['patients','clinicians','appointments','assessments','forms','reports','messages','documents','payments','audit_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_clinic_isolation', t);
    execute format('create policy %I on public.%I for all using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id))', t || '_clinic_isolation', t);
  end loop;
end $$;
