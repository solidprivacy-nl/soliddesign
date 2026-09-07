from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MockupPreviewDeliveryTests(unittest.TestCase):
    def test_supabase_preview_gateway_redirects_html_delivery_to_pages(self) -> None:
        source = (ROOT / "supabase/functions/mockup-preview/index.ts").read_text(encoding="utf-8")

        self.assertIn("PAGES_PREVIEW_ORIGIN = 'https://soliddesign-cms.pages.dev'", source)
        self.assertIn("/p/${encodeURIComponent(prospectId)}/v/${encodeURIComponent(demoId)}", source)
        self.assertIn("status: 302", source)
        self.assertNotIn("MIME_TYPES", source)
        self.assertNotIn("fetchStorage", source)
        self.assertNotIn("/storage/v1/object/public/", source)

    def test_pages_preview_route_owns_renderable_html_delivery(self) -> None:
        source = (ROOT / "operator/functions/p/[[path]].js").read_text(encoding="utf-8")

        self.assertIn("html: 'text/html; charset=utf-8'", source)
        self.assertIn("headers.set('Content-Disposition', 'inline')", source)
        self.assertIn("// Immutable version preview: /p/<prospect>/v/<demo>/...", source)


if __name__ == "__main__":
    unittest.main()
