import json
import tempfile
import unittest
from pathlib import Path

from soliddesign.audit.adapter import audit_result_from_dict
from soliddesign.audit.report import render_technical_report_html, render_technical_report_markdown
from soliddesign.pipeline import prospect_from_dict, qualification_input_from_dict, run_golden_fixture
from soliddesign.qualification import qualify


class TechnicalAuditReportTests(unittest.TestCase):
    def setUp(self):
        self.fixture = Path(__file__).parent / "fixtures" / "golden"
        self.prospect = prospect_from_dict(json.loads((self.fixture / "prospect.json").read_text(encoding="utf-8")))
        self.raw = json.loads((self.fixture / "audit.json").read_text(encoding="utf-8"))
        self.audit = audit_result_from_dict(self.raw)
        q_input = qualification_input_from_dict(json.loads((self.fixture / "score.json").read_text(encoding="utf-8")))
        self.qualification = qualify(q_input)

    def test_report_contains_reviewed_findings_raw_appendix_and_scores(self):
        report = render_technical_report_markdown(
            self.prospect,
            self.audit,
            self.qualification,
            raw_audit=self.raw,
        )
        self.assertIn("Technische auditscore: 58/100", report)
        self.assertIn("Kwalificatiescore: 20/25", report)
        self.assertIn("Reviewed technische bevindingen", report)
        self.assertIn("Raw checks: 4", report)
        self.assertIn("SSL / HTTPS", report)
        self.assertIn("geen automatische prospect-facing claim", report)

    def test_html_wrapper_is_printable_and_noindex(self):
        report = render_technical_report_markdown(self.prospect, self.audit, self.qualification, raw_audit=self.raw)
        page = render_technical_report_html(report, title="Technisch rapport")
        self.assertIn("noindex,nofollow,noarchive", page)
        self.assertIn("@media print", page)
        self.assertIn("Technische auditscore", page)

    def test_golden_pipeline_emits_technical_report_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_golden_fixture(self.fixture, tmp)
            out = Path(tmp)
            self.assertTrue((out / "technical_report.md").exists())
            self.assertTrue((out / "technical_report.html").exists())
            self.assertIn("Raw checks: 4", (out / "technical_report.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
