-- Minimal first-party prospect engagement. A visit represents one measured page opening,
-- not an identified person or persistent browser identity.

create table if not exists public.prospect_visits (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete set null,
  audience text not null default 'EXTERNAL' check (audience in ('EXTERNAL','INTERNAL')),
  source text not null default 'DIRECT' check (source in ('DIRECT','QR')),
  device_type text not null default 'OTHER' check (device_type in ('MOBILE','TABLET','DESKTOP','OTHER')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds between 0 and 43200),
  max_scroll_pct smallint not null default 0 check (max_scroll_pct between 0 and 100),
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.prospect_visits is
  'One measured prospect-page opening. Contains no raw IP, fingerprint or persistent visitor identity.';

create index if not exists prospect_visits_prospect_started_idx
  on public.prospect_visits(prospect_id, started_at desc);

alter table public.prospect_visits enable row level security;
revoke all on table public.prospect_visits from anon, authenticated;
grant select, insert, update, delete on table public.prospect_visits to service_role;

create or replace function public.operator_get_prospect_engagement(p_id uuid)
returns table (
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  external_openings bigint,
  active_seconds_total bigint,
  max_scroll_pct smallint,
  latest_device text,
  first_source text,
  mailed_at timestamptz,
  seconds_after_mailing bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  first_open timestamptz;
  latest_open timestamptz;
  latest_mail timestamptz;
begin
  if not exists (select 1 from public.team_members tm where tm.user_id = auth.uid() and tm.active = true) then
    raise exception 'team member not authorized';
  end if;
  if not exists (select 1 from public.prospects p where p.id = p_id) then
    raise exception 'prospect not found';
  end if;

  select min(v.started_at), max(v.started_at)
    into first_open, latest_open
  from public.prospect_visits v
  where v.prospect_id = p_id and v.audience = 'EXTERNAL';

  select max(m.mailed_at) into latest_mail
  from public.mailings m
  where m.prospect_id = p_id and m.mailed_at is not null;

  return query
  select
    first_open,
    latest_open,
    (select count(*) from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),
    coalesce((select sum(v.active_seconds)::bigint from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),0),
    coalesce((select max(v.max_scroll_pct) from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),0)::smallint,
    (select v.device_type from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL' order by v.started_at desc limit 1),
    (select v.source from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL' order by v.started_at asc limit 1),
    latest_mail,
    case when first_open is not null and latest_mail is not null then extract(epoch from (first_open - latest_mail))::bigint else null end;
end;
$$;

create or replace function public.operator_list_prospect_visits(p_id uuid)
returns table (
  id uuid,
  demo_id uuid,
  audience text,
  source text,
  device_type text,
  started_at timestamptz,
  last_seen_at timestamptz,
  active_seconds integer,
  max_scroll_pct smallint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.team_members tm where tm.user_id = auth.uid() and tm.active = true) then
    raise exception 'team member not authorized';
  end if;
  if not exists (select 1 from public.prospects p where p.id = p_id) then
    raise exception 'prospect not found';
  end if;

  return query
  select v.id,v.demo_id,v.audience,v.source,v.device_type,v.started_at,v.last_seen_at,v.active_seconds,v.max_scroll_pct
  from public.prospect_visits v
  where v.prospect_id = p_id
  order by v.started_at desc
  limit 100;
end;
$$;

revoke all on function public.operator_get_prospect_engagement(uuid) from public, anon;
revoke all on function public.operator_list_prospect_visits(uuid) from public, anon;
grant execute on function public.operator_get_prospect_engagement(uuid) to authenticated;
grant execute on function public.operator_list_prospect_visits(uuid) to authenticated;
