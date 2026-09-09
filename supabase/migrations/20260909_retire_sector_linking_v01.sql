-- Prospect-first design cutover.
-- Sector remains discovery/provenance metadata; operators no longer link sectors to prospects for design.

drop function if exists public.operator_list_sector_link_targets();
drop function if exists public.operator_set_prospect_sector(uuid, text);
