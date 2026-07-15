-- Reassigns legacy marketing_leads rows that still reference the old
-- placeholder company_id to the real workspace company_id.
--
-- Do NOT run this until a real company exists (i.e. someone has
-- completed onboarding via /onboarding or the "Create Workspace" flow).
-- Run in the Supabase SQL Editor manually — not applied automatically.

-- Option A: resolve the target company by the workspace owner's email.
-- Adjust the email if the workspace was created/joined by a different
-- account than precisionaccounting@gmail.com.
update public.marketing_leads
set company_id = (
  select cu.company_id
  from public.vyron_reach_company_users cu
  join auth.users u on u.id = cu.user_id
  where u.email = 'precisionaccounting@gmail.com'
  order by cu.created_at asc
  limit 1
)
where company_id = '00000000-0000-0000-0000-000000000000'
  and exists (
    select 1
    from public.vyron_reach_company_users cu
    join auth.users u on u.id = cu.user_id
    where u.email = 'precisionaccounting@gmail.com'
  );

-- Option B: if you'd rather paste the company_id directly (e.g. from
-- the Settings page once it's visible there), use this instead:
--
-- update public.marketing_leads
-- set company_id = '<your real company id>'
-- where company_id = '00000000-0000-0000-0000-000000000000';

-- Verify afterward:
-- select id, contact_name, company_id from public.marketing_leads
-- where company_id <> '00000000-0000-0000-0000-000000000000';
