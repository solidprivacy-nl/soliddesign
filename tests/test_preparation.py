from __future__ import annotations

import tempfile
import unittest

from soliddesign.models import Prospect
from soliddesign.preparation import classify_site_kind, linkhub_audit, prepare_first_concept


class FirstConceptPreparationTests(unittest.TestCase):
    def prospect(self, website_url: str) -> Prospect:
        return Prospect(
            id="789ebbe5-8cc3-40b5-9d7d-619f9638df86",
            name="Voorbeeld Kapper",
            category="barber",
            city="Amsterdam",
            address="Dam 1, Amsterdam",
            website_url=website_url,
            phone="020 123 4567",
            discovery_source="overture",
        )

    def test_linkhub_is_not_treated_as_standalone_website(self):
        self.assertEqual(classify_site_kind("https://linktr.ee/example"), "LINKHUB")
        self.assertEqual(classify_site_kind("https://www.example.nl/"), "STANDALONE")

    def test_linkhub_audit_records_missing_standalone_site(self):
        audit = linkhub_audit(self.prospect("https://linktr.ee/example"))
        self.assertEqual(audit.source, "linkhub-presence")
        self.assertIsNone(audit.score)
        self.assertEqual(audit.findings[0].key, "no_standalone_website")

    def test_linkhub_can_build_baseline_without_pitch_doctor(self):
        prospect = self.prospect("https://linktr.ee/example")
        with tempfile.TemporaryDirectory() as tmp:
            result = prepare_first_concept(prospect, tmp)
        self.assertEqual(result["site_kind"], "LINKHUB")
        self.assertIn("<!doctype html>", result["preview_html"].lower())
        self.assertIn("geen zelfstandige website", result["technical_report_md"].lower())
        self.assertEqual(result["verified_facts"]["evidence"]["website"], "verified discovery URL; classified as linkhub, not a standalone prospect website")


if __name__ == "__main__":
    unittest.main()
