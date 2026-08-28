-- Queue one bounded first-concept preparation run without adding a second job/state table.
-- The one-time token hash lives inside the existing qualification JSON and expires quickly.

create or replace function public.operator_queue_first_concept(
  p_id uuid,
  p_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed integer;
begin
  perform public.operator_assert_allowed();

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid preparation token hash';
  end if;

  update public.prospects p
  set qualification = jsonb_set(
        jsonb_set(
          coalesce(p.qualification, '{}'::jsonb),
          '{stage}',
          '"first_concept_queued"'::jsonb,
          true
        ),
        '{preparation}',
        jsonb_build_object(
          'status', 'QUEUED',
          'token_hash', p_token_hash,
          'queued_at', now(),
          'expires_at', now() + interval '30 minutes'
        ),
        true
      ),
      updated_at = now()
  where p.id = p_id
    and p.archived_at is null
    and p.state not in ('DISCOVERED', 'DISQUALIFIED');

  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on function public.operator_queue_first_concept(uuid,text) from public;
grant execute on function public.operator_queue_first_concept(uuid,text) to authenticated;
