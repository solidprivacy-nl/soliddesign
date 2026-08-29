from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class TeamIdentityLifecycleTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_team_identity_uses_display_name_and_derived_initials(self):
        config = self.read("operator/config.js")
        identity = self.read("operator/team-identity.js")
        architecture = self.read("docs/INTEGRATED_OPERATING_ARCHITECTURE.md")

        self.assertIn("team-identity.js", config)
        self.assertIn("function initials", identity)
        self.assertIn("member-avatar", identity)
        self.assertIn("display_name", identity)
        self.assertIn("display_name` is the canonical human-readable identity", architecture)
        self.assertNotIn("avatar_url", identity)

    def test_display_name_change_is_admin_only_and_actor_aware(self):
        migration = self.read("supabase/migrations/20260829_team_identity_and_safe_delete_v01.sql")
        self.assertIn("operator_update_team_display_name", migration)
        self.assertIn("caller_role <> 'ADMIN'", migration)
        self.assertIn("user_display_name_changed", migration)
        self.assertIn("actor_user_id", migration)

    def test_permanent_delete_is_server_side_and_history_guarded(self):
        migration = self.read("supabase/migrations/20260829_team_identity_and_safe_delete_v01.sql")
        edge = self.read("supabase/functions/team-member-admin/index.ts")
        identity = self.read("operator/team-identity.js")
        security = self.read("docs/SECURITY.md")

        self.assertIn("on delete cascade", migration.lower())
        self.assertIn("caller.role !== 'ADMIN'", edge)
        self.assertIn("prospect_assignments", edge)
        self.assertIn("prospect_id", edge)
        self.assertIn("deleteUser", edge)
        self.assertIn("user_deleted", edge)
        self.assertIn("team-member-admin", identity)
        self.assertIn("Deze gebruiker heeft dossierhistorie", edge)
        self.assertIn("A member with dossier/business history must be deactivated", security)

    def test_delete_cannot_remove_self_or_last_active_admin(self):
        edge = self.read("supabase/functions/team-member-admin/index.ts")
        self.assertIn("targetUserId === callerId", edge)
        self.assertIn("activeAdminCount", edge)
        self.assertIn("minimaal één actieve Admin", edge)


if __name__ == "__main__":
    unittest.main()
