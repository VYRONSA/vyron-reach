create table if not exists public.vyron_reach_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  industry text default 'Marketing / Growth',
  contact_email text,
  currency text default 'ZAR',
  roi_target numeric default 4,
  created_at timestamptz default now()
);

create table if not exists public.vyron_reach_company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.vyron_reach_companies(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  full_name text,
  role text default 'Owner',
  status text default 'Active',
  created_at timestamptz default now(),
  unique(company_id, user_id)
);

create table if not exists public.vyron_reach_app_data (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.vyron_reach_companies(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz default now(),
  unique(company_id)
);

alter table public.vyron_reach_companies enable row level security;
alter table public.vyron_reach_company_users enable row level security;
alter table public.vyron_reach_app_data enable row level security;

drop policy if exists "company users can read companies" on public.vyron_reach_companies;
drop policy if exists "company users can read company users" on public.vyron_reach_company_users;
drop policy if exists "company users can manage app data" on public.vyron_reach_app_data;

create policy "company users can read companies"
on public.vyron_reach_companies
for select
using (
  id in (
    select company_id
    from public.vyron_reach_company_users
    where user_id = auth.uid()
  )
);

create policy "company users can read company users"
on public.vyron_reach_company_users
for select
using (user_id = auth.uid());

create policy "company users can manage app data"
on public.vyron_reach_app_data
for all
using (
  company_id in (
    select company_id
    from public.vyron_reach_company_users
    where user_id = auth.uid()
  )
)
with check (
  company_id in (
    select company_id
    from public.vyron_reach_company_users
    where user_id = auth.uid()
  )
);