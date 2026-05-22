# SHIL Final Package Changelog

## Final backend/admin architecture update

- Production Supabase schema became the default `supabase/schema.sql`.
- Added secure RLS policies based on Supabase Auth.
- Added `shil_profiles`, `shil_admin_roles`, `shil_admin_audit_log`.
- Added `owner_auth_id` support to `shil_records` for row ownership.
- Added development-only schema as `supabase/schema.development.sql`.
- Added `src/services/shilSupabaseAuth.js` for future real email/password Supabase Auth integration.
- Updated cloud sync to distinguish production secure mode from development mode.
- Updated `.env.example` with final variables.
- Included the corrected independent login background image and inline Login background path.

## Important note

This ZIP does not include `node_modules`. Run `npm install --legacy-peer-deps` locally before `npm run build`.
