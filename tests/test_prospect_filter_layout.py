from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ProspectFilterLayoutTests(unittest.TestCase):
    def test_layout_is_css_owned_and_column_bounded(self):
        script = (ROOT / "operator/prospect-work-filter.js").read_text(encoding="utf-8")
        css = (ROOT / "operator/prospect-work-filter.css").read_text(encoding="utf-8")

        self.assertIn("prospect-work-filter.css", script)
        self.assertNotIn("filters.style.gridTemplateColumns", script)
        self.assertIn("#activeProspectPane .filters", css)
        self.assertIn("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)", css)
        self.assertIn("#activeProspectPane #searchInput", css)
        self.assertIn("grid-column: 1 / -1", css)
        self.assertIn("min-width: 0", css)
        self.assertIn("max-width: 100%", css)


if __name__ == "__main__":
    unittest.main()
