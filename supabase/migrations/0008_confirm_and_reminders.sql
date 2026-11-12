-- CivicKettle database step 8: day-before confirmation and reminder choices.
-- Safe to run more than once.

-- When a volunteer taps "Yes, I'll be there" in the day-before email.
alter table public.signups add column if not exists attending_confirmed_at timestamptz;

-- Which automatic reminders an event sends. Both are on unless a coordinator turns one off.
alter table public.events add column if not exists remind_day_before boolean not null default true;
alter table public.events add column if not exists remind_morning_of boolean not null default true;
