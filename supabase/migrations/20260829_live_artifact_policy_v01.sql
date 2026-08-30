-- Branded/public LIVE delivery must be backed by a stored artifact.
-- Existing legacy LIVE rows are grandfathered until migrated; they may remain LIVE,
-- but a DRAFT/ARCHIVED external URL can no longer transition to LIVE.

create or replace function public.guard_new_live_requires_artifact()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'LIVE'
     and new.artifact_path is null
     and (tg_op = 'INSERT' or old.status is distinct from 'LIVE') then
    raise exception 'A new LIVE mock-up requires a stored artifact. External URLs are preview-only.';
  end if;
  return new;
end;
$$;

drop trigger if exists demos_guard_new_live_requires_artifact on public.demos;
create trigger demos_guard_new_live_requires_artifact
before insert or update of status on public.demos
for each row execute function public.guard_new_live_requires_artifact();

revoke all on function public.guard_new_live_requires_artifact() from public, anon, authenticated;
