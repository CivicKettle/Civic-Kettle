-- CivicKettle · waiting lists for full shifts

-- A sign-up can now also be on a waiting list.
alter table public.signups drop constraint if exists signups_status_check;
alter table public.signups add constraint signups_status_check
  check (status in ('confirmed', 'cancelled', 'waitlist'));

-- Two new kinds of email: "you're on the waiting list" and "a spot opened, you're in".
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('confirmation', 'day_before', 'morning_of', 'cancelled', 'waitlist', 'promoted'));
