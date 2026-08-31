from pathlib import Path


def test_sector_intelligence_is_first_class_prospect_identity() -> None:
    design = Path("operator/design-process.js").read_text(encoding="utf-8")
    migration = Path("supabase/migrations/20260831_prospect_sector_identity_v01.sql").read_text(encoding="utf-8")

    assert "canonical_sector_key text" in migration
    assert "canonical_sector_key,discovery_run_id" in design
    assert "function canonicalSectorKey(prospect, discoveryRun)" in design
    assert "prospect?.canonical_sector_key" in design
    assert "canonicalSectorKey(prospect, discoveryRun)" in design


def test_sector_workspace_reuses_existing_research_flow() -> None:
    index = Path("operator/index.html").read_text(encoding="utf-8")
    ui = Path("operator/sector-intelligence-ui.js").read_text(encoding="utf-8")

    assert '<script src="./sector-intelligence-ui.js"></script>' in index
    assert "Sectoronderzoek" in ui
    assert "startSectorIntelligence" in ui
    assert "processSectorIntelligence" in ui
    assert "operator_list_sector_link_targets" in ui
    assert "operator_set_prospect_sector" in ui
    assert "/api/resolve-sector" in ui


def test_sector_research_keeps_human_term_separate_from_machine_key() -> None:
    ui = Path("operator/sector-intelligence-ui.js").read_text(encoding="utf-8")

    assert "researchTerm.value = row.canonical_sector_key" not in ui
    assert "linkTerm.value = row.canonical_sector_key" in ui
    assert "resetResearchTerm: true" in ui
    assert "menselijke marktterm" in ui


def test_sector_overview_reports_published_and_review_state() -> None:
    endpoint = Path("operator/functions/api/sector-intelligence.js").read_text(encoding="utf-8")

    assert "PUBLISHED" in endpoint
    assert "IN_REVIEW" in endpoint
    assert "UPDATE_IN_REVIEW" in endpoint
    assert "Sector Intelligence:" in endpoint


def test_single_sector_discovery_inherits_known_sector_identity() -> None:
    migration = Path("supabase/migrations/20260831_sector_identity_ingest_v02.sql").read_text(encoding="utf-8")

    assert "jsonb_array_length(r.input -> 'keywords') = 1" in migration
    assert "run_sector_key" in migration
    assert "coalesce(" in migration


def test_sector_link_rpc_is_not_anonymous_capability() -> None:
    migration = Path("supabase/migrations/20260831_sector_linking_security_v03.sql").read_text(encoding="utf-8")

    assert "from anon" in migration
    assert "operator_list_sector_link_targets" in migration
    assert "operator_set_prospect_sector" in migration
    assert "revoke update (canonical_sector_key)" in migration


def test_direct_url_is_not_silently_classified() -> None:
    discovery = Path("operator/discovery.js").read_text(encoding="utf-8")
    linkage = Path("docs/SECTOR_INTELLIGENCE_LINKAGE.md").read_text(encoding="utf-8")

    url_start = discovery.index("async function runUrlDiscovery")
    url_handler = discovery[url_start:]
    assert "canonical_sector_key" not in url_handler
    assert "does not guess" in linkage
