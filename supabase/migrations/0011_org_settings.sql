-- CivicKettle database step 11: settings each organization can choose.
-- Safe to run more than once.

begin;

-- What an hour of volunteer time is worth on the impact report. Starts at
-- $41.75, Independent Sector's 2025 figure for California (released April 2026).
alter table public.organizations add column if not exists hour_value numeric(6,2) not null default 41.75;

-- Hours a volunteer needs for each level.
alter table public.organizations add column if not exists level_bronze integer not null default 10;
alter table public.organizations add column if not exists level_silver integer not null default 25;
alter table public.organizations add column if not exists level_gold   integer not null default 50;

-- Letterhead for verified hours letters.
alter table public.organizations add column if not exists letter_address text;
alter table public.organizations add column if not exists letter_phone   text;
alter table public.organizations add column if not exists signer_name    text;
alter table public.organizations add column if not exists signer_title   text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_hour_value_range') then
    alter table public.organizations add constraint organizations_hour_value_range check (hour_value >= 0 and hour_value <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'organizations_levels_in_order') then
    alter table public.organizations add constraint organizations_levels_in_order
      check (level_bronze >= 1 and level_bronze < level_silver and level_silver < level_gold and level_gold <= 10000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'organizations_letterhead_lengths') then
    alter table public.organizations add constraint organizations_letterhead_lengths check (
      (letter_address is null or char_length(letter_address) <= 200) and
      (letter_phone   is null or char_length(letter_phone)   <= 40) and
      (signer_name    is null or char_length(signer_name)    <= 80) and
      (signer_title   is null or char_length(signer_title)   <= 80));
  end if;
end $$;

-- Step 10 limited what a coordinator can change on their organization. These
-- new settings are added to that short list. The web address and created date
-- stay locked.
grant update (hour_value, level_bronze, level_silver, level_gold, letter_address, letter_phone, signer_name, signer_title)
  on public.organizations to authenticated;

commit;

select 'Step 11 finished. Nothing else to do here.' as result;
