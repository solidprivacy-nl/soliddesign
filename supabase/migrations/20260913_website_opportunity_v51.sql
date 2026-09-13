-- Website Opportunity Review v5.1
--
-- Keep technical audit evidence intact and store only the human-reviewed commercial
-- interpretation in the existing prospect qualification JSONB. This adds no table,
-- status machine, AI runtime, or generic JSON mutation capability.
--
-- Reversal is intentionally small: remove the CMS read/write path and drop this
-- function in a compensating migration. Existing qualification.website_opportunity
-- JSON can remain inert (preferred, preserves history) or be removed separately only
-- when an explicitly destructive cleanup is desired.

create or replace function public.operator_set_website_opportunity(
  p_prospect_id uuid,
  p_source_audit_id uuid,
  p_findings jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  perform public.operator_assert_allowed();

  if p_prospect_id is null then
    raise exception 'prospect_id is required';
  end if;

  if p_source_audit_id is null then
    raise exception 'source_audit_id is required';
  end if;

  if not exists (
    select 1
    from public.prospects p
    where p.id = p_prospect_id
      and p.archived_at is null
  ) then
    raise exception 'active prospect not found';
  end if;

  if not exists (
    select 1
    from public.audits a
    where a.id = p_source_audit_id
      and a.prospect_id = p_prospect_id
  ) then
    raise exception 'source audit does not belong to prospect';
  end if;

  if p_findings is null or jsonb_typeof(p_findings) <> 'array' then
    raise exception 'findings must be a JSON array';
  end if;

  if jsonb_array_length(p_findings) > 5 then
    raise exception 'at most 5 website opportunity findings are allowed';
  end if;

  -- Validate types in stages. Do not call object/array functions on malformed JSON
  -- before their container type has been proven.
  if exists (
    select 1
    from jsonb_array_elements(p_findings) as item(f)
    where jsonb_typeof(f) <> 'object'
  ) then
    raise exception 'each finding must be a JSON object';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_findings) as item(f)
    where not (f ? 'key' and f ? 'title' and f ? 'evidence' and f ? 'business_impact' and f ? 'recommendation')
       or (f - 'key' - 'title' - 'evidence' - 'business_impact' - 'recommendation') <> '{}'::jsonb
       or jsonb_typeof(f -> 'key') <> 'string'
       or jsonb_typeof(f -> 'title') <> 'string'
       or jsonb_typeof(f -> 'evidence') <> 'array'
       or jsonb_typeof(f -> 'business_impact') <> 'string'
       or jsonb_typeof(f -> 'recommendation') <> 'string'
  ) then
    raise exception 'findings do not match the website opportunity shape';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_findings) as item(f)
    where coalesce(f ->> 'key', '') !~ '^[a-z0-9][a-z0-9_-]{0,62}$'
       or char_length(trim(coalesce(f ->> 'title', ''))) not between 1 and 160
       or jsonb_array_length(f -> 'evidence') not between 1 and 5
       or char_length(trim(coalesce(f ->> 'business_impact', ''))) not between 1 and 1000
       or char_length(trim(coalesce(f ->> 'recommendation', ''))) not between 1 and 1000
       or exists (
         select 1
         from jsonb_array_elements(f -> 'evidence') as evidence(value)
         where jsonb_typeof(value) <> 'string'
            or char_length(trim(coalesce(value #>> '{}', ''))) not between 1 and 700
       )
  ) then
    raise exception 'findings do not match the website opportunity contract';
  end if;

  if (
    select count(*) <> count(distinct f ->> 'key')
    from jsonb_array_elements(p_findings) as item(f)
  ) then
    raise exception 'finding keys must be unique';
  end if;

  update public.prospects p
  set qualification = coalesce(p.qualification, '{}'::jsonb)
        || jsonb_build_object(
          'website_opportunity',
          jsonb_build_object(
            'source_audit_id', p_source_audit_id::text,
            'findings', p_findings
          )
        ),
      updated_at = now()
  where p.id = p_prospect_id
  returning p.qualification -> 'website_opportunity' into v_result;

  insert into public.events(prospect_id, event_type, metadata, actor_user_id)
  values (
    p_prospect_id,
    'website_opportunity_reviewed',
    jsonb_build_object(
      'source_audit_id', p_source_audit_id::text,
      'finding_count', jsonb_array_length(p_findings)
    ),
    auth.uid()
  );

  return v_result;
end;
$$;

revoke all on function public.operator_set_website_opportunity(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.operator_set_website_opportunity(uuid, uuid, jsonb) to authenticated;
