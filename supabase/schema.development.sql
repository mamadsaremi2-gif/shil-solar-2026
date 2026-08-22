-- SHIL development Supabase schema
-- Use only for local testing or a private staging project.
-- This schema allows anon read/write so the current local/PWA login can sync during development.

create extension if not exists pgcrypto;

create table if not exists public.shil_records (
  id uuid primary key default gen_random_uuid(),
  base_key text not null,
  record_id text not null,
  user_id text not null,
  user_role text default 'user',
  user_login text default '',
  status text default 'open',
  record jsonb not null default '{}'::jsonb,
  owner_auth_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(base_key, record_id)
);

create index if not exists shil_records_base_key_idx on public.shil_records(base_key);
create index if not exists shil_records_user_id_idx on public.shil_records(user_id);
create index if not exists shil_records_owner_auth_id_idx on public.shil_records(owner_auth_id);
create index if not exists shil_records_updated_at_idx on public.shil_records(updated_at desc);

create table if not exists public.shil_admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.shil_admin_audit_log (
  id bigserial primary key,
  actor_user_id text,
  actor_auth_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.shil_records enable row level security;
alter table public.shil_admin_settings enable row level security;
alter table public.shil_admin_audit_log enable row level security;

drop policy if exists shil_records_dev_all on public.shil_records;
create policy shil_records_dev_all on public.shil_records for all using (true) with check (true);

drop policy if exists shil_admin_settings_dev_all on public.shil_admin_settings;
create policy shil_admin_settings_dev_all on public.shil_admin_settings for all using (true) with check (true);

drop policy if exists shil_admin_audit_log_dev_all on public.shil_admin_audit_log;
create policy shil_admin_audit_log_dev_all on public.shil_admin_audit_log for all using (true) with check (true);
