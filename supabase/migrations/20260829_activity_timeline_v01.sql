-- Human-readable dossier history source. Current state remains in operational tables;
-- this RPC exposes only material event history to active team members.

create or replace function public.operator_list_prospect_activity(p_id uuid)
returns table (
  id bigint,
  event_type text,
  metadata jsonb,
  created_at timestamptz,
  actor_user_id uuid,
  actor_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.team_members tm
    where tm.user_id = auth.uid() and tm.active = true
  ) then
    raise exception 'team member not authorized';
  end if;

  if not exists (select 1 from public.prospects p where p.id = p_id) then
    raise exception 'prospect not found';
  end if;

  return query
  select
    e.id,
    e.event_type,
    e.metadata,
    e.created_at,
    e.actor_user_id,
    coalesce(tm.display_name, case when e.actor_user_id is null then 'Systeem' else 'Onbekende gebruiker' end) as actor_name
  from public.events e
  left join public.team_members tm on tm.user_id = e.actor_user_id
  where e.prospect_id = p_id
  order by e.created_at desc
  limit 100;
end;
$$;

revoke all on function public.operator_list_prospect_activity(uuid) from public, anon;
grant execute on function public.operator_list_prospect_activity(uuid) to authenticated;

-- Optimize the two new rollout policies without changing their temporary allowlist semantics.
drop policy if exists team_members_operator_read on public.team_members;
create policy team_members_operator_read on public.team_members
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    )
  );

drop policy if exists prospect_assignments_operator_read on public.prospect_assignments;
create policy prospect_assignments_operator_read on public.prospect_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    )
  );
