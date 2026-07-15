-- Owner Marketing OS store (JSON blob per authenticated user)
-- Run in Supabase SQL Editor after vyron_reach_schema.sql

create table if not exists public.vyron_reach_owner_store (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists vyron_reach_owner_store_user_id_idx
  on public.vyron_reach_owner_store (user_id);

alter table public.vyron_reach_owner_store enable row level security;

drop policy if exists "owner store select own" on public.vyron_reach_owner_store;
drop policy if exists "owner store insert own" on public.vyron_reach_owner_store;
drop policy if exists "owner store update own" on public.vyron_reach_owner_store;
drop policy if exists "owner store delete own" on public.vyron_reach_owner_store;

create policy "owner store select own"
on public.vyron_reach_owner_store
for select
using (user_id = auth.uid());

create policy "owner store insert own"
on public.vyron_reach_owner_store
for insert
with check (user_id = auth.uid());

create policy "owner store update own"
on public.vyron_reach_owner_store
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "owner store delete own"
on public.vyron_reach_owner_store
for delete
using (user_id = auth.uid());
