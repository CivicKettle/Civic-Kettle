-- CivicKettle · record of every message sent, so nothing goes out twice
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  signup_id  uuid not null references public.signups(id) on delete cascade,
  kind       text not null check (kind in ('confirmation','day_before','morning_of','cancelled')),
  channel    text not null default 'email',
  to_address text not null,
  sent_at    timestamptz not null default now(),
  provider_id text,
  unique (signup_id, kind)
);
alter table public.messages enable row level security;
drop policy if exists "members read messages" on public.messages;
create policy "members read messages" on public.messages for select
  using (exists (select 1 from public.signups s join public.events e on e.id = s.event_id
                 where s.id = signup_id and public.is_member(e.org_id)));
