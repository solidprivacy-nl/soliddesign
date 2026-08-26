-- Keep the normalized website dedupe key correct for every write path.
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
