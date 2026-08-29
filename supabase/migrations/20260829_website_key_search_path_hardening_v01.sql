-- Keep this immutable helper independent from a caller-controlled search_path.
-- All referenced functions are PostgreSQL built-ins in pg_catalog.
alter function public.website_key_from_url(text)
  set search_path = pg_catalog;
