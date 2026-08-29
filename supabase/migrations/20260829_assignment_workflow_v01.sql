-- Guarded current-responsibility mutation with actor-aware history.

create or replace function public.operator_set_assignment(
  p_prospect_id uuid,
  p_responsibility text,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  previous_user_id uuid;
  changed boolean := false;
begin
  if caller_id is null then
    raise exception 'authentication required';
  end if;

  select tm.role into caller_role
  from public.team_members tm
  where tm.user_id = caller_id and tm.active = true;

  if caller_role is null then
    raise exception 'team member not authorized';
  end if;

  if p_responsibility not in ('CASE_LEAD','DESIGN','OUTREACH') then
    raise exception 'invalid responsibility';
  end if;

  if not exists (
    select 1 from public.prospects p
    where p.id = p_prospect_id and p.archived_at is null
  ) then
    raise exception 'active prospect not found';
  end if;

  if caller_role not in ('ADMIN','KEY_USER') then
    if caller_role <> 'USER'
       or p_responsibility = 'CASE_LEAD'
       or not exists (
         select 1 from public.prospect_assignments pa
         where pa.prospect_id = p_prospect_id
           and pa.responsibility = 'CASE_LEAD'
           and pa.user_id = caller_id
       ) then
      raise exception 'not allowed to change this responsibility';
    end if;
  end if;

  if p_user_id is not null and not exists (
    select 1 from public.team_members tm
    where tm.user_id = p_user_id and tm.active = true
  ) then
    raise exception 'assignee must be an active team member';
  end if;

  select pa.user_id into previous_user_id
  from public.prospect_assignments pa
  where pa.prospect_id = p_prospect_id
    and pa.responsibility = p_responsibility;

  if previous_user_id is not distinct from p_user_id then
    return false;
  end if;

  if p_user_id is null then
    delete from public.prospect_assignments
    where prospect_id = p_prospect_id
      and responsibility = p_responsibility;
    changed := found;
  else
    insert into public.prospect_assignments (prospect_id,responsibility,user_id,assigned_at)
    values (p_prospect_id,p_responsibility,p_user_id,now())
    on conflict (prospect_id,responsibility)
    do update set user_id = excluded.user_id, assigned_at = excluded.assigned_at;
    changed := true;
  end if;

  if changed then
    insert into public.events (prospect_id,event_type,metadata,actor_user_id)
    values (
      p_prospect_id,
      'responsibility_changed',
      jsonb_build_object(
        'responsibility', p_responsibility,
        'previous_user_id', previous_user_id,
        'user_id', p_user_id
      ),
      caller_id
    );
  end if;

  return changed;
end;
$$;

revoke all on function public.operator_set_assignment(uuid,text,uuid) from public, anon;
grant execute on function public.operator_set_assignment(uuid,text,uuid) to authenticated;
