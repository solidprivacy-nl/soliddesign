-- Make sector identity a first-class prospect property.
-- Discovery provenance remains separate: a prospect can be linked to Sector Intelligence
-- regardless of whether it came from an area search, a manual URL, or another source.

alter table public.prospects
  add column if not exists canonical_sector_key text;

alter table public.prospects
  drop constraint if exists prospects_canonical_sector_key_format;
alter table public.prospects
  add constraint prospects_canonical_sector_key_format
  check (
    canonical_sector_key is null
    or canonical_sector_key ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
  );

-- Best-effort compatibility backfill: old single-sector AREA runs already store the
-- validated Overture code in input.keywords. Multi-sector runs remain deliberately
-- unassigned because there is no safe deterministic choice.
update public.prospects p
set canonical_sector_key = lower(dr.input -> 'keywords' ->> 0),
    updated_at = now()
from public.discovery_runs dr
where p.discovery_run_id = dr.id
  and p.canonical_sector_key is null
  and jsonb_typeof(dr.input -> 'keywords') = 'array'
  and jsonb_array_length(dr.input -> 'keywords') = 1
  and lower(dr.input -> 'keywords' ->> 0) ~ '^[a-z0-9][a-z0-9_-]{0,62}$';

-- Operators may explicitly link or change the primary sector without broadening
-- any other prospect mutation capability.
grant update (canonical_sector_key) on table public.prospects to authenticated;

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
      qualification jsonb,
      canonical_sector_key text
    )
  ), ins as (
    insert into public.prospects (
      external_id,name,category,city,address,website_url,website_key,phone,place_id,
      discovery_source,discovery_version,source_confidence,operating_status,state,
      qualification,canonical_sector_key,discovery_run_id,updated_at
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
      case
        when nullif(trim(r.canonical_sector_key),'') ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
          then lower(trim(r.canonical_sector_key))
        else null
      end,
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
