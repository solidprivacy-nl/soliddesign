-- Research import reuses the existing candidate ingest boundary. When a website was
-- already discovered through Overture or URL intake, preserve that original source
-- provenance and merge only the new research evidence into qualification.research.

create or replace function public.operator_ingest_discovery_candidates(p_run_id uuid, p_candidates jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare inserted_count integer;
declare enriched_count integer;
declare supplied_count integer;
declare run_sector_key text;
begin
  perform public.operator_assert_allowed();
  if jsonb_typeof(p_candidates) <> 'array' then
    raise exception 'candidates must be a JSON array';
  end if;
  if not exists (select 1 from public.discovery_runs r where r.id = p_run_id) then
    raise exception 'discovery run not found';
  end if;

  select case
    when jsonb_typeof(r.input -> 'keywords') = 'array'
      and jsonb_array_length(r.input -> 'keywords') = 1
      and lower(r.input -> 'keywords' ->> 0) ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
    then lower(r.input -> 'keywords' ->> 0)
    when lower(coalesce(r.input ->> 'canonical_sector_key','')) ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
    then lower(r.input ->> 'canonical_sector_key')
    else null
  end
  into run_sector_key
  from public.discovery_runs r
  where r.id = p_run_id;

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
      case
        when lower(coalesce(trim(r.discovery_source),'')) = 'research'
          and coalesce(r.qualification,'{}'::jsonb) ? 'research'
        then jsonb_set(
          r.qualification,
          '{research,run_id}',
          to_jsonb(p_run_id::text),
          true
        )
        else r.qualification
      end,
      coalesce(
        case
          when nullif(trim(r.canonical_sector_key),'') ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
            then lower(trim(r.canonical_sector_key))
          else null
        end,
        run_sector_key
      ),
      p_run_id,
      now()
    from rows r
    where r.website_url is not null
      and public.website_key_from_url(r.website_url) is not null
    on conflict do nothing
    returning id
  )
  select count(*) into inserted_count from ins;

  with research_rows as (
    select
      public.website_key_from_url(r.website_url) as website_key,
      jsonb_set(
        r.qualification -> 'research',
        '{run_id}',
        to_jsonb(p_run_id::text),
        true
      ) as research,
      coalesce(
        case
          when nullif(trim(r.canonical_sector_key),'') ~ '^[a-z0-9][a-z0-9_-]{0,62}$'
            then lower(trim(r.canonical_sector_key))
          else null
        end,
        run_sector_key
      ) as canonical_sector_key
    from jsonb_to_recordset(p_candidates) as r(
      website_url text,
      discovery_source text,
      qualification jsonb,
      canonical_sector_key text
    )
    where lower(coalesce(trim(r.discovery_source),'')) = 'research'
      and coalesce(r.qualification,'{}'::jsonb) ? 'research'
      and public.website_key_from_url(r.website_url) is not null
  ), merged as (
    update public.prospects p
    set qualification = coalesce(p.qualification,'{}'::jsonb)
          || jsonb_build_object('research', rr.research),
        canonical_sector_key = coalesce(p.canonical_sector_key, rr.canonical_sector_key),
        updated_at = now()
    from research_rows rr
    where p.website_key = rr.website_key
      and p.discovery_run_id is distinct from p_run_id
    returning p.id
  )
  select count(*) into enriched_count from merged;

  return jsonb_build_object(
    'found_count', supplied_count,
    'new_count', inserted_count,
    'existing_count', greatest(supplied_count - inserted_count, 0),
    'enriched_count', enriched_count
  );
end;
$$;
