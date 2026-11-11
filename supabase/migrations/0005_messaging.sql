-- CivicKettle · email opt-outs and coordinator messages to volunteers

-- People who asked an organization to stop reminder emails and coordinator messages.
create table if not exists public.email_optouts (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  primary key (org_id, email)
);
alter table public.email_optouts enable row level security;
drop policy if exists "members read optouts" on public.email_optouts;
create policy "members read optouts" on public.email_optouts for select using (public.is_member(org_id));

-- A record of every message a coordinator sent to an event's volunteers.
create table if not exists public.broadcasts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  shift_id        uuid references public.shifts(id) on delete set null,
  subject         text not null,
  body            text not null,
  recipient_count integer not null default 0,
  skipped_count   integer not null default 0,
  sent_by         text,
  created_at      timestamptz not null default now()
);
alter table public.broadcasts enable row level security;
drop policy if exists "members read broadcasts" on public.broadcasts;
create policy "members read broadcasts" on public.broadcasts for select using (public.is_member(org_id));
create index if not exists broadcasts_event_idx on public.broadcasts (event_id, created_at desc);
create index if not exists broadcasts_org_day_idx on public.broadcasts (org_id, created_at desc);

-- Landing-page inquiries are for the CivicKettle team only. Until now any signed-in
-- coordinator could read them. This table names the team's own workspace; it has no
-- policies, so only the server's secret key and this SQL editor can change it.
create table if not exists public.platform_orgs (
  org_id uuid primary key references public.organizations(id) on delete cascade
);
alter table public.platform_orgs enable row level security;
insert into public.platform_orgs (org_id)
  select id from public.organizations order by created_at asc limit 1
  on conflict do nothing;

create or replace function public.is_platform_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    join public.platform_orgs p on p.org_id = m.org_id
    where m.user_id = auth.uid()
  );
$$;

drop policy if exists "coordinators read inquiries" on public.inquiries;
create policy "coordinators read inquiries" on public.inquiries for select to authenticated using (public.is_platform_member());
drop policy if exists "coordinators update inquiries" on public.inquiries;
create policy "coordinators update inquiries" on public.inquiries for update to authenticated using (public.is_platform_member());
