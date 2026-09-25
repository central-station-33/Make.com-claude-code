-- Backup logins: let one extra login email (e.g. a personal or second-brokerage
-- address) sign in to an EXISTING team_agents profile with the same permissions.
-- Primary login stays on team_agents.auth_user_id. Approved by James Thompson 2026-09-25.

create table if not exists public.team_agent_logins (
  auth_user_id  uuid primary key references auth.users(id) on delete cascade,
  team_agent_id uuid not null references public.team_agents(id) on delete cascade,
  email         text not null,
  kind          text not null default 'backup' check (kind in ('backup')),
  status        text not null default 'active' check (status in ('active','disabled')),
  created_by    uuid,
  created_at    timestamptz not null default now()
);

-- One active backup login per agent.
create unique index if not exists team_agent_logins_one_active_backup
  on public.team_agent_logins (team_agent_id) where status = 'active' and kind = 'backup';

-- A login that is already someone's primary login cannot also be a backup.
create or replace function public.team_agent_logins_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $f$
begin
  if exists (select 1 from public.team_agents where auth_user_id = new.auth_user_id) then
    raise exception 'auth user % is already a primary login for a team agent', new.auth_user_id;
  end if;
  new.email := lower(trim(new.email));
  return new;
end $f$;
drop trigger if exists team_agent_logins_guard on public.team_agent_logins;
create trigger team_agent_logins_guard before insert or update on public.team_agent_logins
  for each row execute function public.team_agent_logins_guard();

alter table public.team_agent_logins enable row level security;
drop policy if exists "users view own backup login" on public.team_agent_logins;
create policy "users view own backup login" on public.team_agent_logins
  for select to authenticated using (auth_user_id = auth.uid());

-- Display column so the Team page can show each agent's backup email.
alter table public.team_agents add column if not exists backup_email text;

-- Resolve the signed-in user to a team agent via primary OR active backup login.
create or replace function public.current_team_agent_id()
returns uuid language sql stable security definer set search_path = public, pg_temp as $f$
  select coalesce(
    (select id from public.team_agents where auth_user_id = auth.uid()),
    (select l.team_agent_id from public.team_agent_logins l
      where l.auth_user_id = auth.uid() and l.status = 'active')
  );
$f$;

create or replace function public.is_broker()
returns boolean language sql stable security definer set search_path = public, pg_temp as $f$
  select exists (select 1 from public.team_agents
                  where id = public.current_team_agent_id() and role = 'broker');
$f$;

create or replace function public.can_access_brand(p_brand uuid)
returns boolean language sql stable security definer set search_path = public as $f$
  select public.is_broker() or exists (
    select 1 from public.brand_members bm
      join public.team_agents ta on ta.id = bm.team_agent_id
     where bm.brand_id = p_brand and bm.status = 'active' and ta.status = 'active'
       and ta.id = public.current_team_agent_id()
  );
$f$;

-- Brokers manage backup logins (after is_broker exists in its new form).
drop policy if exists "brokers manage backup logins" on public.team_agent_logins;
create policy "brokers manage backup logins" on public.team_agent_logins
  for all to authenticated using (public.is_broker()) with check (public.is_broker());

-- Policies that matched auth_user_id directly now use the resolver.
drop policy if exists "agents view own team_agents row" on public.team_agents;
create policy "agents view own team_agents row" on public.team_agents
  for select to authenticated using (id = public.current_team_agent_id());

drop policy if exists "brands read" on public.brands;
create policy "brands read" on public.brands
  for select to authenticated using (
    public.is_broker() or exists (
      select 1 from public.brand_members bm
       where bm.brand_id = brands.id and bm.status = 'active'
         and bm.team_agent_id = public.current_team_agent_id()));

drop policy if exists "brand members read" on public.brand_members;
create policy "brand members read" on public.brand_members
  for select to authenticated using (
    public.is_broker() or team_agent_id = public.current_team_agent_id());

grant execute on function public.current_team_agent_id() to authenticated;
