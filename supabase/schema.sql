-- SolidDesign operational schema.
-- One Supabase project is the operational state plane for the small internal Operator.
-- Public previews/design briefs are intentionally read-only public artifacts behind opaque URLs.

create extension if not exists pgcrypto;

create table if not exists public.operator_allowlist (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

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

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  category text,
  city text,
  address text,
  website_url text not null,
  website_key text,
  phone text,
  rating numeric(3,2),
  review_count integer,
  place_id text,
  discovery_source text not null default 'manual',
  discovery_version text,
  discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  source_confidence double precision check (
    source_confidence is null or (source_confidence >= 0 and source_confidence <= 1)
  ),
  operating_status text,
  state text not null default 'DISCOVERED',
  qualification jsonb,
  verified_facts jsonb,
  contact_status text not null default 'qualified' check (contact_status in (
    'qualified','ready_to_mail','mailed','follow_up','contacted','meeting','proposal','won','lost','no_response'
  )),
  contact_note text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  archived_at timestamptz,
  design_brief_token uuid not null default gen_random_uuid(),
  design_workspace_url text,
  design_brief_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent upgrades for databases created by earlier schema revisions.
alter table public.prospects add column if not exists website_key text;
alter table public.prospects add column if not exists discovery_run_id uuid;
alter table public.prospects add column if not exists archived_at timestamptz;
alter table public.prospects add column if not exists design_brief_token uuid;
alter table public.prospects add column if not exists design_workspace_url text;
alter table public.prospects add column if not exists design_brief_note text;
update public.prospects set design_brief_token = gen_random_uuid() where design_brief_token is null;
alter table public.prospects alter column design_brief_token set default gen_random_uuid();
alter table public.prospects alter column design_brief_token set not null;

alter table public.prospects
  drop constraint if exists prospects_discovery_run_id_fkey;
alter table public.prospects
  add constraint prospects_discovery_run_id_fkey
  foreign key (discovery_run_id) references public.discovery_runs(id) on delete set null;

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

create or replace function public.set_prospect_website_key()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.website_key := public.website_key_from_url(new.website_url);
  return new;
end;
$$;

drop trigger if exists prospects_set_website_key on public.prospects;
create trigger prospects_set_website_key
before insert or update of website_url on public.prospects
for each row execute function public.set_prospect_website_key();

update public.prospects
set website_key = public.website_key_from_url(website_url)
where website_key is null;

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  source text not null,
  source_version text,
  score integer,
  grade text,
  findings jsonb not null default '[]'::jsonb,
  screenshot_ref text,
  technical_report_html text,
  technical_report_md text,
  created_at timestamptz not null default now()
);

create table if not exists public.demos (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  site_config jsonb not null,
  preview_url text,
  status text not null default 'DRAFT',
  artifact_path text,
  version_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demos add column if not exists artifact_path text;
alter table public.demos add column if not exists version_note text;

create table if not exists public.mailings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete set null,
  status text not null default 'PREPARED',
  mailed_at timestamptz,
  response_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  prospect_id uuid references public.prospects(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists prospects_source_place_id_uidx
  on public.prospects(discovery_source, place_id)
  where place_id is not null;
create unique index if not exists prospects_design_brief_token_uidx
  on public.prospects(design_brief_token);
create unique index if not exists prospects_website_key_uidx
  on public.prospects(website_key)
  where website_key is not null;
create index if not exists prospects_archived_at_idx on public.prospects(archived_at);
create index if not exists prospects_state_idx on public.prospects(state);
create index if not exists prospects_discovery_run_id_idx on public.prospects(discovery_run_id);
create index if not exists discovery_runs_created_at_idx on public.discovery_runs(created_at desc);
create index if not exists audits_prospect_id_idx on public.audits(prospect_id);
create index if not exists demos_prospect_id_idx on public.demos(prospect_id);
create index if not exists mailings_prospect_id_idx on public.mailings(prospect_id);
create index if not exists mailings_demo_id_idx on public.mailings(demo_id);
create index if not exists events_demo_id_idx on public.events(demo_id);
create index if not exists events_prospect_id_created_at_idx on public.events(prospect_id, created_at desc);

alter table public.prospects enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.audits enable row level security;
alter table public.demos enable row level security;
alter table public.mailings enable row level security;
alter table public.events enable row level security;
alter table public.operator_allowlist enable row level security;

revoke all on table public.prospects from anon, authenticated;
revoke all on table public.discovery_runs from anon, authenticated;
revoke all on table public.audits from anon, authenticated;
revoke all on table public.demos from anon, authenticated;
revoke all on table public.mailings from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.operator_allowlist from anon, authenticated;

grant select, insert, update, delete on table public.prospects to service_role;
grant select, insert, update, delete on table public.discovery_runs to service_role;
grant select, insert, update, delete on table public.audits to service_role;
grant select, insert, update, delete on table public.demos to service_role;
grant select, insert, update, delete on table public.mailings to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.operator_allowlist to service_role;
grant usage, select on sequence public.events_id_seq to service_role;

grant select on table public.prospects to authenticated;
grant update (contact_status, contact_note, next_action_at, last_contact_at, design_workspace_url, design_brief_note, updated_at)
  on table public.prospects to authenticated;
grant select, insert, update on table public.discovery_runs to authenticated;
grant select on table public.audits to authenticated;
grant select, insert on table public.demos to authenticated;
grant update (status, preview_url, site_config, artifact_path, version_note, updated_at)
  on table public.demos to authenticated;
grant select on table public.operator_allowlist to authenticated;

drop policy if exists operator_read_self on public.operator_allowlist;
create policy operator_read_self on public.operator_allowlist
  for select to authenticated
  using (
    active = true
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Standard prospect reads are the active work queue only.
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

drop policy if exists operator_update_contact on public.prospects;
create policy operator_update_contact on public.prospects
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

drop policy if exists operator_read_audits on public.audits;
create policy operator_read_audits on public.audits
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_read_demos on public.demos;
create policy operator_read_demos on public.demos
  for select to authenticated
  using (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_insert_demos on public.demos;
create policy operator_insert_demos on public.demos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_update_demos on public.demos;
create policy operator_update_demos on public.demos
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

-- Mock-up bundles are public static artifacts; mutation stays operator-only.
insert into storage.buckets (id, name, public, file_size_limit)
values ('mockup-sites', 'mockup-sites', true, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists operator_mockup_select on storage.objects;
create policy operator_mockup_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mockup-sites'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_mockup_insert on storage.objects;
create policy operator_mockup_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'mockup-sites'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_mockup_update on storage.objects;
create policy operator_mockup_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'mockup-sites'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    bucket_id = 'mockup-sites'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_mockup_delete on storage.objects;
create policy operator_mockup_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mockup-sites'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Design briefs are public read snapshots behind opaque UUID URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('design-briefs', 'design-briefs', true, 262144)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists operator_design_brief_select on storage.objects;
create policy operator_design_brief_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'design-briefs'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_design_brief_insert on storage.objects;
create policy operator_design_brief_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'design-briefs'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists operator_design_brief_update on storage.objects;
create policy operator_design_brief_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'design-briefs'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    bucket_id = 'design-briefs'
    and exists (
      select 1 from public.operator_allowlist a
      where a.active = true
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
