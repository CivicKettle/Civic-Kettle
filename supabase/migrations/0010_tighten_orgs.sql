-- CivicKettle database step 10: tighten what a signed-in coordinator can change directly.
-- Safe to run more than once.

begin;

-- ---------- 1. The organization row ----------
-- A coordinator may change their organization's name, time zone and contact
-- email, and nothing else. Before this, a signed-in member could also rewrite
-- the web address (slug) or the created date, which restarts the free trial
-- and decides which workspace counts as CivicKettle's own.
revoke insert, update, delete, truncate on public.organizations from anon, authenticated;
grant update (name, time_zone, contact_email) on public.organizations to authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_name_length') then
    alter table public.organizations
      add constraint organizations_name_length check (char_length(btrim(name)) between 2 and 80) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'organizations_contact_email_length') then
    alter table public.organizations
      add constraint organizations_contact_email_length check (contact_email is null or char_length(contact_email) <= 254) not valid;
  end if;
end $$;

-- ---------- 2. Creating a workspace ----------
-- One workspace per account, with a sensible name and web address. Before
-- this, one account could create any number of workspaces and claim any
-- address it liked.
create or replace function public.create_organization(p_name text, p_slug text, p_time_zone text default 'America/Los_Angeles')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_zone text := coalesce(nullif(btrim(coalesce(p_time_zone, '')), ''), 'America/Los_Angeles');
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if exists (select 1 from public.memberships m where m.user_id = auth.uid()) then
    raise exception 'This account already has a workspace';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Give the organization a name between 2 and 80 characters';
  end if;
  if p_slug is null or char_length(p_slug) > 60 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'That web address is not valid';
  end if;
  if char_length(v_zone) > 64 or v_zone !~ '^[A-Za-z0-9_+/-]+$' then
    raise exception 'That time zone is not valid';
  end if;
  insert into public.organizations (name, slug, time_zone, contact_email)
  values (v_name, p_slug, v_zone, (select email from auth.users where id = auth.uid()))
  returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  return v_org;
end;
$$;
revoke execute on function public.create_organization(text, text, text) from public, anon;
grant execute on function public.create_organization(text, text, text) to authenticated;

-- ---------- 3. Has this account really set a password? ----------
-- The site used to trust a note on the account that the account's owner could
-- edit. This answers from the password record itself, which they cannot.
create or replace function public.has_password()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select u.encrypted_password is not null and u.encrypted_password <> '' from auth.users u where u.id = auth.uid()),
    false
  );
$$;
revoke execute on function public.has_password() from public, anon;
grant execute on function public.has_password() to authenticated;

commit;

select 'Step 10 finished. Nothing else to do here.' as result;
