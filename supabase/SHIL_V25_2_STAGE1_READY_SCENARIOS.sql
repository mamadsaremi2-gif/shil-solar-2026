-- SHIL V25.2 Stage 1
-- Allow the published admin-ready scenario bank to be read by the app.
-- Admin write rules remain unchanged.

begin;

drop policy if exists "shil_app_data_public_read" on public.shil_app_data;
create policy "shil_app_data_public_read" on public.shil_app_data
for select to anon, authenticated
using (key in (
  'consumer_equipment',
  'equipment_catalog',
  'admin_defaults',
  'project_path_cards',
  'ready_scenarios'
));

commit;
