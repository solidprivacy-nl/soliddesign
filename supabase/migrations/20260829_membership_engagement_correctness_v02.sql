-- Correctness hardening for invite activation and prospect-response timing.

create or replace function public.operator_mark_joined()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  must_set_password boolean := false;
  changed integer;
begin
  if caller_id is null then
    raise exception 'authentication required';
  end if;

  select coalesce(u.raw_user_meta_data ->> 'solidDesignMustSetPassword', 'false') = 'true'
    into must_set_password
  from auth.users u
  where u.id = caller_id;

  if must_set_password then
    return false;
  end if;

  update public.team_members
  set joined_at = coalesce(joined_at, now()), updated_at = now()
  where user_id = caller_id
    and active = true
    and joined_at is null;
  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.events (event_type,metadata,actor_user_id)
    values ('user_joined', jsonb_build_object('target_user_id', caller_id), caller_id);
  end if;

  return changed = 1;
end;
$$;

revoke all on function public.operator_mark_joined() from public, anon;
grant execute on function public.operator_mark_joined() to authenticated;

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
  relevant_mail timestamptz;
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

  if first_open is null then
    select max(m.mailed_at) into relevant_mail
    from public.mailings m
    where m.prospect_id = p_id and m.mailed_at is not null;
  else
    select max(m.mailed_at) into relevant_mail
    from public.mailings m
    where m.prospect_id = p_id
      and m.mailed_at is not null
      and m.mailed_at <= first_open;
  end if;

  return query
  select
    first_open,
    latest_open,
    (select count(*) from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),
    coalesce((select sum(v.active_seconds)::bigint from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),0),
    coalesce((select max(v.max_scroll_pct) from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL'),0)::smallint,
    (select v.device_type from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL' order by v.started_at desc limit 1),
    (select v.source from public.prospect_visits v where v.prospect_id = p_id and v.audience = 'EXTERNAL' order by v.started_at asc limit 1),
    relevant_mail,
    case when first_open is not null and relevant_mail is not null then extract(epoch from (first_open - relevant_mail))::bigint else null end;
end;
$$;

revoke all on function public.operator_get_prospect_engagement(uuid) from public, anon;
grant execute on function public.operator_get_prospect_engagement(uuid) to authenticated;
