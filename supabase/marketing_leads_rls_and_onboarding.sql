-- Secure marketing_leads with tenant-isolated RLS, and add self-service
-- company onboarding (create workspace / join by invite code) without
-- requiring a service-role key on the client.
--
-- Run this in the Supabase SQL Editor (or via the CLI) against the
-- vyron-reach project. This cannot be applied automatically from the
-- app — it requires direct SQL execution against the database.

-- ============================================================
-- Priority 1: tenant-isolated RLS on marketing_leads
-- ============================================================

alter table public.marketing_leads enable row level security;

drop policy if exists "tenant members can read leads" on public.marketing_leads;
drop policy if exists "tenant members can insert leads" on public.marketing_leads;
drop policy if exists "tenant members can update leads" on public.marketing_leads;
drop policy if exists "tenant members can delete leads" on public.marketing_leads;

create policy "tenant members can read leads"
on public.marketing_leads
for select
using (
  company_id in (
    select company_id from public.vyron_reach_company_users where user_id = auth.uid()
  )
);

create policy "tenant members can insert leads"
on public.marketing_leads
for insert
with check (
  company_id in (
    select company_id from public.vyron_reach_company_users where user_id = auth.uid()
  )
);

create policy "tenant members can update leads"
on public.marketing_leads
for update
using (
  company_id in (
    select company_id from public.vyron_reach_company_users where user_id = auth.uid()
  )
)
with check (
  company_id in (
    select company_id from public.vyron_reach_company_users where user_id = auth.uid()
  )
);

create policy "tenant members can delete leads"
on public.marketing_leads
for delete
using (
  company_id in (
    select company_id from public.vyron_reach_company_users where user_id = auth.uid()
  )
);

-- IMPORTANT: any existing rows in marketing_leads that used the old
-- placeholder company_id ('00000000-0000-0000-0000-000000000000')
-- will become invisible to every real user once RLS is enabled,
-- because no real company_users row maps to that placeholder.
-- Reassign them to your real company_id before/after applying this,
-- e.g.:
--
-- update public.marketing_leads
-- set company_id = '<your real company id>'
-- where company_id = '00000000-0000-0000-0000-000000000000';

-- ============================================================
-- Priority 2: self-service onboarding (no service-role key needed)
-- ============================================================
-- These are SECURITY DEFINER functions: they run with the table
-- owner's privileges so they can insert into vyron_reach_companies /
-- vyron_reach_company_users (which otherwise only grant SELECT to
-- authenticated users), but each function only performs one narrow,
-- validated action for the calling user (auth.uid()) — this is not a
-- blanket RLS bypass like a service-role key would be.

alter table public.vyron_reach_companies
  add column if not exists invite_code text unique;

create or replace function public.vyron_reach_create_company(p_company_name text, p_contact_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);

  insert into public.vyron_reach_companies (company_name, contact_email, invite_code)
  values (p_company_name, p_contact_email, v_code)
  returning id into v_company_id;

  insert into public.vyron_reach_company_users (company_id, user_id, email, role)
  values (v_company_id, auth.uid(), p_contact_email, 'Owner');

  return v_company_id;
end;
$$;

grant execute on function public.vyron_reach_create_company(text, text) to authenticated;

create or replace function public.vyron_reach_join_company_by_code(p_invite_code text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_company_id
  from public.vyron_reach_companies
  where invite_code = p_invite_code;

  if v_company_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.vyron_reach_company_users (company_id, user_id, email, role)
  values (v_company_id, auth.uid(), p_email, 'Member')
  on conflict (company_id, user_id) do nothing;

  return v_company_id;
end;
$$;

grant execute on function public.vyron_reach_join_company_by_code(text, text) to authenticated;
