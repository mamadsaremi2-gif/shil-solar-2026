-- SHIL V25.2 Stage 2 — Admin UX & Stability RLS repair
-- Adds explicit approved-admin permissions for runtime app data and operational records.
-- Safe to run more than once.

begin;

alter table if exists public.shil_app_data enable row level security;
alter table if exists public.shil_records enable row level security;

-- Runtime data: public app catalogs remain readable, approved admins can manage all keys.
drop policy if exists "shil_app_data_public_read" on public.shil_app_data;
create policy "shil_app_data_public_read"
on public.shil_app_data for select to anon, authenticated
using (key in (
  'consumer_equipment',
  'equipment_catalog',
  'admin_defaults',
  'project_path_cards',
  'ready_scenarios'
));

drop policy if exists "shil_app_data_admin_all_v252" on public.shil_app_data;
create policy "shil_app_data_admin_all_v252"
on public.shil_app_data for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
      and p.status::text = 'approved'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
      and p.status::text = 'approved'
  )
);

-- Operational project records: approved admins may inspect/update/delete all records.
-- This policy is intentionally additive to the existing owner policies.
drop policy if exists "shil_records_admin_all_v252" on public.shil_records;
create policy "shil_records_admin_all_v252"
on public.shil_records for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
      and p.status::text = 'approved'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
      and p.status::text = 'approved'
  )
);

grant select on public.shil_app_data to anon, authenticated;
grant insert, update, delete on public.shil_app_data to authenticated;
grant select, insert, update, delete on public.shil_records to authenticated;

commit;
