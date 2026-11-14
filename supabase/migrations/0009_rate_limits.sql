-- CivicKettle database step 9: limits on repeated attempts.
-- Safe to run more than once.

-- One row per attempt on a public form (sign-up, sign-in). The key is a
-- scrambled fingerprint of the action plus the email or connection, so no
-- email address or IP address is stored here. Rows older than two days are
-- cleared by the daily reminder job.
create table if not exists public.rate_hits (
  id bigint generated always as identity primary key,
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_hits_key_at on public.rate_hits (key, at desc);

-- Locked to everyone except the server itself.
alter table public.rate_hits enable row level security;
