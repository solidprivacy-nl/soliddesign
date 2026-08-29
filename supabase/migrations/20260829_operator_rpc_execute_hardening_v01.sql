-- Existing operator RPCs are authenticated application capabilities.
-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default, so revoke that default explicitly.

revoke all on function public.operator_assert_allowed() from public, anon, authenticated;

revoke all on function public.operator_list_archived_prospects() from public, anon;
revoke all on function public.operator_list_discovery_candidates() from public, anon;
revoke all on function public.operator_archive_prospect(uuid) from public, anon;
revoke all on function public.operator_restore_prospect(uuid) from public, anon;
revoke all on function public.operator_delete_prospect(uuid) from public, anon;
revoke all on function public.operator_set_discovery_state(uuid,text) from public, anon;
revoke all on function public.operator_ingest_discovery_candidates(uuid,jsonb) from public, anon;
revoke all on function public.operator_set_discovery_triage(uuid,jsonb,text) from public, anon;
revoke all on function public.operator_promote_discovery_candidate(uuid) from public, anon;
revoke all on function public.operator_queue_first_concept(uuid,text) from public, anon;

grant execute on function public.operator_list_archived_prospects() to authenticated;
grant execute on function public.operator_list_discovery_candidates() to authenticated;
grant execute on function public.operator_archive_prospect(uuid) to authenticated;
grant execute on function public.operator_restore_prospect(uuid) to authenticated;
grant execute on function public.operator_delete_prospect(uuid) to authenticated;
grant execute on function public.operator_set_discovery_state(uuid,text) to authenticated;
grant execute on function public.operator_ingest_discovery_candidates(uuid,jsonb) to authenticated;
grant execute on function public.operator_set_discovery_triage(uuid,jsonb,text) to authenticated;
grant execute on function public.operator_promote_discovery_candidate(uuid) to authenticated;
grant execute on function public.operator_queue_first_concept(uuid,text) to authenticated;
