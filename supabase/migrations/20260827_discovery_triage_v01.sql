-- Automatic discovery triage + explicit human promotion into the active prospect workflow.
-- No new candidate entity or score table: prospects.qualification JSON remains canonical.

create or replace function public.operator_set_discovery_triage(
  p_id uuid,
  p_qualification jsonb,
  p_state text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed integer;
  previous_state text;
  run_id uuid;
begin
  perform public.operator_assert_allowed();

  if p_qualification is null or jsonb_typeof(p_qualification) <> 'object' then
    raise exception 'qualification must be a JSON object';
  end if;
  if p_state is not null and p_state not in ('DISCOVERED','DISQUALIFIED') then
    raise exception 'invalid discovery state';
  end if;

  select p.state, p.discovery_run_id
    into previous_state, run_id
  from public.prospects p
  where p.id = p_id
    and p.archived_at is null
    and p.state in ('DISCOVERED','DISQUALIFIED');

  if previous_state is null then
    return false;
  end if;

  update public.prospects
  set qualification = p_qualification,
      state = coalesce(p_state, state),
      updated_at = now()
  where id = p_id
    and archived_at is null
    and state in ('DISCOVERED','DISQUALIFIED');
  get diagnostics changed = row_count;

  if changed = 1
     and run_id is not null
     and previous_state <> 'DISQUALIFIED'
     and p_state = 'DISQUALIFIED' then
    update public.discovery_runs
    set disqualified_count = disqualified_count + 1
    where id = run_id;
  end if;

  return changed = 1;
end;
$$;

create or replace function public.operator_promote_discovery_candidate(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed integer;
  run_id uuid;
begin
  perform public.operator_assert_allowed();

  update public.prospects p
  set state = 'QUALIFIED',
      qualification = jsonb_set(
        coalesce(p.qualification, '{}'::jsonb),
        '{stage}',
        '"triage_selected"'::jsonb,
        true
      ),
      updated_at = now()
  where p.id = p_id
    and p.archived_at is null
    and p.state = 'DISCOVERED'
    and p.qualification -> 'triage' is not null
  returning p.discovery_run_id into run_id;

  get diagnostics changed = row_count;

  if changed = 1 and run_id is not null then
    update public.discovery_runs
    set qualified_count = qualified_count + 1
    where id = run_id;
  end if;

  return changed = 1;
end;
$$;

revoke all on function public.operator_set_discovery_triage(uuid,jsonb,text) from public;
revoke all on function public.operator_promote_discovery_candidate(uuid) from public;
grant execute on function public.operator_set_discovery_triage(uuid,jsonb,text) to authenticated;
grant execute on function public.operator_promote_discovery_candidate(uuid) to authenticated;
