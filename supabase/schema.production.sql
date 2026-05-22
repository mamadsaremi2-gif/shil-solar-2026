-- SHIL production Supabase schema
-- Secure RLS version for the final online architecture.
-- Run in Supabase SQL Editor after enabling Supabase Auth.

create extension if not exists pgcrypto;

create or replace function public.shil_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.shil_profiles (
  auth_id uuid primary key references auth.users(id) on delete cascade,
  app_user_id text unique,
  display_name text,
  role text not null default 'user' check (role in ('user','guest','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shil_profiles_updated_at on public.shil_profiles;
create trigger shil_profiles_updated_at
before update on public.shil_profiles
for each row execute function public.shil_set_updated_at();

create table if not exists public.shil_admin_roles (
  auth_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.shil_is_admin(check_auth_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shil_admin_roles
    where auth_id = check_auth_id and enabled = true
  );
$$;

create table if not exists public.shil_records (
  id uuid primary key default gen_random_uuid(),
  base_key text not null,
  record_id text not null,
  user_id text not null,
  user_role text default 'user',
  user_login text default '',
  status text default 'open',
  record jsonb not null default '{}'::jsonb,
  owner_auth_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(base_key, record_id)
);

create index if not exists shil_records_base_key_idx on public.shil_records(base_key);
create index if not exists shil_records_user_id_idx on public.shil_records(user_id);
create index if not exists shil_records_owner_auth_id_idx on public.shil_records(owner_auth_id);
create index if not exists shil_records_updated_at_idx on public.shil_records(updated_at desc);

drop trigger if exists shil_records_updated_at on public.shil_records;
create trigger shil_records_updated_at
before update on public.shil_records
for each row execute function public.shil_set_updated_at();

create table if not exists public.shil_admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists shil_admin_settings_updated_at on public.shil_admin_settings;
create trigger shil_admin_settings_updated_at
before update on public.shil_admin_settings
for each row execute function public.shil_set_updated_at();

create table if not exists public.shil_admin_audit_log (
  id bigserial primary key,
  actor_user_id text,
  actor_auth_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shil_profiles enable row level security;
alter table public.shil_admin_roles enable row level security;
alter table public.shil_records enable row level security;
alter table public.shil_admin_settings enable row level security;
alter table public.shil_admin_audit_log enable row level security;

-- Profiles: users can read/write their own profile; admins can read all.
drop policy if exists shil_profiles_select_own_or_admin on public.shil_profiles;
create policy shil_profiles_select_own_or_admin
on public.shil_profiles for select
using (auth.uid() = auth_id or public.shil_is_admin());

drop policy if exists shil_profiles_insert_own on public.shil_profiles;
create policy shil_profiles_insert_own
on public.shil_profiles for insert
with check (auth.uid() = auth_id);

drop policy if exists shil_profiles_update_own_or_admin on public.shil_profiles;
create policy shil_profiles_update_own_or_admin
on public.shil_profiles for update
using (auth.uid() = auth_id or public.shil_is_admin())
with check (auth.uid() = auth_id or public.shil_is_admin());

-- Admin roles: visible/editable only to existing admins.
drop policy if exists shil_admin_roles_admin_all on public.shil_admin_roles;
create policy shil_admin_roles_admin_all
on public.shil_admin_roles for all
using (public.shil_is_admin())
with check (public.shil_is_admin());

-- Records: users own their rows; admins can see/manage all rows.
drop policy if exists shil_records_select_own_or_admin on public.shil_records;
create policy shil_records_select_own_or_admin
on public.shil_records for select
using (owner_auth_id = auth.uid() or public.shil_is_admin());

drop policy if exists shil_records_insert_own_or_admin on public.shil_records;
create policy shil_records_insert_own_or_admin
on public.shil_records for insert
with check (owner_auth_id = auth.uid() or public.shil_is_admin());

drop policy if exists shil_records_update_own_or_admin on public.shil_records;
create policy shil_records_update_own_or_admin
on public.shil_records for update
using (owner_auth_id = auth.uid() or public.shil_is_admin())
with check (owner_auth_id = auth.uid() or public.shil_is_admin());

drop policy if exists shil_records_delete_own_or_admin on public.shil_records;
create policy shil_records_delete_own_or_admin
on public.shil_records for delete
using (owner_auth_id = auth.uid() or public.shil_is_admin());

-- Settings and audit are admin-only.
drop policy if exists shil_admin_settings_admin_all on public.shil_admin_settings;
create policy shil_admin_settings_admin_all
on public.shil_admin_settings for all
using (public.shil_is_admin())
with check (public.shil_is_admin());

drop policy if exists shil_admin_audit_log_admin_select on public.shil_admin_audit_log;
create policy shil_admin_audit_log_admin_select
on public.shil_admin_audit_log for select
using (public.shil_is_admin());

drop policy if exists shil_admin_audit_log_insert_own_or_admin on public.shil_admin_audit_log;
create policy shil_admin_audit_log_insert_own_or_admin
on public.shil_admin_audit_log for insert
with check (actor_auth_id = auth.uid() or public.shil_is_admin());

-- After creating your first admin user in Supabase Auth, run this with that user's UUID:
-- insert into public.shil_admin_roles(auth_id, note) values ('00000000-0000-0000-0000-000000000000', 'first SHIL admin') on conflict (auth_id) do update set enabled = true;
