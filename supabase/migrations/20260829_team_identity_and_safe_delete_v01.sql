-- Human-readable team identity and safe permanent account deletion support.
-- display_name is the canonical visible identity in SolidDesign; e-mail is account metadata.

alter table public.team_members
  drop constraint if exists team_members_user_id_fkey;

alter table public.team_members
  add constraint team_members_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create or replace function public.operator_update_team_display_name(
  p_user_id uuid,
  p_display_name text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_role text;
  previous_name text;
  clean_name text := btrim(regexp_replace(coalesce(p_display_name, ''), '\s+', ' ', 'g'));
  changed integer;
begin
  select role into caller_role
  from public.team_members
  where user_id = caller_id and active = true;

  if caller_role <> 'ADMIN' then
    raise exception 'admin required';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 100 then
    raise exception 'display name must contain 2 to 100 characters';
  end if;

  select display_name into previous_name
  from public.team_members
  where user_id = p_user_id;

  if previous_name is null then
    raise exception 'team member not found';
  end if;

  if previous_name = clean_name then
    return false;
  end if;

  update public.team_members
  set display_name = clean_name,
      updated_at = now()
  where user_id = p_user_id;
  get diagnostics changed = row_count;

  if changed = 1 then
    insert into public.events (event_type, metadata, actor_user_id)
    values (
      'user_display_name_changed',
      jsonb_build_object(
        'target_user_id', p_user_id,
        'previous_display_name', previous_name,
        'display_name', clean_name
      ),
      caller_id
    );
  end if;

  return changed = 1;
end;
$$;

revoke all on function public.operator_update_team_display_name(uuid,text) from public, anon;
grant execute on function public.operator_update_team_display_name(uuid,text) to authenticated;

comment on function public.operator_update_team_display_name(uuid,text) is
  'Admin-only change of the canonical human-readable team display name.';
