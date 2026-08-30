-- Cheap FK hardening for account cleanup / creator lookups.
create index if not exists mailing_artifacts_created_by_idx
  on public.mailing_artifacts(created_by)
  where created_by is not null;
