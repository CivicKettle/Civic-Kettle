-- CivicKettle · more than one coordinator per organization

-- Coordinators can see who else is on their team (before, each person saw only their own row).
drop policy if exists "members read team" on public.memberships;
create policy "members read team" on public.memberships for select using (public.is_member(org_id));

-- Invitations waiting to be accepted. A person joins the first time they sign in
-- with the invited email address. Written only by the server.
create table if not exists public.org_invites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  email      text not null,
  invited_by text,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);
alter table public.org_invites enable row level security;
drop policy if exists "members read invites" on public.org_invites;
create policy "members read invites" on public.org_invites for select using (public.is_member(org_id));
create index if not exists org_invites_email_idx on public.org_invites (email);
