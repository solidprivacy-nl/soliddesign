-- Versioned print-mailing artifacts bridge Design and Outreach without creating
-- a generic document-management subsystem. Artifacts are immutable design output;
-- public.mailings records the physical send of one exact artifact version.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mailing-artifacts',
  'mailing-artifacts',
  false,
  26214400,
  array['application/pdf','image/png','image/jpeg']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.mailing_artifacts (
  id uuid primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 240),
  content_type text not null check (content_type in ('application/pdf','image/png','image/jpeg')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  version_note text check (version_note is null or char_length(version_note) <= 500),
  created_by uuid references public.team_members(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists mailing_artifacts_prospect_created_idx
  on public.mailing_artifacts(prospect_id, created_at desc);

alter table public.mailings
  add column if not exists artifact_id uuid references public.mailing_artifacts(id) on delete restrict;

-- There are no historical mailing rows at introduction time. Make the core
-- invariant explicit: every physical mailing references the exact file sent.
do $block$
begin
  if not exists (select 1 from public.mailings where artifact_id is null) then
    alter table public.mailings alter column artifact_id set not null;
  end if;
end;
$block$;

create index if not exists mailings_artifact_id_idx on public.mailings(artifact_id);

alter table public.mailing_artifacts enable row level security;

revoke all on table public.mailing_artifacts from anon, authenticated;
grant select on table public.mailing_artifacts to authenticated;
grant select, insert, update, delete on table public.mailing_artifacts to service_role;

grant select on table public.mailings to authenticated;

drop policy if exists operator_read_mailing_artifacts on public.mailing_artifacts;
create policy operator_read_mailing_artifacts on public.mailing_artifacts
  for select to authenticated
  using (public.operator_is_active_team_member());

drop policy if exists operator_read_mailings on public.mailings;
create policy operator_read_mailings on public.mailings
  for select to authenticated
  using (public.operator_is_active_team_member());

drop policy if exists operator_mailing_artifact_select on storage.objects;
create policy operator_mailing_artifact_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'mailing-artifacts'
    and public.operator_is_active_team_member()
  );

drop policy if exists operator_mailing_artifact_insert on storage.objects;
create policy operator_mailing_artifact_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'mailing-artifacts'
    and public.operator_is_active_team_member()
  );

-- Delete exists only to clean up an upload if metadata registration fails.
-- Once a mailing_artifacts row exists, the object is immutable.
drop policy if exists operator_mailing_artifact_delete_unregistered on storage.objects;
create policy operator_mailing_artifact_delete_unregistered on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'mailing-artifacts'
    and public.operator_is_active_team_member()
    and not exists (
      select 1
      from public.mailing_artifacts ma
      where ma.storage_path = storage.objects.name
    )
  );

create or replace function public.operator_register_mailing_artifact(
  p_id uuid,
  p_prospect_id uuid,
  p_storage_path text,
  p_file_name text,
  p_content_type text,
  p_size_bytes bigint,
  p_version_note text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'storage', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  expected_prefix text;
begin
  perform public.operator_assert_allowed();

  if p_id is null or p_prospect_id is null then
    raise exception 'artifact and prospect are required';
  end if;

  if not exists (
    select 1 from public.prospects p
    where p.id = p_prospect_id
      and p.archived_at is null
      and p.state not in ('DISCOVERED','DISQUALIFIED')
  ) then
    raise exception 'active prospect not found';
  end if;

  if p_content_type not in ('application/pdf','image/png','image/jpeg') then
    raise exception 'unsupported mailing artifact type';
  end if;

  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 26214400 then
    raise exception 'invalid mailing artifact size';
  end if;

  if p_file_name is null or char_length(trim(p_file_name)) not between 1 and 240 then
    raise exception 'invalid mailing artifact filename';
  end if;

  if p_version_note is not null and char_length(p_version_note) > 500 then
    raise exception 'mailing artifact note too long';
  end if;

  expected_prefix := 'prospects/' || p_prospect_id::text || '/' || p_id::text || '/';
  if p_storage_path is null or p_storage_path not like expected_prefix || '%' then
    raise exception 'invalid mailing artifact path';
  end if;

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'mailing-artifacts'
      and o.name = p_storage_path
  ) then
    raise exception 'mailing artifact object not found';
  end if;

  insert into public.mailing_artifacts (
    id, prospect_id, storage_path, file_name, content_type, size_bytes, version_note, created_by
  ) values (
    p_id, p_prospect_id, p_storage_path, trim(p_file_name), p_content_type, p_size_bytes,
    nullif(trim(coalesce(p_version_note, '')), ''), caller_id
  );

  insert into public.events (prospect_id, event_type, metadata, actor_user_id)
  values (
    p_prospect_id,
    'mailing_artifact_created',
    jsonb_build_object('artifact_id', p_id, 'file_name', trim(p_file_name)),
    caller_id
  );

  return p_id;
end;
$function$;

create or replace function public.operator_register_mailing_sent(
  p_prospect_id uuid,
  p_artifact_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'storage', 'pg_temp'
as $function$
declare
  caller_id uuid := auth.uid();
  artifact_row public.mailing_artifacts%rowtype;
  live_demo_id uuid;
  mailing_id uuid;
begin
  perform public.operator_assert_allowed();

  select ma.*
    into artifact_row
  from public.mailing_artifacts ma
  where ma.id = p_artifact_id
    and ma.prospect_id = p_prospect_id;

  if artifact_row.id is null then
    raise exception 'mailing artifact not found for prospect';
  end if;

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'mailing-artifacts'
      and o.name = artifact_row.storage_path
  ) then
    raise exception 'mailing artifact file is missing';
  end if;

  select d.id
    into live_demo_id
  from public.demos d
  where d.prospect_id = p_prospect_id
    and d.status = 'LIVE'
  order by d.updated_at desc, d.created_at desc
  limit 1;

  if live_demo_id is null then
    raise exception 'a LIVE mock-up is required before physical mailing';
  end if;

  insert into public.mailings (prospect_id, demo_id, artifact_id, status, mailed_at)
  values (p_prospect_id, live_demo_id, p_artifact_id, 'SENT', now())
  returning id into mailing_id;

  -- A physical send may advance only early workflow states. Never regress a
  -- prospect that is already in contact, proposal or another later state.
  update public.prospects
     set contact_status = 'mailed',
         updated_at = now()
   where id = p_prospect_id
     and contact_status in ('qualified','ready_to_mail');

  insert into public.events (prospect_id, demo_id, event_type, metadata, actor_user_id)
  values (
    p_prospect_id,
    live_demo_id,
    'mailing_marked_sent',
    jsonb_build_object(
      'mailing_id', mailing_id,
      'artifact_id', p_artifact_id,
      'file_name', artifact_row.file_name
    ),
    caller_id
  );

  return mailing_id;
end;
$function$;

revoke all on function public.operator_register_mailing_artifact(uuid,uuid,text,text,text,bigint,text) from public, anon;
revoke all on function public.operator_register_mailing_sent(uuid,uuid) from public, anon;
grant execute on function public.operator_register_mailing_artifact(uuid,uuid,text,text,text,bigint,text) to authenticated;
grant execute on function public.operator_register_mailing_sent(uuid,uuid) to authenticated;
