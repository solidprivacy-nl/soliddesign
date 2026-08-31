from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_sector_intelligence_is_first_class_prospect_identity() -> None:
    design = read("operator/design-process.js")
    migration = read("supabase/migrations/20260831_prospect_sector_identity_v01.sql")

    assert "canonical_sector_key text" in migration
    assert "canonical_sector_key,discovery_run_id" in design
    assert "function canonicalSectorKey(prospect, discoveryRun)" in design
    assert "prospect?.canonical_sector_key" in design
    assert "canonicalSectorKey(prospect, discoveryRun)" in design


def test_sector_workspace_is_self_contained_and_reuses_only_resolution() -> None:
    index = read("operator/index.html")
    ui = read("operator/sector-intelligence-ui.js")
    resolver = read("operator/discovery-sectors.js")

    assert '<script src="./sector-intelligence-ui.js"></script>' in index
    assert "SOLIDDESIGN_RESOLVE_SINGLE_SECTOR" in resolver
    assert "SOLIDDESIGN_RESOLVE_SINGLE_SECTOR" in ui
    assert "sectorIntelligencePrompt" in ui
    assert "sectorResearchGuidance" in ui
    assert "startSectorIntelligence" in ui
    assert "processSectorIntelligence" in ui
    assert "operator_list_sector_link_targets" in ui
    assert "operator_set_prospect_sector" in ui

    assert "sectorIntelligencePrompt" not in resolver
    assert "installSectorIntelligenceLauncher" not in resolver
    assert "discoverySnapshot" not in ui
    assert "syncResearchToLegacyInputs" not in ui
    assert "installExistingResearchControls" not in ui


def test_sector_server_facade_uses_current_membership_and_hides_transport() -> None:
    endpoint = read("operator/functions/api/sector-intelligence.js")

    assert "operator_is_active_team_member" in endpoint
    assert "operator_allowlist" not in endpoint
    assert not (ROOT / "operator/functions/api/publish-sector-intelligence.js").exists()

    assert "AVAILABLE" in endpoint
    assert "PENDING_REVIEW" in endpoint
    assert "UPDATE_PENDING_REVIEW" in endpoint
    assert "source_url" not in endpoint
    assert "review_url" not in endpoint


def test_sector_review_is_cms_native() -> None:
    ui = read("operator/sector-intelligence-ui.js")
    endpoint = read("operator/functions/api/sector-intelligence.js")

    assert "Beoordelen" in ui
    assert "Publiceer" in ui
    assert "Afwijzen" in ui
    assert "action: 'approve'" in ui
    assert "action: 'reject'" in ui
    assert "action === 'approve'" in endpoint
    assert "action === 'reject'" in endpoint

    # Provider mechanics are server-only. They must never become browser UI concepts.
    assert "github.com" not in ui.lower()
    assert "api.github.com" not in ui.lower()
    assert "source_url" not in ui
    assert "review_url" not in ui


def test_operator_guidance_is_optional_challengeable_input() -> None:
    ui = read("operator/sector-intelligence-ui.js")
    contract = read("sector-intelligence/README.md")

    assert "Aanvullende onderzoeksrichting" in ui
    assert "Behandel deze input als een hypothese" in ui
    assert "mag het brede autonome onderzoek niet vervangen of vernauwen" in ui
    assert "challengeable" in contract
    assert "reference library" in contract.lower()


def test_single_sector_discovery_inherits_known_sector_identity() -> None:
    migration = read("supabase/migrations/20260831_sector_identity_ingest_v02.sql")

    assert "jsonb_array_length(r.input -> 'keywords') = 1" in migration
    assert "run_sector_key" in migration
    assert "coalesce(" in migration


def test_sector_link_rpc_is_not_anonymous_capability() -> None:
    migration = read("supabase/migrations/20260831_sector_linking_security_v03.sql")
    rpc = read("supabase/migrations/20260831_sector_linking_rpc_v01.sql")

    assert "from anon" in migration
    assert "operator_list_sector_link_targets" in migration
    assert "operator_set_prospect_sector" in migration
    assert "revoke update (canonical_sector_key)" in migration
    assert "operator_assert_allowed()" in rpc


def test_direct_url_is_not_silently_classified_but_remains_linkable() -> None:
    discovery = read("operator/discovery.js")
    linkage = read("docs/SECTOR_INTELLIGENCE_LINKAGE.md")
    ui = read("operator/sector-intelligence-ui.js")

    url_start = discovery.index("async function runUrlDiscovery")
    url_handler = discovery[url_start:]
    assert "canonical_sector_key" not in url_handler
    assert "URL alone is insufficient evidence" in linkage
    assert "via een losse URL" in ui
    assert "operator_set_prospect_sector" in ui


def test_current_sector_contract_is_v05_and_operator_facing() -> None:
    contract = read("sector-intelligence/README.md")
    linkage = read("docs/SECTOR_INTELLIGENCE_LINKAGE.md")

    assert "canonical v0.5" in contract
    assert "architecture v0.5" in linkage
    assert "No engineering-infrastructure exposure in the CMS" in contract
    assert "operator_is_active_team_member()" in contract
