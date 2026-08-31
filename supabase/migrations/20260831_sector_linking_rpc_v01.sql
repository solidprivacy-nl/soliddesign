-- Small operator API for linking any non-archived prospect/candidate to a canonical sector.
-- This keeps discovery provenance and sector identity independent.

create or replace function public.operator_list_sector_link_targets()
returns table (
  id uuid,
  name text,
  website_url text,
  city text,
  state text,
  canonical_sector_key text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.operator_assert_allowed();
  return query
  select p.id,p.name,p.website_url,p.city,p.state,p.canonical_sector_key
  from public.prospects p
  where p.archived_at is null
  order by lower(p.name), p.created_at desc;
end;
$$;

create or replace function public.operator_set_prospect_sector(p_id uuid, p_sector_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare clean_key text;
declare changed integer;
begin
  perform public.operator_assert_allowed();
  clean_key := lower(trim(coalesce(p_sector_key, '')));
  if clean_key !~ '^[a-z0-9][a-z0-9_-]{0,62}$' then
    raise exception 'invalid canonical sector key';
  end if;

  update public.prospects
  set canonical_sector_key = clean_key,
      updated_at = now()
  where id = p_id and archived_at is null;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.operator_list_sector_link_targets() from public;
revoke all on function public.operator_set_prospect_sector(uuid,text) from public;
grant execute on function public.operator_list_sector_link_targets() to authenticated;
grant execute on function public.operator_set_prospect_sector(uuid,text) to authenticated;
