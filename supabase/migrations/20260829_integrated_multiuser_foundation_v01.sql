-- Integrated multi-user foundation.
-- Backwards compatible: operator_allowlist remains the active access gate during rollout.

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  display_name text not null,
  role text not null default 'USER' check (role in ('ADMIN','KEY_USER','USER')),
  active boolean not null default true,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((active and deactivated_at is null) or (not active and deactivated_at is not null))
);

comment on table public.team_members is
  'SolidDesign application membership and governance role. System role is independent from prospect responsibility.';

-- Migrate current pilot operators. The oldest existing operator becomes the bootstrap Admin;
-- later governance changes happen through the Team workflow, not manual SQL.
with existing as (
  select
    u.id as user_id,
    lower(u.email) as email,
    coalesce(nullif(split_part(u.email, '@', 1), ''), 'Gebruiker') as display_name,
    a.created_at as allowlisted_at,
    u.created_at as auth_created_at,
    row_number() over (order by u.created_at, u.id) as operator_order
  from public.operator_allowlist a
  join auth.users u on lower(u.email) = lower(a.email)
  where a.active = true
)
insert into public.team_members (
  user_id,email,display_name,role,active,invited_at,joined_at,created_at,updated_at
)
select
  user_id,
  email,
  display_name,
  case when operator_order = 1 then 'ADMIN' else 'USER' end,
  true,
  coalesce(allowlisted_at, auth_created_at, now()),
  coalesce(auth_created_at, now()),
  coalesce(auth_created_at, now()),
  now()
from existing
on conflict (user_id) do nothing;

create table if not exists public.prospect_assignments (
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  responsibility text not null check (responsibility in ('CASE_LEAD','DESIGN','OUTREACH')),
  user_id uuid not null references public.team_members(user_id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (prospect_id, responsibility)
);

comment on table public.prospect_assignments is
  'Current accountable team member per prospect responsibility. Portfolio is derived from this state.';

alter table public.events add column if not exists actor_user_id uuid;

alter table public.events
  drop constraint if exists events_actor_user_id_fkey;
alter table public.events
  add constraint events_actor_user_id_fkey
  foreign key (actor_user_id) references public.team_members(user_id) on delete set null;

create index if not exists prospect_assignments_user_id_idx
  on public.prospect_assignments(user_id);
create index if not exists events_actor_user_id_created_at_idx
  on public.events(actor_user_id, created_at desc)
  where actor_user_id is not null;

alter table public.team_members enable row level security;
alter table public.prospect_assignments enable row level security;

revoke all on table public.team_members from anon, authenticated;
revoke all on table public.prospect_assignments from anon, authenticated;

grant select on table public.team_members to authenticated;
grant select on table public.prospect_assignments to authenticated;
grant select, insert, update, delete on table public.team_members to service_role;
grant select, insert, update, delete on table public.prospect_assignments to service_role;

-- During the staged rollout, existing operator authorization remains the gate.
-- This avoids an access cutover until invite/onboarding UI and new role-aware mutations are proven.
drop policy if exists team_members_operator_read on public.team_members;
create policy team_members_operator_read on public.team_members
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists prospect_assignments_operator_read on public.prospect_assignments;
create policy prospect_assignments_operator_read on public.prospect_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Operators may read actor attribution on existing events, but event mutation remains server/service controlled.
grant select (actor_user_id) on table public.events to authenticated;
