-- SHIL Central Runtime App Data V1
-- Public read for app catalogs; admin-only writes.
create table if not exists public.shil_app_data (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.shil_app_data enable row level security;

drop policy if exists "shil_app_data_public_read" on public.shil_app_data;
create policy "shil_app_data_public_read" on public.shil_app_data
for select to anon, authenticated
using (key in ('consumer_equipment','equipment_catalog','admin_defaults','project_path_cards','ready_scenarios'));

drop policy if exists "shil_app_data_admin_insert" on public.shil_app_data;
create policy "shil_app_data_admin_insert" on public.shil_app_data
for insert to authenticated
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role = 'admin' and p.status='approved'));

drop policy if exists "shil_app_data_admin_update" on public.shil_app_data;
create policy "shil_app_data_admin_update" on public.shil_app_data
for update to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role = 'admin' and p.status='approved'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role = 'admin' and p.status='approved'));

drop policy if exists "shil_app_data_admin_delete" on public.shil_app_data;
create policy "shil_app_data_admin_delete" on public.shil_app_data
for delete to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role = 'admin' and p.status='approved'));

grant select on public.shil_app_data to anon, authenticated;
grant insert, update, delete on public.shil_app_data to authenticated;

