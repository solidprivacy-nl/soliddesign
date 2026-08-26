-- Discovery inbox + archive support for the small internal Operator.
-- One prospects table remains canonical; discovery and archive are views/states, not new CRM entities.

create or replace function public.website_key_from_url(value text)
returns text
language sql
immutable
strict
as $$
  select nullif(
    regexp_replace(
      split_part(
        split_part(regexp_replace(lower(trim(value)), '^https?://', '', 'i'), '/', 1),
        ':',
        1
      ),
      '^www\.',
      ''
    ),
    ''
  );
$$;

alter table public.prospects add column if not exists archived_at timestamptz;
alter table public.prospects add column if not exists website_key text;
alter table public.prospects add column if not exists discovery_run_id uuid;

update public.prospects
set website_key = public.website_key_from_url(website_url)
where website_key is null;

create unique index if not exists prospects_website_key_uidx
  on public.prospects(website_key)
  where website_key is not null;
create index if not exists prospects_archived_at_idx on public.prospects(archived_at);
create index if not exists prospects_state_idx on public.prospects(state);

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('AREA','URL')),
  input jsonb not null default '{}'::jsonb,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','COMPLETED','FAILED')),
  found_count integer not null default 0,
  new_count integer not null default 0,
  qualified_count integer not null default 0,
  disqualified_count integer not null default 0,
  result jsonb not null default '{}'::jsonb,
  error text,
  created_by text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.prospects
  drop constraint if exists prospects_discovery_run_id_fkey;
alter table public.prospects
  add constraint prospects_discovery_run_id_fkey
  foreign key (discovery_run_id) references public.discovery_runs(id) on delete set null;
create index if not exists prospects_discovery_run_id_idx on public.prospects(discovery_run_id);
create index if not exists discovery_runs_created_at_idx on public.discovery_runs(created_at desc);

alter table public.discovery_runs enable row level security;
revoke all on table public.discovery_runs from anon, authenticated;
grant select, insert, update on table public.discovery_runs to authenticated;
grant select, insert, update, delete on table public.discovery_runs to service_role;

drop policy if exists operator_read_discovery_runs on public.discovery_runs;
create policy operator_read_discovery_runs on public.discovery_runs
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_insert_discovery_runs on public.discovery_runs;
create policy operator_insert_discovery_runs on public.discovery_runs
  for insert to authenticated
  with check (
    lower(created_by) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_update_discovery_runs on public.discovery_runs;
create policy operator_update_discovery_runs on public.discovery_runs
  for update to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Normal prospect reads are the active work queue only. Discovery and archive have narrow RPC views.
drop policy if exists operator_read_prospects on public.prospects;
create policy operator_read_prospects on public.prospects
  for select to authenticated
  using (
    archived_at is null
    and state not in ('DISCOVERED','DISQUALIFIED')
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create or replace function public.operator_assert_allowed()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.operator_allowlist a
    where a.active = true
      and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) then
    raise exception 'operator not authorized';
  end if;
end;
$$;

create or replace function public.operator_list_archived_prospects()
returns table (
  id uuid,
  name text,
  category text,
  city text,
  website_url text,
  state text,
  contact_status text,
  archived_at timestamptz,
  updated_at timestamptz,
  qualification jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.operator_assert_allowed();
  return query
  select p.id,p.name,p.category,p.city,p.website_url,p.state,p.contact_status,p.archived_at,p.updated_at,p.qualification
  from public.prospects p
  where p.archived_at is not null
  order by p.archived_at desc;
end;
$$;

create or replace function public.operator_list_discovery_candidates()
returns table (
  id uuid,
  name text,
  category text,
  city text,
  website_url text,
  state text,
  discovery_source text,
  discovery_run_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  qualification jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.operator_assert_allowed();
  return query
  select p.id,p.name,p.category,p.city,p.website_url,p.state,p.discovery_source,p.discovery_run_id,p.created_at,p.updated_at,p.qualification
  from public.prospects p
  where p.archived_at is null
    and p.state in ('DISCOVERED','DISQUALIFIED')
  order by p.updated_at desc;
end;
$$;

create or replace function public.operator_archive_prospect(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare changed integer;
begin
  perform public.operator_assert_allowed();
  update public.prospects
  set archived_at = now(), updated_at = now()
  where id = p_id and archived_at is null and state not in ('DISCOVERED','DISQUALIFIED');
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.operator_restore_prospect(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare changed integer;
begin
  perform public.operator_assert_allowed();
  update public.prospects
  set archived_at = null, updated_at = now()
  where id = p_id and archived_at is not null;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.operator_delete_prospect(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare changed integer;
begin
  perform public.operator_assert_allowed();
  delete from public.prospects p
  where p.id = p_id
    and (p.archived_at is not null or p.state in ('DISCOVERED','DISQUALIFIED'))
    and not exists (select 1 from public.demos d where d.prospect_id = p.id)
    and not exists (select 1 from public.mailings m where m.prospect_id = p.id);
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.operator_set_discovery_state(p_id uuid, p_state text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare changed integer;
begin
  perform public.operator_assert_allowed();
  if p_state not in ('DISCOVERED','DISQUALIFIED') then
    raise exception 'invalid discovery state';
  end if;
  update public.prospects
  set state = p_state, updated_at = now()
  where id = p_id and archived_at is null and state in ('DISCOVERED','DISQUALIFIED');
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.operator_ingest_discovery_candidates(p_run_id uuid, p_candidates jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare inserted_count integer;
declare supplied_count integer;
begin
  perform public.operator_assert_allowed();
  if jsonb_typeof(p_candidates) <> 'array' then
    raise exception 'candidates must be a JSON array';
  end if;
  if not exists (select 1 from public.discovery_runs r where r.id = p_run_id) then
    raise exception 'discovery run not found';
  end if;

  supplied_count := jsonb_array_length(p_candidates);

  with rows as (
    select *
    from jsonb_to_recordset(p_candidates) as x(
      external_id text,
      name text,
      category text,
      city text,
      address text,
      website_url text,
      phone text,
      place_id text,
      discovery_source text,
      discovery_version text,
      source_confidence double precision,
      operating_status text,
      state text,
      qualification jsonb
    )
  ), ins as (
    insert into public.prospects (
      external_id,name,category,city,address,website_url,website_key,phone,place_id,
      discovery_source,discovery_version,source_confidence,operating_status,state,
      qualification,discovery_run_id,updated_at
    )
    select
      r.external_id,
      coalesce(nullif(trim(r.name),''), public.website_key_from_url(r.website_url)),
      nullif(trim(r.category),''),
      nullif(trim(r.city),''),
      nullif(trim(r.address),''),
      r.website_url,
      public.website_key_from_url(r.website_url),
      nullif(trim(r.phone),''),
      nullif(trim(r.place_id),''),
      coalesce(nullif(trim(r.discovery_source),''),'manual_url'),
      nullif(trim(r.discovery_version),''),
      r.source_confidence,
      nullif(trim(r.operating_status),''),
      case when r.state = 'DISQUALIFIED' then 'DISQUALIFIED' else 'DISCOVERED' end,
      r.qualification,
      p_run_id,
      now()
    from rows r
    where r.website_url is not null
      and public.website_key_from_url(r.website_url) is not null
    on conflict do nothing
    returning id
  )
  select count(*) into inserted_count from ins;

  return jsonb_build_object(
    'found_count', supplied_count,
    'new_count', inserted_count,
    'existing_count', greatest(supplied_count - inserted_count, 0)
  );
end;
$$;

revoke all on function public.operator_assert_allowed() from public;
revoke all on function public.operator_list_archived_prospects() from public;
revoke all on function public.operator_list_discovery_candidates() from public;
revoke all on function public.operator_archive_prospect(uuid) from public;
revoke all on function public.operator_restore_prospect(uuid) from public;
revoke all on function public.operator_delete_prospect(uuid) from public;
revoke all on function public.operator_set_discovery_state(uuid,text) from public;
revoke all on function public.operator_ingest_discovery_candidates(uuid,jsonb) from public;

grant execute on function public.operator_list_archived_prospects() to authenticated;
grant execute on function public.operator_list_discovery_candidates() to authenticated;
grant execute on function public.operator_archive_prospect(uuid) to authenticated;
grant execute on function public.operator_restore_prospect(uuid) to authenticated;
grant execute on function public.operator_delete_prospect(uuid) to authenticated;
grant execute on function public.operator_set_discovery_state(uuid,text) to authenticated;
grant execute on function public.operator_ingest_discovery_candidates(uuid,jsonb) to authenticated;
