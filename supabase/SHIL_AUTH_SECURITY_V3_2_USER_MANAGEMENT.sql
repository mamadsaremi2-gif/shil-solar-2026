-- SHIL V3.2 User Management Center - additive production hardening
-- Apply AFTER SHIL_AUTH_SECURITY_V3_RLS.sql.
-- Review on staging first and keep a database backup.

begin;

create index if not exists shil_records_owner_auth_id_idx on public.shil_records(owner_auth_id);
create index if not exists shil_records_user_id_idx on public.shil_records(user_id);
create index if not exists shil_records_base_key_idx on public.shil_records(base_key);
create index if not exists shil_records_updated_at_idx on public.shil_records(updated_at desc);
create index if not exists shil_profiles_role_status_idx on public.profiles(role, status);

-- Server-side immutable audit for profile privilege/status changes.
-- This complements browser audit and cannot be skipped by a modified frontend.
create or replace function public.shil_audit_profile_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.role is distinct from new.role) or (old.status is distinct from new.status) then
    insert into public.shil_admin_audit_log(
      actor_user_id,
      actor_auth_id,
      action,
      entity,
      payload
    ) values (
      coalesce(auth.uid()::text, 'database'),
      auth.uid(),
      'user-profile:privilege-change',
      'profile',
      jsonb_build_object(
        'targetUserId', new.id,
        'email', new.email,
        'beforeRole', old.role,
        'afterRole', new.role,
        'beforeStatus', old.status,
        'afterStatus', new.status
      )
    );
  end if;
  return new;
end;
$$;

revoke all on function public.shil_audit_profile_admin_change() from public;

drop trigger if exists shil_profiles_admin_change_audit on public.profiles;
create trigger shil_profiles_admin_change_audit
after update of role, status on public.profiles
for each row
when ((old.role is distinct from new.role) or (old.status is distinct from new.status))
execute function public.shil_audit_profile_admin_change();

commit;
