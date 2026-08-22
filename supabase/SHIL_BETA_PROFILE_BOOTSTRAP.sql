-- SHIL Beta - safe profile bootstrap
-- Run BEFORE the existing V3 RLS migration if public.profiles does not already have
-- automatic Auth-user provisioning.
-- Idempotent: existing profile roles/statuses are not overwritten.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user',
  status text not null default 'pending',
  full_name text,
  phone text,
  company text,
  request_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists status text not null default 'pending';
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists request_note text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.shil_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,email,role,status,full_name,phone,company,request_note,created_at,updated_at)
  values(
    new.id,
    new.email,
    'user',
    'pending',
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'company',''),
    coalesce(new.raw_user_meta_data->>'request_note',''),
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    phone = case when excluded.phone <> '' then excluded.phone else public.profiles.phone end,
    company = case when excluded.company <> '' then excluded.company else public.profiles.company end,
    request_note = case when excluded.request_note <> '' then excluded.request_note else public.profiles.request_note end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists shil_on_auth_user_created on auth.users;
create trigger shil_on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.shil_handle_new_auth_user();

insert into public.profiles(id,email,role,status,full_name,created_at,updated_at)
select
  u.id,
  u.email,
  'user',
  'pending',
  coalesce(u.raw_user_meta_data->>'full_name',''),
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

commit;
