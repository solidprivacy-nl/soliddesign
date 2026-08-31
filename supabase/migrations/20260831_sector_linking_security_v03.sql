-- Keep sector mutation behind the operator RPC capability only.
-- Supabase can retain explicit anon EXECUTE grants even after revoking PUBLIC,
-- so revoke both explicitly.

revoke update (canonical_sector_key) on table public.prospects from authenticated;

revoke all on function public.operator_list_sector_link_targets() from public;
revoke all on function public.operator_list_sector_link_targets() from anon;
revoke all on function public.operator_set_prospect_sector(uuid,text) from public;
revoke all on function public.operator_set_prospect_sector(uuid,text) from anon;

grant execute on function public.operator_list_sector_link_targets() to authenticated;
grant execute on function public.operator_set_prospect_sector(uuid,text) to authenticated;
