from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_design_runtime_is_sector_independent() -> None:
    index = read("operator/index.html")
    process = read("operator/design-process.js")
    detail = read("operator/design-detail-ui.js")

    assert "Sectoronderzoek" not in index
    assert "copySectorUpgrade" not in index
    assert "sector-intelligence-ui.js" not in index
    assert "sector-link-suggestions.js" not in index
    assert "Kopieer designopdracht" in index
    assert "Designinstructie" in index

    for source in (process, detail):
        assert "Sector Intelligence" not in source
        assert "sector-intelligence" not in source
        assert "canonical_sector_key" not in source
        assert "operator_set_prospect_sector" not in source

    assert "discovery_run_id" not in process
    assert "Kopieer designopdracht" in index
    assert "navigator.clipboard.writeText(`${START_URL}\\n${briefUrl}`)" in process


def test_design_brief_contains_only_prospect_specific_context() -> None:
    process = read("operator/design-process.js")
    docs = read("docs/DESIGN_BRIEF.md")

    assert "Brief format version:** 0.4" in process
    assert "## Verified prospect facts" in process
    assert "## Verification gaps" in process
    assert "## Current website evidence" in process
    assert "## Current design state" in process
    assert "## Operator direction" in process
    assert "Canonical sector key" not in process
    assert "Sector Intelligence" not in process
    assert "prospect-specific" in docs.lower()


def test_bootstrap_has_no_sector_lookup_or_overlay_hook() -> None:
    bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
    start = read("operator/start-design.html")

    assert "Prompt architecture version:** `0.4`" in bootstrap
    assert "Prompt architecture version: 0.4" in start
    assert "sector-intelligence" not in bootstrap.lower()
    assert "prompts/sectors" not in bootstrap
    assert "Canonical sector key" not in bootstrap
    assert "Design the actual prospect" in bootstrap


def test_clean_chatgpt_handoff_uses_the_supplied_soliddesign_origin() -> None:
    bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
    start = read("operator/start-design.html")
    combined = f"{bootstrap}\n{start}".lower()

    assert "SOLIDDESIGN_ORIGIN" in bootstrap
    assert "SOLIDDESIGN_ORIGIN" in start
    assert "/prompts/core/DESIGN_CONSTITUTION.md" in bootstrap
    assert "repository and infrastructure discovery are outside the normal design workflow" in start
    assert "soliddesign-cms.pages.dev" not in bootstrap
    assert "github.com" not in combined
    assert "raw.githubusercontent.com" not in combined
    assert "supabase.co" not in combined


def test_sector_remains_only_a_discovery_concern_in_active_ui() -> None:
    discovery = read("operator/discovery-sectors.js")
    research = read("operator/research-discovery.js")
    index = read("operator/index.html")

    assert "SOLIDDESIGN_RESOLVE_SINGLE_SECTOR" in discovery
    assert "/api/resolve-sector" in discovery
    assert "canonical_sector_key" in research
    assert "<label>Sector" in index
    assert "Breed zoeken" in index
    assert "Gericht zoeken" in index


def test_retired_sector_capabilities_are_absent() -> None:
    retired = [
        "operator/sector-intelligence-ui.js",
        "operator/sector-link-suggestions.js",
        "operator/functions/api/sector-intelligence.js",
        "sector-intelligence/README.md",
        "docs/SECTOR_INTELLIGENCE_LINKAGE.md",
        "prompts/sectors/README.md",
    ]
    for path in retired:
        assert not (ROOT / path).exists(), path

    migration = read("supabase/migrations/20260909_retire_sector_linking_v01.sql")
    assert "drop function if exists public.operator_list_sector_link_targets()" in migration
    assert "drop function if exists public.operator_set_prospect_sector(uuid, text)" in migration


def test_design_ui_uses_one_primary_chatgpt_action() -> None:
    index = read("operator/index.html")

    assert index.count('data-design-action="copyStart"') == 1
    assert "Kopieer designopdracht" in index
    assert "Open designbrief" in index
    assert "Projectinstellingen" in index
    assert "Geen ChatGPT-project gekoppeld" not in index
    assert "Designbrieflink" not in index
    assert "Upload concept" in index
    assert "Gebruik externe conceptlink" in index
