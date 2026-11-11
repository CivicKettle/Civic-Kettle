-- CivicKettle · hours approval, manual corrections, and post-event notes
alter table public.signups add column if not exists hours_override numeric(5,2) check (hours_override is null or (hours_override >= 0 and hours_override <= 24));
alter table public.signups add column if not exists hours_approved_at timestamptz;
alter table public.events  add column if not exists summary_notes text;
create index if not exists signups_checked_in_idx on public.signups (checked_in_at) where checked_in_at is not null;
