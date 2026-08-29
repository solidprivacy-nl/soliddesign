-- Minimal team membership lifecycle after invite provisioning.

create or replace function public.operator_mark_joined()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  changed integer;
begin
  if caller_id is null then
    raise exception 'authentication required';
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

create or replace function public.operator_set_team_role(p_user_id uuid, p_role text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  previous_role text;
  changed integer;
begin
  select role into caller_role from public.team_members where user_id = caller_id and active = true;
  if caller_role <> 'ADMIN' then raise exception 'admin required'; end if;
  if p_role not in ('ADMIN','KEY_USER','USER') then raise exception 'invalid role'; end if;

  select role into previous_role from public.team_members where user_id = p_user_id and active = true;
  if previous_role is null then raise exception 'active team member not found'; end if;
  if previous_role = p_role then return false; end if;

  if p_user_id = caller_id and previous_role = 'ADMIN' and p_role <> 'ADMIN' and
     (select count(*) from public.team_members where active = true and role = 'ADMIN') <= 1 then
    raise exception 'at least one active admin must remain';
  end if;

  update public.team_members set role = p_role, updated_at = now() where user_id = p_user_id and active = true;
  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.events (event_type,metadata,actor_user_id)
    values ('user_role_changed', jsonb_build_object('target_user_id',p_user_id,'previous_role',previous_role,'role',p_role), caller_id);
  end if;
  return changed = 1;
end;
$$;

create or replace function public.operator_deactivate_team_member(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  target_role text;
  target_email text;
  changed integer;
begin
  select role into caller_role from public.team_members where user_id = caller_id and active = true;
  if caller_role not in ('ADMIN','KEY_USER') then raise exception 'team management permission required'; end if;
  if p_user_id = caller_id then raise exception 'deactivate your own account through another admin'; end if;

  select role,email into target_role,target_email from public.team_members where user_id = p_user_id and active = true;
  if target_role is null then raise exception 'active team member not found'; end if;
  if caller_role = 'KEY_USER' and target_role <> 'USER' then raise exception 'key user can only deactivate users'; end if;
  if target_role = 'ADMIN' and (select count(*) from public.team_members where active = true and role = 'ADMIN') <= 1 then
    raise exception 'at least one active admin must remain';
  end if;
  if exists (select 1 from public.prospect_assignments where user_id = p_user_id) then
    raise exception 'reassign active responsibilities first';
  end if;

  update public.team_members
  set active = false, deactivated_at = now(), updated_at = now()
  where user_id = p_user_id and active = true;
  get diagnostics changed = row_count;

  if changed = 1 then
    update public.operator_allowlist set active = false where lower(email) = lower(target_email);
    insert into public.events (event_type,metadata,actor_user_id)
    values ('user_deactivated', jsonb_build_object('target_user_id',p_user_id,'role',target_role), caller_id);
  end if;
  return changed = 1;
end;
$$;

create or replace function public.operator_reactivate_team_member(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  target_role text;
  target_email text;
  changed integer;
begin
  select role into caller_role from public.team_members where user_id = caller_id and active = true;
  if caller_role not in ('ADMIN','KEY_USER') then raise exception 'team management permission required'; end if;

  select role,email into target_role,target_email from public.team_members where user_id = p_user_id and active = false;
  if target_role is null then raise exception 'inactive team member not found'; end if;
  if caller_role = 'KEY_USER' and target_role <> 'USER' then raise exception 'key user can only reactivate users'; end if;

  update public.team_members
  set active = true, deactivated_at = null, updated_at = now()
  where user_id = p_user_id and active = false;
  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.operator_allowlist(email,active)
    values (target_email,true)
    on conflict (email) do update set active = true;
    insert into public.events (event_type,metadata,actor_user_id)
    values ('user_reactivated', jsonb_build_object('target_user_id',p_user_id,'role',target_role), caller_id);
  end if;
  return changed = 1;
end;
$$;

revoke all on function public.operator_mark_joined() from public, anon;
revoke all on function public.operator_set_team_role(uuid,text) from public, anon;
revoke all on function public.operator_deactivate_team_member(uuid) from public, anon;
revoke all on function public.operator_reactivate_team_member(uuid) from public, anon;

grant execute on function public.operator_mark_joined() to authenticated;
grant execute on function public.operator_set_team_role(uuid,text) to authenticated;
grant execute on function public.operator_deactivate_team_member(uuid) to authenticated;
grant execute on function public.operator_reactivate_team_member(uuid) to authenticated;
