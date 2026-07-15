-- VYRON REACH — marketing-creatives storage bucket
-- Run in Supabase SQL Editor after owner auth is configured.

insert into storage.buckets (id, name, public)
values ('marketing-creatives', 'marketing-creatives', true)
on conflict (id) do update set public = true;

drop policy if exists "marketing_creatives_insert" on storage.objects;
drop policy if exists "marketing_creatives_select" on storage.objects;
drop policy if exists "marketing_creatives_public_read" on storage.objects;

-- Authenticated users can upload to their own folder
create policy "marketing_creatives_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'marketing-creatives'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "marketing_creatives_select"
on storage.objects for select to authenticated
using (bucket_id = 'marketing-creatives');

create policy "marketing_creatives_public_read"
on storage.objects for select to anon
using (bucket_id = 'marketing-creatives');
