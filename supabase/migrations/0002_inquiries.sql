-- CivicKettle · inquiries from the landing page form
create table if not exists public.inquiries (
  id              uuid primary key default gen_random_uuid(),
  organization    text not null,
  name            text not null,
  email           text not null,
  org_type        text,
  volunteers      text,
  current_process text,
  biggest_pain    text,
  source          text not null default 'website',
  status          text not null default 'new' check (status in ('new','replied','onboarded','closed')),
  created_at      timestamptz not null default now()
);
alter table public.inquiries enable row level security;
-- Written by the server with the secret key; readable by any signed-in coordinator of the
-- CivicKettle team itself. For now that is the founder's account; a later migration can scope it.
drop policy if exists "coordinators read inquiries" on public.inquiries;
create policy "coordinators read inquiries" on public.inquiries for select to authenticated using (true);
drop policy if exists "coordinators update inquiries" on public.inquiries;
create policy "coordinators update inquiries" on public.inquiries for update to authenticated using (true);
