-- Stage 1 access cutover: active team_members becomes the authorization source.
-- Keep operator_allowlist temporarily so the not-yet-merged production frontend can
-- still complete its legacy bootstrap check without interrupting current operators.
-- The table and compatibility sync are removed only after the new frontend is live.

create or replace function public.operator_is_active_team_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.user_id = auth.uid()
      and tm.active = true
  );
$$;

revoke all on function public.operator_is_active_team_member() from public;
revoke all on function public.operator_is_active_team_member() from anon;
grant execute on function public.operator_is_active_team_member() to authenticated;

create or replace function public.operator_assert_allowed()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.operator_is_active_team_member() then
    raise exception 'operator not authorized';
  end if;
end;
$$;

-- Core Operator data.
drop policy if exists operator_read_audits on public.audits;
create policy operator_read_audits on public.audits
for select to authenticated
using (public.operator_is_active_team_member());

drop policy if exists operator_insert_demos on public.demos;
create policy operator_insert_demos on public.demos
for insert to authenticated
with check (public.operator_is_active_team_member());

drop policy if exists operator_read_demos on public.demos;
create policy operator_read_demos on public.demos
for select to authenticated
using (public.operator_is_active_team_member());

drop policy if exists operator_update_demos on public.demos;
create policy operator_update_demos on public.demos
for update to authenticated
using (public.operator_is_active_team_member())
with check (public.operator_is_active_team_member());

drop policy if exists operator_insert_discovery_runs on public.discovery_runs;
create policy operator_insert_discovery_runs on public.discovery_runs
for insert to authenticated
with check (
  public.operator_is_active_team_member()
  and lower(created_by) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists operator_read_discovery_runs on public.discovery_runs;
create policy operator_read_discovery_runs on public.discovery_runs
for select to authenticated
using (public.operator_is_active_team_member());

drop policy if exists operator_update_discovery_runs on public.discovery_runs;
create policy operator_update_discovery_runs on public.discovery_runs
for update to authenticated
using (public.operator_is_active_team_member())
with check (public.operator_is_active_team_member());

drop policy if exists prospect_assignments_operator_read on public.prospect_assignments;
create policy prospect_assignments_operator_read on public.prospect_assignments
for select to authenticated
using (public.operator_is_active_team_member());

drop policy if exists operator_read_prospects on public.prospects;
create policy operator_read_prospects on public.prospects
for select to authenticated
using (
  archived_at is null
  and state <> all (array['DISCOVERED'::text, 'DISQUALIFIED'::text])
  and public.operator_is_active_team_member()
);

drop policy if exists operator_update_contact on public.prospects;
create policy operator_update_contact on public.prospects
for update to authenticated
using (public.operator_is_active_team_member())
with check (public.operator_is_active_team_member());

drop policy if exists team_members_operator_read on public.team_members;
create policy team_members_operator_read on public.team_members
for select to authenticated
using (public.operator_is_active_team_member());

-- Storage capabilities used by the CMS.
drop policy if exists operator_design_brief_insert on storage.objects;
create policy operator_design_brief_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'design-briefs'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_design_brief_select on storage.objects;
create policy operator_design_brief_select on storage.objects
for select to authenticated
using (
  bucket_id = 'design-briefs'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_design_brief_update on storage.objects;
create policy operator_design_brief_update on storage.objects
for update to authenticated
using (
  bucket_id = 'design-briefs'
  and public.operator_is_active_team_member()
)
with check (
  bucket_id = 'design-briefs'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_mockup_delete on storage.objects;
create policy operator_mockup_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'mockup-sites'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_mockup_insert on storage.objects;
create policy operator_mockup_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'mockup-sites'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_mockup_select on storage.objects;
create policy operator_mockup_select on storage.objects
for select to authenticated
using (
  bucket_id = 'mockup-sites'
  and public.operator_is_active_team_member()
);

drop policy if exists operator_mockup_update on storage.objects;
create policy operator_mockup_update on storage.objects
for update to authenticated
using (
  bucket_id = 'mockup-sites'
  and public.operator_is_active_team_member()
)
with check (
  bucket_id = 'mockup-sites'
  and public.operator_is_active_team_member()
);
