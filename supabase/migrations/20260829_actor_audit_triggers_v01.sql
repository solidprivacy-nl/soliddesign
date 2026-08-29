-- Material activity should not depend on a second best-effort browser write.
-- These narrow triggers log state transitions in the same transaction as the mutation.

create or replace function public.current_team_actor()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.user_id
  from public.team_members tm
  where tm.user_id = auth.uid()
    and tm.active = true
  limit 1;
$$;

create or replace function public.log_prospect_material_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := public.current_team_actor();
begin
  if new.contact_status is distinct from old.contact_status then
    insert into public.events(prospect_id,event_type,metadata,actor_user_id)
    values (new.id,'contact_status_changed',jsonb_build_object('previous_status',old.contact_status,'status',new.contact_status),actor);
  end if;

  if new.last_contact_at is distinct from old.last_contact_at and new.last_contact_at is not null then
    insert into public.events(prospect_id,event_type,metadata,actor_user_id)
    values (new.id,'contact_recorded',jsonb_build_object('last_contact_at',new.last_contact_at),actor);
  end if;

  if new.public_slug is distinct from old.public_slug then
    insert into public.events(prospect_id,event_type,metadata,actor_user_id)
    values (new.id,'public_slug_changed',jsonb_build_object('previous_slug',old.public_slug,'slug',new.public_slug),actor);
  end if;

  if new.archived_at is distinct from old.archived_at then
    insert into public.events(prospect_id,event_type,metadata,actor_user_id)
    values (
      new.id,
      case when new.archived_at is null then 'prospect_restored' else 'prospect_archived' end,
      '{}'::jsonb,
      actor
    );
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_log_material_changes on public.prospects;
create trigger prospects_log_material_changes
after update of contact_status,last_contact_at,public_slug,archived_at on public.prospects
for each row execute function public.log_prospect_material_changes();

create or replace function public.log_demo_material_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := public.current_team_actor();
begin
  if tg_op = 'INSERT' then
    insert into public.events(prospect_id,demo_id,event_type,metadata,actor_user_id)
    values (new.prospect_id,new.id,'demo_created',jsonb_build_object('status',new.status),actor);
    if new.status = 'LIVE' then
      insert into public.events(prospect_id,demo_id,event_type,metadata,actor_user_id)
      values (new.prospect_id,new.id,'demo_promoted_live','{}'::jsonb,actor);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and new.status = 'LIVE' then
    insert into public.events(prospect_id,demo_id,event_type,metadata,actor_user_id)
    values (new.prospect_id,new.id,'demo_promoted_live',jsonb_build_object('previous_status',old.status),actor);
  end if;
  return new;
end;
$$;

drop trigger if exists demos_log_material_insert on public.demos;
create trigger demos_log_material_insert
after insert on public.demos
for each row execute function public.log_demo_material_changes();

drop trigger if exists demos_log_material_status on public.demos;
create trigger demos_log_material_status
after update of status on public.demos
for each row execute function public.log_demo_material_changes();

revoke all on function public.current_team_actor() from public, anon, authenticated;
revoke all on function public.log_prospect_material_changes() from public, anon, authenticated;
revoke all on function public.log_demo_material_changes() from public, anon, authenticated;
