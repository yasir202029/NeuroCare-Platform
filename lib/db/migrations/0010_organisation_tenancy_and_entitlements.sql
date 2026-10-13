-- SaaS tenancy foundation. Apply after migrations 0001-0009. Does not create tenants, users, billing records, or clinical data.
create table if not exists public.organisations (
  id text primary key, name text not null, slug text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','ARCHIVED')),
  plan text not null default 'STARTER' check (plan in ('STARTER','PROFESSIONAL','ENTERPRISE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.clinics add column if not exists organisation_id text references public.organisations(id) on delete restrict;
alter table public.clinics add column if not exists domain text unique;
alter table public.clinics add column if not exists font_family text;
alter table public.clinics add column if not exists welcome_text text;
create index if not exists clinics_organisation_idx on public.clinics(organisation_id);
create table if not exists public.departments (
  id text primary key, organisation_id text not null references public.organisations(id) on delete restrict,
  clinic_id text not null references public.clinics(id) on delete restrict, name text not null, slug text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(clinic_id, slug)
);
create table if not exists public.organisation_memberships (
  id text primary key, organisation_id text not null references public.organisations(id) on delete cascade,
  profile_id text not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','CLINICIAN','PATIENT','FINANCE','RECEPTIONIST','SUPPORT_AGENT')),
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organisation_id, profile_id)
);
create table if not exists public.organisation_entitlements (
  id text primary key, organisation_id text not null references public.organisations(id) on delete cascade,
  key text not null, value jsonb not null default '{}'::jsonb, enabled boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organisation_id,key)
);
create table if not exists public.organisation_subscriptions (
  id text primary key, organisation_id text not null references public.organisations(id) on delete cascade,
  provider text not null default 'STRIPE', provider_subscription_id text unique,
  plan text not null check (plan in ('STARTER','PROFESSIONAL','ENTERPRISE')),
  interval text not null check (interval in ('MONTHLY','ANNUAL','CONTRACT')),
  status text not null check (status in ('TRIALING','ACTIVE','PAST_DUE','CANCELLED','SUSPENDED')),
  current_period_end timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.organisation_api_clients (
  id text primary key, organisation_id text not null references public.organisations(id) on delete cascade,
  name text not null, key_digest text not null unique, scopes text[] not null default '{}', revoked_at timestamptz, last_used_at timestamptz, created_at timestamptz not null default now()
);
-- Resolve organisation membership via active clinic membership; platform role remains server-side only.
create or replace function public.has_organisation_membership(target_organisation_id text)
returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.organisation_memberships m where m.organisation_id=target_organisation_id and m.profile_id=auth.uid()::text and m.is_active);
$$;
alter table public.organisations enable row level security; alter table public.departments enable row level security; alter table public.organisation_memberships enable row level security; alter table public.organisation_entitlements enable row level security; alter table public.organisation_subscriptions enable row level security; alter table public.organisation_api_clients enable row level security;
create policy organisations_member_isolation on public.organisations for select using (public.has_organisation_membership(id));
create policy departments_organisation_isolation on public.departments for all using (public.has_organisation_membership(organisation_id)) with check (public.has_organisation_membership(organisation_id));
create policy organisation_memberships_isolation on public.organisation_memberships for select using (public.has_organisation_membership(organisation_id));
create policy organisation_entitlements_isolation on public.organisation_entitlements for select using (public.has_organisation_membership(organisation_id));
create policy organisation_subscriptions_isolation on public.organisation_subscriptions for select using (public.has_organisation_membership(organisation_id));
create policy organisation_api_clients_isolation on public.organisation_api_clients for select using (public.has_organisation_membership(organisation_id));
