create table if not exists public.shil_projects (
  id text primary key,
  project_number text unique,
  title text not null default 'پروژه بدون عنوان',
  customer_name text,
  employer_name text,
  path text not null default 'solar',
  status text not null default 'draft' check (status in ('draft','running','completed','archived')),
  current_step text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shil_admin_config (
  key text primary key,
  category text not null default 'general',
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shil_admin_audit_log (
  id bigserial primary key,
  action text not null,
  entity text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shil_exports (
  id text primary key,
  project_id text references public.shil_projects(id) on delete set null,
  type text not null default 'json',
  title text,
  payload jsonb not null default '{}'::jsonb,
  file_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_shil_projects_status on public.shil_projects(status);
create index if not exists idx_shil_projects_updated_at on public.shil_projects(updated_at desc);
create index if not exists idx_shil_exports_project_id on public.shil_exports(project_id);

alter table public.shil_projects enable row level security;
alter table public.shil_admin_config enable row level security;
alter table public.shil_admin_audit_log enable row level security;
alter table public.shil_exports enable row level security;

-- Serverless endpoints use SUPABASE_SERVICE_ROLE_KEY. Public read/write policies are intentionally not created.
