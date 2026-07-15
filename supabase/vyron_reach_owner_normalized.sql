-- Normalized Owner Marketing OS tables (per authenticated user)
-- Run in Supabase SQL Editor after vyron_reach_schema.sql

-- ─── Settings (one row per user) ───────────────────────────────────────────
create table if not exists public.vyron_reach_owner_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default 'VYRON',
  default_project text not null default 'VYRON CORE',
  default_market text not null default 'South Africa',
  default_ad_daily_budget numeric not null default 50,
  default_seo_timeline_months int not null default 6,
  contact_email text default '',
  business_type text default 'Workforce management / HR software',
  default_target_area text default 'South Africa',
  ai_marketing_rules text default '',
  updated_at timestamptz not null default now()
);

-- If table already exists, run:
-- alter table public.vyron_reach_owner_settings add column if not exists business_type text default 'Workforce management / HR software';
-- alter table public.vyron_reach_owner_settings add column if not exists default_target_area text default 'South Africa';
-- alter table public.vyron_reach_owner_settings add column if not exists ai_marketing_rules text default '';

-- ─── Clients ───────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_clients (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  industry text not null default '',
  website text not null default '',
  monthly_marketing_budget numeric not null default 0,
  target_area text not null default '',
  target_keywords jsonb not null default '[]'::jsonb,
  notes text not null default '',
  plan text not null default '',
  ad_spend_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_clients_user_idx on public.vyron_reach_owner_clients (user_id);

-- ─── SEO Keywords ──────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_keywords (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  volume int not null default 0,
  difficulty int not null default 0,
  intent text not null default 'Commercial',
  forecast text not null default '',
  gap text,
  recommended_page text,
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_keywords_user_idx on public.vyron_reach_owner_keywords (user_id);

-- ─── Rankings ────────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_rankings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  page text not null default '',
  position int not null default 0,
  change int not null default 0,
  forecast text not null default '',
  stuck boolean not null default false,
  previous_position int,
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_rankings_user_idx on public.vyron_reach_owner_rankings (user_id);

-- ─── Competitors ─────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_competitors (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text not null default '',
  weak_pages jsonb not null default '[]'::jsonb,
  keyword_gaps jsonb not null default '[]'::jsonb,
  threat text not null default 'Medium',
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_competitors_user_idx on public.vyron_reach_owner_competitors (user_id);

-- ─── Content tasks ───────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_content_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null default 'Blog',
  status text not null default 'Draft',
  target_keyword text not null default '',
  due_date text,
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_content_user_idx on public.vyron_reach_owner_content_tasks (user_id);

-- ─── Campaigns ─────────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_campaigns (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  daily_budget numeric not null default 50,
  monthly_budget numeric not null default 1500,
  status text not null default 'Testing',
  wasted_spend numeric not null default 0,
  intent_score int not null default 0,
  notes text not null default '',
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_campaigns_user_idx on public.vyron_reach_owner_campaigns (user_id);

-- ─── Action queue ──────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_action_queue (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  priority text not null default 'High',
  department text not null default '',
  due text not null default '',
  status text not null default 'pending',
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- alter table public.vyron_reach_owner_action_queue add column if not exists details jsonb not null default '{}';
create index if not exists vyron_owner_queue_user_idx on public.vyron_reach_owner_action_queue (user_id);

-- ─── Reports ───────────────────────────────────────────────────────────────────
create table if not exists public.vyron_reach_owner_reports (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null default '',
  period text not null default '',
  status text not null default 'Draft',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vyron_owner_reports_user_idx on public.vyron_reach_owner_reports (user_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────
alter table public.vyron_reach_owner_settings enable row level security;
alter table public.vyron_reach_owner_clients enable row level security;
alter table public.vyron_reach_owner_keywords enable row level security;
alter table public.vyron_reach_owner_rankings enable row level security;
alter table public.vyron_reach_owner_competitors enable row level security;
alter table public.vyron_reach_owner_content_tasks enable row level security;
alter table public.vyron_reach_owner_campaigns enable row level security;
alter table public.vyron_reach_owner_action_queue enable row level security;
alter table public.vyron_reach_owner_reports enable row level security;

-- Settings policies
drop policy if exists "owner settings select" on public.vyron_reach_owner_settings;
drop policy if exists "owner settings insert" on public.vyron_reach_owner_settings;
drop policy if exists "owner settings update" on public.vyron_reach_owner_settings;
create policy "owner settings select" on public.vyron_reach_owner_settings for select using (user_id = auth.uid());
create policy "owner settings insert" on public.vyron_reach_owner_settings for insert with check (user_id = auth.uid());
create policy "owner settings update" on public.vyron_reach_owner_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Generic policy helper macro via repeated blocks for child tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'vyron_reach_owner_clients',
    'vyron_reach_owner_keywords',
    'vyron_reach_owner_rankings',
    'vyron_reach_owner_competitors',
    'vyron_reach_owner_content_tasks',
    'vyron_reach_owner_campaigns',
    'vyron_reach_owner_action_queue',
    'vyron_reach_owner_reports'
  ]
  loop
    execute format('drop policy if exists "owner %s select" on public.%I', tbl, tbl);
    execute format('drop policy if exists "owner %s insert" on public.%I', tbl, tbl);
    execute format('drop policy if exists "owner %s update" on public.%I', tbl, tbl);
    execute format('drop policy if exists "owner %s delete" on public.%I', tbl, tbl);
    execute format('create policy "owner %s select" on public.%I for select using (user_id = auth.uid())', tbl, tbl);
    execute format('create policy "owner %s insert" on public.%I for insert with check (user_id = auth.uid())', tbl, tbl);
    execute format('create policy "owner %s update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', tbl, tbl);
    execute format('create policy "owner %s delete" on public.%I for delete using (user_id = auth.uid())', tbl, tbl);
  end loop;
end $$;
