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

    def test_design_process_javascript_is_valid(self) -> None:
        subprocess.run(
            ["node", "--check", str(ROOT / "operator/design-process.js")],
            check=True,
            capture_output=True,
            text=True,
        )

    def test_single_visible_design_lifecycle(self) -> None:
        operator = read("operator/index.html")

        self.assertIn("<h3>Ontwerpversies</h3>", operator)
        self.assertIn("Upload concept", operator)
        self.assertIn("<h4>Ontwerpversies</h4>", operator)
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

    def test_design_tab_has_one_primary_chatgpt_action(self) -> None:
        operator = read("operator/index.html")
        process = read("operator/design-process.js")

        self.assertEqual(operator.count('data-design-action="copyStart"'), 1)
        self.assertIn("Kopieer designopdracht", operator)
        self.assertIn("Designinstructie", operator)
        self.assertIn("Projectinstellingen", operator)
        self.assertIn("Open designbrief", operator)
        self.assertIn("Open ChatGPT-project ↗", process)
        self.assertIn("✓ Designopdracht gekopieerd", process)
        self.assertNotIn("copySectorUpgrade", operator)
        self.assertNotIn("Sectoronderzoek", operator)
        self.assertNotIn("Designbrieflink", operator)

    def test_design_is_not_coupled_to_sector_state(self) -> None:
        process = read("operator/design-process.js")
        detail_ui = read("operator/design-detail-ui.js")

        for source in (process, detail_ui):
            self.assertNotIn("canonical_sector_key", source)
            self.assertNotIn("sector-intelligence", source.lower())
            self.assertNotIn("operator_set_prospect_sector", source)

    def test_external_preview_is_secondary_progressive_disclosure(self) -> None:
        operator = read("operator/index.html")

        self.assertIn("<summary>Gebruik externe conceptlink</summary>", operator)
        self.assertIn('data-input="externalPreview"', operator)
        self.assertIn("Voeg concept toe", operator)

    def test_canonical_detail_module_is_wired_once(self) -> None:
        operator = read("operator/index.html")

        self.assertEqual(operator.count('src="./design-detail-ui.js"'), 1)
        self.assertNotIn('src="./design-ui-preview.js"', operator)
        self.assertNotIn('src="./sector-intelligence-ui.js"', operator)
        self.assertNotIn('src="./sector-link-suggestions.js"', operator)


if __name__ == "__main__":
    unittest.main()
