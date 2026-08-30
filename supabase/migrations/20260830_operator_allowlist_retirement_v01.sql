-- Final retirement of the historical operator_allowlist compatibility model.
-- Apply only after the team_members-based frontend is deployed to production.

create or replace function public.operator_deactivate_team_member(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  target_role text;
  changed integer;
begin
  select role
    into caller_role
  from public.team_members
  where user_id = caller_id
    and active = true;

  if caller_role not in ('ADMIN', 'KEY_USER') then
    raise exception 'team management permission required';
  end if;

  if p_user_id = caller_id then
    raise exception 'deactivate your own account through another admin';
  end if;

  select role
    into target_role
  from public.team_members
  where user_id = p_user_id
    and active = true;

  if target_role is null then
    raise exception 'active team member not found';
  end if;

  if caller_role = 'KEY_USER' and target_role <> 'USER' then
    raise exception 'key user can only deactivate users';
  end if;

  if target_role = 'ADMIN'
     and (select count(*) from public.team_members where active = true and role = 'ADMIN') <= 1 then
    raise exception 'at least one active admin must remain';
  end if;

  if exists (select 1 from public.prospect_assignments where user_id = p_user_id) then
    raise exception 'reassign active responsibilities first';
  end if;

  update public.team_members
     set active = false,
         deactivated_at = now(),
         updated_at = now()
   where user_id = p_user_id
     and active = true;

  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.events (event_type, metadata, actor_user_id)
    values (
      'user_deactivated',
      jsonb_build_object('target_user_id', p_user_id, 'role', target_role),
      caller_id
    );
  end if;

  return changed = 1;
end;
$function$;

create or replace function public.operator_reactivate_team_member(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  target_role text;
  changed integer;
begin
  select role
    into caller_role
  from public.team_members
  where user_id = caller_id
    and active = true;

  if caller_role not in ('ADMIN', 'KEY_USER') then
    raise exception 'team management permission required';
  end if;

  select role
    into target_role
  from public.team_members
  where user_id = p_user_id
    and active = false;

  if target_role is null then
    raise exception 'inactive team member not found';
  end if;

  if caller_role = 'KEY_USER' and target_role <> 'USER' then
    raise exception 'key user can only reactivate users';
  end if;

  update public.team_members
     set active = true,
         deactivated_at = null,
         updated_at = now()
   where user_id = p_user_id
     and active = false;

  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.events (event_type, metadata, actor_user_id)
    values (
      'user_reactivated',
      jsonb_build_object('target_user_id', p_user_id, 'role', target_role),
      caller_id
    );
  end if;

  return changed = 1;
end;
$function$;

drop table if exists public.operator_allowlist;
