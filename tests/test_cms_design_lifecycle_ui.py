import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class CmsDesignLifecycleUiTests(unittest.TestCase):
    def test_detail_ui_javascript_is_valid(self) -> None:
        subprocess.run(
            ["node", "--check", str(ROOT / "operator/design-detail-ui.js")],
            check=True,
            capture_output=True,
            text=True,
        )

    def test_sector_link_suggestions_javascript_is_valid(self) -> None:
        subprocess.run(
            ["node", "--check", str(ROOT / "operator/sector-link-suggestions.js")],
            check=True,
            capture_output=True,
            text=True,
        )

    def test_single_visible_design_lifecycle(self) -> None:
        operator = read("operator/index.html")

        self.assertIn("<h3>Ontwerpversies</h3>", operator)
        self.assertIn("Dit is de enige plek voor de ontwerpstatus.", operator)
        self.assertIn("<h4>Alle ontwerpversies</h4>", operator)
        self.assertIn("<span>Ontwerpstatus</span>", operator)
        self.assertNotIn(">Live mock-up ↗</a>", operator)
        self.assertNotIn("<h3>Mock-up versies</h3>", operator)
        self.assertIn('data-field="liveMockup" class="mockup-live hidden"', operator)

    def test_newest_design_is_a_convenience_link_not_live_state(self) -> None:
        operator = read("operator/index.html")
        detail_ui = read("operator/design-detail-ui.js")

        self.assertIn("Nieuwste ontwerp ↗", operator)
        self.assertIn(".order('created_at', { ascending: false })", detail_ui)
        self.assertIn("Nieuwste ontwerp ↗", detail_ui)
        self.assertIn("Meest recente ontwerpversie", detail_ui)

    def test_sector_for_design_is_optional_and_uses_published_research(self) -> None:
        detail_ui = read("operator/design-detail-ui.js")
        sector_ui = read("operator/sector-intelligence-ui.js")

        self.assertIn("Sector voor design ", detail_ui)
        self.assertIn("(optioneel aanpassen)", detail_ui)
        self.assertIn(".filter((row) => row?.has_published)", detail_ui)
        self.assertIn("operator_set_prospect_sector", detail_ui)
        self.assertNotIn("bindCurrentProspectSector", sector_ui)
        self.assertIn("soliddesign:sector-intelligence-changed", sector_ui)

    def test_sector_linking_supports_known_sector_dropdown_and_free_text(self) -> None:
        operator = read("operator/index.html")
        suggestions = read("operator/sector-link-suggestions.js")
        sector_ui = read("operator/sector-intelligence-ui.js")

        self.assertEqual(operator.count('src="./sector-link-suggestions.js"'), 1)
        self.assertIn("document.createElement('datalist')", suggestions)
        self.assertIn("sectorLinkOptions", suggestions)
        self.assertIn("Kies een bekende sector of typ een nieuwe", suggestions)
        self.assertIn("/api/sector-intelligence", suggestions)
        self.assertIn("row.research_label", suggestions)
        self.assertIn("input.dataset.canonicalKey = row.canonical_sector_key", suggestions)
        self.assertNotIn("operator_set_prospect_sector", suggestions)
        self.assertIn("operator_set_prospect_sector", sector_ui)

    def test_canonical_detail_module_is_wired_once(self) -> None:
        operator = read("operator/index.html")

        self.assertEqual(operator.count('src="./design-detail-ui.js"'), 1)
        self.assertNotIn('src="./design-ui-preview.js"', operator)


if __name__ == "__main__":
    unittest.main()
