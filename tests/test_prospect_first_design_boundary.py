from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class ProspectFirstDesignBoundaryTests(unittest.TestCase):
    def test_design_runtime_is_sector_independent(self) -> None:
        index = read("operator/index.html")
        process = read("operator/design-process.js")
        detail = read("operator/design-detail-ui.js")

        self.assertNotIn("Sectoronderzoek", index)
        self.assertNotIn("copySectorUpgrade", index)
        self.assertNotIn("sector-intelligence-ui.js", index)
        self.assertNotIn("sector-link-suggestions.js", index)
        self.assertIn("Kopieer designopdracht", index)
        self.assertIn("Designinstructie", index)

        for source in (process, detail):
            self.assertNotIn("Sector Intelligence", source)
            self.assertNotIn("sector-intelligence", source)
            self.assertNotIn("canonical_sector_key", source)
            self.assertNotIn("operator_set_prospect_sector", source)

        self.assertNotIn("discovery_run_id", process)
        self.assertIn("navigator.clipboard.writeText(`${START_URL}\\n${briefUrl}`)", process)

    def test_design_brief_contains_only_prospect_specific_context(self) -> None:
        process = read("operator/design-process.js")
        docs = read("docs/DESIGN_BRIEF.md")

        self.assertIn("Brief format version:** 0.4", process)
        self.assertIn("## Verified prospect facts", process)
        self.assertIn("## Verification gaps", process)
        self.assertIn("## Current website evidence", process)
        self.assertIn("## Current design state", process)
        self.assertIn("## Operator direction", process)
        self.assertNotIn("Canonical sector key", process)
        self.assertNotIn("Sector Intelligence", process)
        self.assertIn("prospect-specific", docs.lower())

    def test_bootstrap_has_no_sector_lookup_or_overlay_hook(self) -> None:
        bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        start = read("operator/start-design.html")

        self.assertIn("Prompt architecture version:** `0.4`", bootstrap)
        self.assertIn("Prompt architecture version: 0.4", start)
        self.assertNotIn("sector-intelligence", bootstrap.lower())
        self.assertNotIn("prompts/sectors", bootstrap)
        self.assertNotIn("Canonical sector key", bootstrap)
        self.assertIn("Design the actual prospect", bootstrap)

    def test_clean_chatgpt_handoff_uses_supplied_soliddesign_origin(self) -> None:
        bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        start = read("operator/start-design.html")
        combined = f"{bootstrap}\n{start}".lower()

        self.assertIn("SOLIDDESIGN_ORIGIN", bootstrap)
        self.assertIn("SOLIDDESIGN_ORIGIN", start)
        self.assertIn("/prompts/core/DESIGN_CONSTITUTION.md", bootstrap)
        self.assertIn("repository and infrastructure discovery are outside the normal design workflow", start)
        self.assertNotIn("soliddesign-cms.pages.dev", bootstrap)
        self.assertNotIn("github.com", combined)
        self.assertNotIn("raw.githubusercontent.com", combined)
        self.assertNotIn("supabase.co", combined)

    def test_sector_remains_only_a_discovery_concern_in_active_ui(self) -> None:
        discovery = read("operator/discovery-sectors.js")
        research = read("operator/research-discovery.js")
        index = read("operator/index.html")

        self.assertIn("SOLIDDESIGN_RESOLVE_SINGLE_SECTOR", discovery)
        self.assertIn("/api/resolve-sector", discovery)
        self.assertIn("canonical_sector_key", research)
        self.assertIn("<label>Sector", index)
        self.assertIn("Breed zoeken", index)
        self.assertIn("Gericht zoeken", index)

    def test_retired_sector_capabilities_are_absent(self) -> None:
        retired = [
            "operator/sector-intelligence-ui.js",
            "operator/sector-link-suggestions.js",
            "operator/functions/api/sector-intelligence.js",
            "sector-intelligence/README.md",
            "docs/SECTOR_INTELLIGENCE_LINKAGE.md",
            "prompts/sectors/README.md",
            "tests/test_cms_repository_boundary.py",
        ]
        for path in retired:
            self.assertFalse((ROOT / path).exists(), path)

        migration = read("supabase/migrations/20260909_retire_sector_linking_v01.sql")
        self.assertIn("drop function if exists public.operator_list_sector_link_targets()", migration)
        self.assertIn("drop function if exists public.operator_set_prospect_sector(uuid, text)", migration)

    def test_discovery_has_only_the_three_current_intake_paths(self) -> None:
        architecture = read("docs/INTEGRATED_OPERATING_ARCHITECTURE.md")
        costs = read("docs/DISCOVERY_COSTS.md")
        donor_register = read("docs/DONOR_REGISTER.md")

        self.assertFalse((ROOT / "src/soliddesign/discovery/google_places.py").exists())
        self.assertIn("RESEARCH IMPORT", architecture)
        self.assertIn("OVERTURE AREA SEARCH", architecture)
        self.assertIn("SPECIFIC URL", architecture)
        self.assertIn("There is no active Google Places discovery adapter", costs)
        self.assertIn("DEFER — NOT IN CURRENT RUNTIME", donor_register)

    def test_design_ui_uses_one_primary_chatgpt_action(self) -> None:
        index = read("operator/index.html")

        self.assertEqual(index.count('data-design-action="copyStart"'), 1)
        self.assertIn("Kopieer designopdracht", index)
        self.assertIn("Open designbrief", index)
        self.assertIn("Projectinstellingen", index)
        self.assertNotIn("Geen ChatGPT-project gekoppeld", index)
        self.assertNotIn("Designbrieflink", index)
        self.assertIn("Upload concept", index)
        self.assertIn("Gebruik externe conceptlink", index)


if __name__ == "__main__":
    unittest.main()
