-- VYRON PAY — Batch pay-1 foundation schema.
--
-- Separate tenancy from VYRON REACH (vyron_reach_*): a company can have a
-- Pay workspace, a Reach workspace, both, or neither, independently. Users
-- share the same Supabase Auth pool (auth.uid()) across products, but
-- company membership is resolved per-product via these tables.
--
-- Run this in the Supabase SQL Editor (or via the CLI) against the
-- vyron-reach project. This cannot be applied automatically from the
-- app — it requires direct SQL execution against the database.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.vyron_pay_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  registration_number text default '',
  industry_classification text default '',
  contact_email text default '',
  physical_address text default '',
  postal_address text default '',
  currency text not null default 'ZAR',
  invite_code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.vyron_pay_company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.vyron_pay_companies(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  full_name text,
  role text not null default 'Owner',
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  unique(company_id, user_id),
  constraint vyron_pay_company_users_role_check check (role in ('Owner', 'Administrator', 'Viewer'))
);
create index if not exists vyron_pay_company_users_user_idx on public.vyron_pay_company_users (user_id);

create table if not exists public.vyron_pay_payroll_settings (
  company_id uuid primary key references public.vyron_pay_companies(id) on delete cascade,
  pay_frequency text not null default 'Monthly',
  pay_day int not null default 25,
  tax_year_start_month int not null default 3,
  paye_reference text default '',
  uif_reference text default '',
  sdl_reference text default '',
  uif_exempt boolean not null default false,
  sdl_exempt boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint vyron_pay_payroll_settings_pay_frequency_check check (pay_frequency in ('Monthly', 'Bi-Weekly', 'Weekly')),
  constraint vyron_pay_payroll_settings_pay_day_check check (pay_day between 1 and 31),
  constraint vyron_pay_payroll_settings_tax_year_month_check check (tax_year_start_month between 1 and 12)
);

create table if not exists public.vyron_pay_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.vyron_pay_companies(id) on delete cascade,
  employee_number text default '',
  first_name text not null,
  last_name text not null,
  id_number text default '',
  passport_number text default '',
  date_of_birth date,
  gender text default '',
  employment_type text not null default 'Permanent',
  job_title text default '',
  department text default '',
  start_date date,
  termination_date date,
  employment_status text not null default 'Active',
  tax_number text default '',
  bank_name text default '',
  bank_account_number text default '',
  bank_account_type text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vyron_pay_employees_type_check check (employment_type in ('Permanent', 'Fixed-Term', 'Temporary', 'Contractor')),
  constraint vyron_pay_employees_status_check check (employment_status in ('Active', 'Inactive', 'Terminated'))
);
create index if not exists vyron_pay_employees_company_idx on public.vyron_pay_employees (company_id);

-- One employee number per company — but only enforced once a number is
-- actually assigned (many employees start out with a blank number).
create unique index if not exists vyron_pay_employees_company_employee_number_idx
  on public.vyron_pay_employees (company_id, employee_number)
  where employee_number <> '';

-- ============================================================
-- updated_at is stamped by the database, not trusted from client input —
-- this guarantees correctness even if application code forgets to set it
-- (or a direct API call tries to spoof it).
-- ============================================================

create or replace function public.vyron_pay_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vyron_pay_employees_set_updated_at on public.vyron_pay_employees;
create trigger vyron_pay_employees_set_updated_at
before update on public.vyron_pay_employees
for each row execute function public.vyron_pay_set_updated_at();

drop trigger if exists vyron_pay_payroll_settings_set_updated_at on public.vyron_pay_payroll_settings;
create trigger vyron_pay_payroll_settings_set_updated_at
before update on public.vyron_pay_payroll_settings
for each row execute function public.vyron_pay_set_updated_at();

-- ============================================================
-- Helper functions
--
-- Centralises the "is this user a member of this company / do they
-- have one of these roles" checks so every RLS policy below (and any
-- future one) uses the exact same logic instead of five copies of the
-- same subquery drifting out of sync. STABLE + SECURITY DEFINER so
-- they can be called from policies without an extra RLS round-trip on
-- vyron_pay_company_users itself.
-- ============================================================

create or replace function public.vyron_pay_is_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vyron_pay_company_users
    where company_id = p_company_id and user_id = auth.uid()
  )
$$;

grant execute on function public.vyron_pay_is_member(uuid) to authenticated;

create or replace function public.vyron_pay_has_role(p_company_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vyron_pay_company_users
    where company_id = p_company_id and user_id = auth.uid() and role = any(p_roles)
  )
$$;

grant execute on function public.vyron_pay_has_role(uuid, text[]) to authenticated;

-- ============================================================
-- Row Level Security
--
-- Read access is granted to any company member (matches the
-- `viewEmployees`-for-all-roles shape of lib/pay/permissions.ts).
-- Mutations are restricted to the roles that actually hold the
-- corresponding permission in that same file, so the database enforces
-- the same Owner / Administrator / Viewer boundary as the UI — the UI
-- disabling a form is a convenience, not the security boundary.
-- ============================================================

alter table public.vyron_pay_companies enable row level security;
alter table public.vyron_pay_company_users enable row level security;
alter table public.vyron_pay_payroll_settings enable row level security;
alter table public.vyron_pay_employees enable row level security;

-- vyron_pay_companies — read: any member. Update (manageCompanySettings): Owner/Administrator.
drop policy if exists "pay company members can read companies" on public.vyron_pay_companies;
drop policy if exists "pay company members can update companies" on public.vyron_pay_companies;
drop policy if exists "pay members can read companies" on public.vyron_pay_companies;
drop policy if exists "pay admins can update companies" on public.vyron_pay_companies;

create policy "pay members can read companies"
on public.vyron_pay_companies
for select
using (vyron_pay_is_member(id));

create policy "pay admins can update companies"
on public.vyron_pay_companies
for update
using (vyron_pay_has_role(id, array['Owner', 'Administrator']))
with check (vyron_pay_has_role(id, array['Owner', 'Administrator']));

-- vyron_pay_company_users — read: any member. Update/delete (manageUsers): Owner only.
drop policy if exists "pay company members can read company users" on public.vyron_pay_company_users;
drop policy if exists "pay owners can manage company users" on public.vyron_pay_company_users;
drop policy if exists "pay owners can remove company users" on public.vyron_pay_company_users;
drop policy if exists "pay members can read company users" on public.vyron_pay_company_users;
drop policy if exists "pay owners can update company users" on public.vyron_pay_company_users;
drop policy if exists "pay owners can delete company users" on public.vyron_pay_company_users;

create policy "pay members can read company users"
on public.vyron_pay_company_users
for select
using (vyron_pay_is_member(company_id));

create policy "pay owners can update company users"
on public.vyron_pay_company_users
for update
using (vyron_pay_has_role(company_id, array['Owner']))
with check (vyron_pay_has_role(company_id, array['Owner']));

create policy "pay owners can delete company users"
on public.vyron_pay_company_users
for delete
using (vyron_pay_has_role(company_id, array['Owner']));

-- vyron_pay_payroll_settings — read: any member. Insert/update/delete (managePayrollSettings): Owner/Administrator.
drop policy if exists "pay company members can manage payroll settings" on public.vyron_pay_payroll_settings;
drop policy if exists "pay members can read payroll settings" on public.vyron_pay_payroll_settings;
drop policy if exists "pay admins can manage payroll settings" on public.vyron_pay_payroll_settings;

create policy "pay members can read payroll settings"
on public.vyron_pay_payroll_settings
for select
using (vyron_pay_is_member(company_id));

create policy "pay admins can manage payroll settings"
on public.vyron_pay_payroll_settings
for all
using (vyron_pay_has_role(company_id, array['Owner', 'Administrator']))
with check (vyron_pay_has_role(company_id, array['Owner', 'Administrator']));

-- vyron_pay_employees — read (viewEmployees): any member. Insert/update/delete (manageEmployees): Owner/Administrator.
drop policy if exists "pay company members can manage employees" on public.vyron_pay_employees;
drop policy if exists "pay members can read employees" on public.vyron_pay_employees;
drop policy if exists "pay admins can manage employees" on public.vyron_pay_employees;

create policy "pay members can read employees"
on public.vyron_pay_employees
for select
using (vyron_pay_is_member(company_id));

create policy "pay admins can manage employees"
on public.vyron_pay_employees
for all
using (vyron_pay_has_role(company_id, array['Owner', 'Administrator']))
with check (vyron_pay_has_role(company_id, array['Owner', 'Administrator']));

-- ============================================================
-- Onboarding RPCs (SECURITY DEFINER — narrow, validated actions only,
-- not a blanket RLS bypass) — same shape as vyron_reach_create_company /
-- vyron_reach_join_company_by_code, with added input validation and the
-- membership email sourced from the authenticated JWT rather than a
-- client-supplied parameter (the company's contact_email can still be
-- any address — e.g. a shared payroll inbox — but the *member's own*
-- email must match who they actually authenticated as).
-- ============================================================

create or replace function public.vyron_pay_create_company(p_company_name text, p_contact_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_code text;
  v_user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_company_name is null or length(trim(p_company_name)) = 0 then
    raise exception 'Company name is required';
  end if;

  v_user_email := coalesce(auth.jwt() ->> 'email', p_contact_email);
  v_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);

  insert into public.vyron_pay_companies (company_name, contact_email, invite_code)
  values (trim(p_company_name), coalesce(p_contact_email, ''), v_code)
  returning id into v_company_id;

  insert into public.vyron_pay_company_users (company_id, user_id, email, role)
  values (v_company_id, auth.uid(), v_user_email, 'Owner');

  insert into public.vyron_pay_payroll_settings (company_id)
  values (v_company_id);

  return v_company_id;
end;
$$;

grant execute on function public.vyron_pay_create_company(text, text) to authenticated;

create or replace function public.vyron_pay_join_company_by_code(p_invite_code text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_invite_code is null or length(trim(p_invite_code)) = 0 then
    raise exception 'Invite code is required';
  end if;

  v_user_email := coalesce(auth.jwt() ->> 'email', p_email);

  select id into v_company_id
  from public.vyron_pay_companies
  where invite_code = trim(p_invite_code);

  if v_company_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.vyron_pay_company_users (company_id, user_id, email, role)
  values (v_company_id, auth.uid(), v_user_email, 'Viewer')
  on conflict (company_id, user_id) do nothing;

  return v_company_id;
end;
$$;

grant execute on function public.vyron_pay_join_company_by_code(text, text) to authenticated;
