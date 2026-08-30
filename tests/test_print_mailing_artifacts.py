from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PrintMailingArtifactContractTests(unittest.TestCase):
    def test_operator_module_is_valid_javascript(self):
        subprocess.run(
            ["node", "--check", str(ROOT / "operator" / "mailing-artifacts.js")],
            check=True,
            capture_output=True,
            text=True,
        )

    def test_operator_loads_single_mailing_module(self):
        config = (ROOT / "operator" / "config.js").read_text(encoding="utf-8")
        self.assertEqual(config.count("./mailing-artifacts.js"), 1)

    def test_design_and_outreach_share_one_artifact_model(self):
        js = (ROOT / "operator" / "mailing-artifacts.js").read_text(encoding="utf-8")
        self.assertIn("Upload nieuwe versie", js)
        self.assertIn("Registreer als verstuurd", js)
        self.assertIn("db.from('mailing_artifacts')", js)
        self.assertIn("db.from('mailings')", js)
        self.assertIn("createSignedUrl", js)
        self.assertIn("upsert: false", js)
        self.assertNotIn("attachments", js.lower())

    def test_database_contract_keeps_artifact_and_send_separate(self):
        migration = (
            ROOT / "supabase" / "migrations" / "20260830_print_mailing_artifacts_v01.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("create table if not exists public.mailing_artifacts", migration)
        self.assertIn("add column if not exists artifact_id", migration)
        self.assertIn("alter column artifact_id set not null", migration)
        self.assertIn("operator_register_mailing_artifact", migration)
        self.assertIn("operator_register_mailing_sent", migration)
        self.assertIn("status = 'LIVE'", migration)
        self.assertIn("bucket_id = 'mailing-artifacts'", migration)
        self.assertIn("public.operator_is_active_team_member()", migration)
        self.assertIn("'mailing_artifact_created'", migration)
        self.assertIn("'mailing_marked_sent'", migration)

    def test_decision_rejects_generic_document_management(self):
        decision = (
            ROOT / "docs" / "decisions" / "20260830_PRINT_MAILING_ARTIFACTS.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Design", decision)
        self.assertIn("Outreach", decision)
        self.assertIn("generic attachments table", decision)
        self.assertIn("same stored file", decision)


if __name__ == "__main__":
    unittest.main()
