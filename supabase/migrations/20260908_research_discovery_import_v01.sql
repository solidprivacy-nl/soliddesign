-- Add the one new discovery-run business action required by research CSV intake.
-- CSV itself is transport; IMPORT is the durable run type.

alter table public.discovery_runs
  drop constraint if exists discovery_runs_run_type_check;

alter table public.discovery_runs
  add constraint discovery_runs_run_type_check
  check (run_type in ('AREA','URL','IMPORT'));
