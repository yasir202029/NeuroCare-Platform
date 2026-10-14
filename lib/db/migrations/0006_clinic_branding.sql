alter table public.clinics add column if not exists segment text;
alter table public.clinics add column if not exists primary_color text;
alter table public.clinics add column if not exists accent_color text;
alter table public.clinics add constraint clinics_primary_color_hex check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.clinics add constraint clinics_accent_color_hex check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');
