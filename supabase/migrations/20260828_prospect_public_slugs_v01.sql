-- Stable human-readable prospect URLs for public live mock-ups.
-- The slug belongs to the prospect, not a demo version, so the public URL survives LIVE version changes.

create extension if not exists unaccent with schema extensions;

alter table public.prospects add column if not exists public_slug text;

comment on column public.prospects.public_slug is
  'Stable human-readable route key for the prospect public live mock-up; version-independent and safe to communicate externally.';

create or replace function public.prospect_slug_base(value text)
returns text
language sql
stable
strict
set search_path = ''
as $$
  select nullif(
    trim(both '-' from left(
      regexp_replace(
        lower(extensions.unaccent(trim(value))),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      48
    )),
    ''
  );
$$;

create or replace function public.prospect_available_slug(p_id uuid, p_name text, p_city text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text := coalesce(public.prospect_slug_base(p_name), 'prospect');
  city_base text := public.prospect_slug_base(p_city);
  candidate text;
begin
  if base in ('api', 'brief', 'p', 'start-design') then
    base := left(base, 40) || '-bedrijf';
  end if;

  candidate := base;
  if not exists (
    select 1 from public.prospects p
    where p.public_slug = candidate
      and p.id is distinct from p_id
  ) then
    return candidate;
  end if;

  if city_base is not null then
    candidate := left(base, 48) || '-' || left(city_base, 12);
    if not exists (
      select 1 from public.prospects p
      where p.public_slug = candidate
        and p.id is distinct from p_id
    ) then
      return candidate;
    end if;
  end if;

  return left(base, 48) || '-' || left(replace(p_id::text, '-', ''), 8);
end;
$$;

create or replace function public.set_prospect_public_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.public_slug is null or trim(new.public_slug) = '' then
    new.public_slug := public.prospect_available_slug(new.id, new.name, new.city);
  else
    new.public_slug := lower(trim(new.public_slug));
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_set_public_slug on public.prospects;
create trigger prospects_set_public_slug
before insert on public.prospects
for each row execute function public.set_prospect_public_slug();

update public.prospects p
set public_slug = public.prospect_available_slug(p.id, p.name, p.city)
where p.public_slug is null or trim(p.public_slug) = '';

alter table public.prospects
  drop constraint if exists prospects_public_slug_format;
alter table public.prospects
  add constraint prospects_public_slug_format check (
    char_length(public_slug) between 1 and 63
    and public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and public_slug not in ('api', 'brief', 'p', 'start-design')
  );
alter table public.prospects alter column public_slug set not null;

create unique index if not exists prospects_public_slug_uidx
  on public.prospects(public_slug);

-- Operators may rename the short public route; the existing operator UPDATE RLS policy remains the authorization boundary.
grant update (public_slug) on table public.prospects to authenticated;

-- Public route resolution is deliberately narrow: anon can only read id + slug, and RLS only exposes
-- the row whose slug exactly matches the custom request header supplied by the Pages resolver.
grant select (id, public_slug) on table public.prospects to anon;

drop policy if exists public_resolve_prospect_slug on public.prospects;
create policy public_resolve_prospect_slug on public.prospects
  for select to anon
  using (
    public_slug = lower(coalesce(
      (
        coalesce(
          nullif(current_setting('request.headers', true), ''),
          '{}'
        )::jsonb ->> 'x-soliddesign-prospect-slug'
      ),
      ''
    ))
  );

revoke execute on function public.prospect_slug_base(text) from public, anon, authenticated;
revoke execute on function public.prospect_available_slug(uuid,text,text) from public, anon, authenticated;
revoke execute on function public.set_prospect_public_slug() from public, anon, authenticated;
