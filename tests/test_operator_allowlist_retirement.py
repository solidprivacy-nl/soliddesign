from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class OperatorAllowlistRetirementTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_browser_bootstrap_uses_active_team_membership(self):
        app = self.read("operator/app.js")
        self.assertIn(".from('team_members')", app)
        self.assertIn(".eq('user_id', userId)", app)
        self.assertIn(".eq('active', true)", app)
        self.assertNotIn(".from('operator_allowlist')", app)

    def test_first_concept_endpoint_uses_canonical_membership_predicate(self):
        endpoint = self.read("operator/functions/api/prepare-prospect.js")
        self.assertIn("operator_is_active_team_member", endpoint)
        self.assertNotIn("operator_allowlist", endpoint)

    def test_sector_intelligence_uses_canonical_membership_predicate(self):
        endpoint = self.read("operator/functions/api/sector-intelligence.js")
        self.assertIn("operator_is_active_team_member", endpoint)
        self.assertNotIn("operator_allowlist", endpoint)
        self.assertFalse((ROOT / "operator/functions/api/publish-sector-intelligence.js").exists())

    def test_current_contract_docs_do_not_restore_transitional_allowlist(self):
        current_docs = [
            self.read("README.md"),
            self.read("docs/ARCHITECTURE.md"),
            self.read("docs/SECURITY.md"),
            self.read("docs/INTEGRATED_OPERATING_ARCHITECTURE.md"),
            self.read("sector-intelligence/README.md"),
            self.read("docs/SECTOR_INTELLIGENCE_LINKAGE.md"),
        ]
        combined = "\n".join(current_docs).lower()
        self.assertNotIn("operator_allowlist remains", combined)
        self.assertNotIn("allowlist remains", combined)
        self.assertIn("retired", combined)

    def test_retirement_migration_removes_sync_and_table(self):
        migration = self.read("supabase/migrations/20260830_operator_allowlist_retirement_v01.sql")
        self.assertIn("operator_deactivate_team_member", migration)
        self.assertIn("operator_reactivate_team_member", migration)
        self.assertNotIn("update public.operator_allowlist", migration.lower())
        self.assertNotIn("insert into public.operator_allowlist", migration.lower())
        self.assertIn("drop table if exists public.operator_allowlist", migration.lower())


if __name__ == "__main__":
    unittest.main()
