-- SolidDesign operational schema.
-- Public previews are static artifacts. The small internal Operator frontend
-- uses Supabase Auth + an explicit email allowlist + RLS.
-- Apply only to the dedicated SolidDesign Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  category text,
  city text,
  address text,
  website_url text not null,
  phone text,
  rating numeric(3,2),
  review_count integer,
  place_id text,
  discovery_source text not null default 'manual',
  discovery_version text,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.operator_allowlist (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists prospects_source_place_id_uidx
  on public.prospects(discovery_source, place_id)
  where place_id is not null;
create index if not exists audits_prospect_id_idx on public.audits(prospect_id);
create index if not exists demos_prospect_id_idx on public.demos(prospect_id);
create index if not exists mailings_prospect_id_idx on public.mailings(prospect_id);
create index if not exists mailings_demo_id_idx on public.mailings(demo_id);
create index if not exists events_demo_id_idx on public.events(demo_id);
create index if not exists events_prospect_id_created_at_idx on public.events(prospect_id, created_at desc);

alter table public.prospects enable row level security;
alter table public.audits enable row level security;
alter table public.demos enable row level security;
alter table public.mailings enable row level security;
alter table public.events enable row level security;
alter table public.operator_allowlist enable row level security;

revoke all on table public.prospects from anon, authenticated;
revoke all on table public.audits from anon, authenticated;
revoke all on table public.demos from anon, authenticated;
revoke all on table public.mailings from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.operator_allowlist from anon, authenticated;

grant select, insert, update, delete on table public.prospects to service_role;
grant select, insert, update, delete on table public.audits to service_role;
grant select, insert, update, delete on table public.demos to service_role;
grant select, insert, update, delete on table public.mailings to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.operator_allowlist to service_role;
grant usage, select on sequence public.events_id_seq to service_role;

grant select on table public.prospects to authenticated;
grant update (contact_status, contact_note, next_action_at, last_contact_at, updated_at) on table public.prospects to authenticated;
grant select on table public.audits to authenticated;
grant select, insert on table public.demos to authenticated;
grant update (status, preview_url, site_config, artifact_path, version_note, updated_at) on table public.demos to authenticated;
grant select on table public.operator_allowlist to authenticated;

drop policy if exists operator_read_self on public.operator_allowlist;
create policy operator_read_self on public.operator_allowlist
  for select to authenticated
  using (
    active = true
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists operator_read_prospects on public.prospects;
create policy operator_read_prospects on public.prospects
  for select to authenticated
  using (
    exists (
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

-- Mock-up bundles are static public artifacts. Public read is intentional;
-- uploads and mutation remain restricted to allowlisted authenticated operators.
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
