-- Migration 009: admin access only for listed admins.
--
-- Before this, every Supabase Auth user counted as "admin": the RLS
-- policies said `to authenticated using (true)`, and the admin login page
-- could create a new Auth user for any email typed in. Anyone could then
-- read patients, bookings, messages and session notes with the public
-- anon key. Now only users listed in admin_users pass, both in RLS
-- (is_admin()) and in the API routes (lib/requireAdmin.ts).
--
-- Run in Supabase → SQL Editor, in this order:
--   1. this whole file
--   2. the INSERT at the bottom, with her real admin login email
--   3. the SELECT at the bottom, to spot Auth users that shouldn't exist
-- Also: Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table admin_users enable row level security;
-- No policies on purpose: read only by the service role and by is_admin().

-- security definer: runs with the owner's rights, so it can read
-- admin_users even though that table has no policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Replace every "any logged-in user" policy with an admin check.
drop policy if exists "admin can read bookings" on bookings;
create policy "admin can read bookings" on bookings
  for select to authenticated using (public.is_admin());

drop policy if exists "admin can read patients" on patients;
create policy "admin can read patients" on patients
  for select to authenticated using (public.is_admin());

drop policy if exists "admin can manage session notes" on session_notes;
create policy "admin can manage session notes" on session_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin can manage messages" on messages;
create policy "admin can manage messages" on messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin can manage availability rules" on availability_rules;
create policy "admin can manage availability rules" on availability_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin can manage availability exceptions" on availability_exceptions;
create policy "admin can manage availability exceptions" on availability_exceptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin can manage psychologist profile" on psychologists;
create policy "admin can manage psychologist profile" on psychologists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Safety net: list any policy still open to every logged-in user.
-- Should print nothing; if it prints a row, that policy needs is_admin() too.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and 'authenticated' = any(roles)
      and (qual = 'true' or with_check = 'true')
  loop
    raise warning 'Policy still open to any logged-in user: %.%', p.tablename, p.policyname;
  end loop;
end $$;

-- ── Step 2: make her the admin (replace the email, then run) ──
-- insert into admin_users (user_id)
--   select id from auth.users where email = 'HER-ADMIN-LOGIN-EMAIL'
--   on conflict do nothing;

-- ── Step 3: who has an Auth account? Only she should. ──
-- select id, email, created_at, last_sign_in_at from auth.users order by created_at;
-- Delete any stranger in Authentication → Users.
