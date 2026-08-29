from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EnvironmentIdentityTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_pr_preview_is_visibly_distinct_from_production(self):
        config = self.read("operator/config.js")
        indicator = self.read("operator/environment-indicator.js")
        auth_redirects = self.read("docs/AUTH_REDIRECTS.md")

        self.assertIn("import('./environment-indicator.js')", config)
        self.assertIn("pr-(\\d+)", indicator)
        self.assertIn("TEST · PR-", indicator)
        self.assertIn("document.title", indicator)
        self.assertIn("window.location.hostname", indicator)
        self.assertIn("Production must not display that marker", auth_redirects)
        self.assertIn("environment from which the operator presses", auth_redirects)


if __name__ == "__main__":
    unittest.main()
