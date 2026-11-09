-- CivicKettle · initial schema
-- Run once in the Supabase SQL editor. Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

-- ---------- Organizations and who belongs to them ----------
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  time_zone     text not null default 'America/Los_Angeles',
  contact_email text,
  created_at    timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'coordinator',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- ---------- Events, shifts, sign-ups ----------
create table if not exists public.events (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  title                text not null,
  description          text,
  location             text,
  notes_for_volunteers text,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  status               text not null default 'published' check (status in ('draft','published','cancelled')),
  public_token         text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at           timestamptz not null default now()
);
create index if not exists events_org_starts_idx on public.events (org_id, starts_at);

create table if not exists public.shifts (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  capacity   integer not null default 10 check (capacity between 1 and 500),
  sort_order integer not null default 0
);
create index if not exists shifts_event_idx on public.shifts (event_id, sort_order);

create table if not exists public.signups (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  shift_id       uuid not null references public.shifts(id) on delete cascade,
  volunteer_name text not null,
  phone          text,
  email          text,
  is_minor       boolean not null default false,
  guardian_name  text,
  guardian_phone text,
  status         text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  cancel_token   text not null unique default encode(gen_random_bytes(16), 'hex'),
  checked_in_at  timestamptz,
  checked_out_at timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists signups_shift_idx on public.signups (shift_id, status);
create index if not exists signups_event_idx on public.signups (event_id, status);

-- ---------- Row Level Security ----------
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.events        enable row level security;
alter table public.shifts        enable row level security;
alter table public.signups       enable row level security;

-- Helper: is the signed-in user a member of this org?
create or replace function public.is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = auth.uid());
$$;

drop policy if exists "members read org" on public.organizations;
create policy "members read org" on public.organizations for select using (public.is_member(id));
drop policy if exists "members update org" on public.organizations;
create policy "members update org" on public.organizations for update using (public.is_member(id));

drop policy if exists "own memberships" on public.memberships;
create policy "own memberships" on public.memberships for select using (user_id = auth.uid());

drop policy if exists "members all events" on public.events;
create policy "members all events" on public.events for all using (public.is_member(org_id)) with check (public.is_member(org_id));

drop policy if exists "members all shifts" on public.shifts;
create policy "members all shifts" on public.shifts for all
  using (exists (select 1 from public.events e where e.id = event_id and public.is_member(e.org_id)))
  with check (exists (select 1 from public.events e where e.id = event_id and public.is_member(e.org_id)));

drop policy if exists "members all signups" on public.signups;
create policy "members all signups" on public.signups for all
  using (exists (select 1 from public.events e where e.id = event_id and public.is_member(e.org_id)))
  with check (exists (select 1 from public.events e where e.id = event_id and public.is_member(e.org_id)));

-- Public volunteers never touch these tables directly: the app's server uses the
-- secret key for the sign-up page, so no anon policies are needed.

-- ---------- Create an organization and make the caller its first coordinator ----------
create or replace function public.create_organization(p_name text, p_slug text, p_time_zone text default 'America/Los_Angeles')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  insert into public.organizations (name, slug, time_zone, contact_email)
  values (p_name, p_slug, p_time_zone, (select email from auth.users where id = auth.uid()))
  returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  return v_org;
end;
$$;
grant execute on function public.create_organization(text, text, text) to authenticated;
