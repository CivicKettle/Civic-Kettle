-- CivicKettle database step 12: verified hours letters.
-- Safe to run more than once.

begin;

-- One row per letter. A volunteer asks for one, a coordinator approves it, and
-- the approved letter keeps its own copy of the hours so it never changes
-- afterwards. The code is what a school or employer types to check it.
create table if not exists public.hours_letters (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  code            text unique,
  volunteer_name  text not null check (char_length(volunteer_name) <= 80),
  volunteer_email text not null check (char_length(volunteer_email) <= 254),
  status          text not null default 'requested' check (status in ('requested', 'approved', 'declined', 'cancelled')),
  requested_at    timestamptz not null default now(),
  decided_at      timestamptz,
  decided_by      uuid references auth.users(id) on delete set null,
  signer_name     text check (signer_name is null or char_length(signer_name) <= 80),
  signer_title    text check (signer_title is null or char_length(signer_title) <= 80),
  total_hours     numeric(8,2),
  first_date      timestamptz,
  last_date       timestamptz,
  lines           jsonb not null default '[]'::jsonb
);
create index if not exists hours_letters_org_status on public.hours_letters (org_id, status, requested_at desc);
-- One open request per person at a time.
create unique index if not exists hours_letters_one_open
  on public.hours_letters (org_id, lower(volunteer_name), lower(volunteer_email)) where status = 'requested';

alter table public.hours_letters enable row level security;
drop policy if exists "members all letters" on public.hours_letters;
create policy "members all letters" on public.hours_letters for all
  using (public.is_member(org_id)) with check (public.is_member(org_id));

-- Volunteers and the public check page go through the site's server, never
-- straight to this table.
revoke all on public.hours_letters from anon;
revoke truncate on public.hours_letters from authenticated;

commit;

select 'Step 12 finished. Nothing else to do here.' as result;
