from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PreviewPublicOriginTests(unittest.TestCase):
    def test_pr_preview_prospect_links_stay_on_the_pr_origin(self):
        source = (ROOT / "operator/prospect-link.js").read_text(encoding="utf-8")
        self.assertIn("PR_PREVIEW_HOST_RE", source)
        self.assertIn("return window.location.origin", source)
        self.assertIn("CONFIG?.publicProspectOrigin", source)
        self.assertNotIn("window.location.hostname =", source)


if __name__ == "__main__":
    unittest.main()
