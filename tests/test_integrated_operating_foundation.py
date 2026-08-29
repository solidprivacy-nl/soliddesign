from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class IntegratedOperatingFoundationTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_required_runtime_and_schema_files_exist(self):
        required = [
            "operator/invite-setup.js",
            "operator/team-work.js",
            "operator/team-work.css",
            "operator/dossier-tabs.js",
            "operator/dossier-tabs.css",
            "operator/engagement-ui.js",
            "operator/engagement-ui.css",
            "operator/prospect-engagement.js",
            "operator/prospect-work-filter.js",
            "operator/mockup-policy.js",
            "supabase/README.md",
            "docs/AUTH_REDIRECTS.md",
            "supabase/functions/team-invite/index.ts",
            "supabase/functions/team-member-admin/index.ts",
            "supabase/functions/prospect-engagement/index.ts",
            "supabase/migrations/20260829_team_membership_workflow_v01.sql",
            "supabase/migrations/20260829_activity_timeline_v01.sql",
            "supabase/migrations/20260829_actor_audit_triggers_v01.sql",
            "supabase/migrations/20260829_prospect_engagement_v01.sql",
            "supabase/migrations/20260829_membership_engagement_correctness_v02.sql",
            "supabase/migrations/20260829_live_artifact_policy_v01.sql",
            "supabase/migrations/20260829_website_key_search_path_hardening_v01.sql",
            "supabase/migrations/20260829_team_identity_and_safe_delete_v01.sql",
        ]
        for relative_path in required:
            with self.subTest(relative_path=relative_path):
                self.assertTrue((ROOT / relative_path).is_file())

    def test_domain_identity_is_configuration_not_business_identity(self):
        config = self.read("operator/config.js")
        decision = self.read("docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md")
        self.assertIn("publicProspectOrigin", config)
        self.assertIn("publicProspectPathPrefix", config)
        self.assertIn('publicProspectPathPrefix: "/prospect"', config)
        self.assertIn("cms.<brand>.nl", decision)
        self.assertIn("<brand>.nl/<public_slug>", decision)
        self.assertIn("hostname routing boundary", decision)

    def test_invite_activation_cannot_mark_joined_before_password_setup(self):
        migration = self.read("supabase/migrations/20260829_membership_engagement_correctness_v02.sql")
        setup = self.read("operator/invite-setup.js")
        invite = self.read("supabase/functions/team-invite/index.ts")
        team_work = self.read("operator/team-work.js")
        config = self.read("operator/config.js")
        self.assertIn("solidDesignMustSetPassword", migration)
        self.assertIn("raw_user_meta_data", migration)
        self.assertIn("operator_mark_joined", setup)
        self.assertIn("joinedError", setup)
        self.assertNotIn("operator_mark_joined", team_work)
        self.assertIn("import('./team-work.js')", config)
        self.assertIn("Mijn werk", team_work)
        self.assertIn("Team", team_work)
        self.assertIn("corsHeaders", invite)
        self.assertIn("req.method === 'OPTIONS'", invite)

    def test_team_invites_use_a_validated_internal_redirect_not_site_url_fallback(self):
        invite = self.read("supabase/functions/team-invite/index.ts")
        auth_redirects = self.read("docs/AUTH_REDIRECTS.md")
        architecture = self.read("docs/ARCHITECTURE.md")
        self.assertIn("redirectTo,", invite)
        self.assertIn("inviteRedirectFor", invite)
        self.assertIn("PR_PREVIEW_ORIGIN_RE", invite)
        self.assertIn("SOLIDDESIGN_INTERNAL_ORIGIN", invite)
        self.assertIn("Authentication → URL Configuration", auth_redirects)
        self.assertIn("soliddesign-cms.pages.dev", auth_redirects)
        self.assertIn("pr-*", auth_redirects)
        self.assertIn("docs/AUTH_REDIRECTS.md", architecture)

    def test_team_identity_prefers_display_name_and_safe_delete(self):
        team_work = self.read("operator/team-work.js")
        migration = self.read("supabase/migrations/20260829_team_identity_and_safe_delete_v01.sql")
        admin_fn = self.read("supabase/functions/team-member-admin/index.ts")
        self.assertIn("memberInitials", team_work)
        self.assertIn("display_name", team_work)
        self.assertIn("Verwijder", team_work)
        self.assertIn("operator_update_team_display_name", migration)
        self.assertIn("business_history", admin_fn)
        self.assertIn("auth.admin.deleteUser", admin_fn)

    def test_engagement_is_minimal_privacy_bounded_and_browser_callable(self):
        schema = self.read("supabase/migrations/20260829_prospect_engagement_v01.sql")
        edge = self.read("supabase/functions/prospect-engagement/index.ts")
        client = self.read("operator/prospect-engagement.js")
        operator_ui = self.read("operator/engagement-ui.js")

        forbidden_columns = ("ip_address", "ip_hash", "fingerprint", "visitor_id")
        for column in forbidden_columns:
            self.assertIsNone(
                re.search(rf"^\s*{re.escape(column)}\s+", schema, flags=re.IGNORECASE | re.MULTILINE),
                f"forbidden engagement column present: {column}",
            )

        self.assertIn("corsHeaders", edge)
        self.assertIn("req.method === 'OPTIONS'", edge)
        self.assertIn("mint_internal", edge)
        self.assertIn("validInternalToken", edge)
        self.assertIn("__sd_staff", client)
        self.assertIn("__sd_staff", operator_ui)
        self.assertNotIn("__internal", client)
        self.assertNotIn("__internal", operator_ui)

    def test_first_open_is_attributed_only_to_a_prior_mailing(self):
        migration = self.read("supabase/migrations/20260829_membership_engagement_correctness_v02.sql")
        self.assertIn("m.mailed_at <= first_open", migration)

    def test_my_work_can_open_the_matching_dossier_phase(self):
        dossier = self.read("operator/dossier-tabs.js")
        self.assertIn("pendingWorkTab", dossier)
        self.assertIn("responsibility === 'Design'", dossier)
        self.assertIn("responsibility === 'Outreach & opvolging'", dossier)

    def test_prospect_register_exposes_only_simple_work_distribution_filters(self):
        work_filter = self.read("operator/prospect-work-filter.js")
        self.assertIn("Mijn werk", work_filter)
        self.assertIn("Zonder dossierhouder", work_filter)
        self.assertIn("Zonder design", work_filter)
        self.assertIn("Zonder outreach", work_filter)
        self.assertNotIn("kanban", work_filter.lower())

    def test_public_route_preserves_noindex_and_tracking_query_on_canonicalization(self):
        route = self.read("operator/functions/prospect/[[path]].js")
        self.assertIn("noindex, nofollow, noarchive", route)
        self.assertIn("incoming.search", route)
        self.assertIn("prospect-engagement.js", route)
        self.assertIn("LEGACY_PREVIEW_HOSTS", route)
        self.assertNotIn("select: 'id,preview_url,artifact_path'", route)

    def test_old_root_slug_route_is_only_an_alias_to_the_canonical_public_resolver(self):
        route = self.read("operator/functions/[slug].js")
        self.assertIn("/prospect/", route)
        self.assertNotIn("SUPABASE_URL", route)
        self.assertNotIn("preview_url", route)
        self.assertNotIn("/p/${", route)

    def test_new_live_publication_requires_a_stored_artifact(self):
        migration = self.read("supabase/migrations/20260829_live_artifact_policy_v01.sql")
        policy = self.read("operator/mockup-policy.js")
        public_links = self.read("docs/PROSPECT_PUBLIC_LINKS.md")
        self.assertIn("artifact_path", migration)
        self.assertIn("alleen voor conceptreview", policy.lower())
        self.assertIn("New LIVE publication requires", public_links)
        self.assertIn("transition debt", public_links.lower())

    def test_database_and_documentation_have_one_explicit_truth_hierarchy(self):
        architecture = self.read("docs/ARCHITECTURE.md")
        implementation_plan = self.read("docs/IMPLEMENTATION_PLAN.md")
        component_spike = self.read("docs/COMPONENT_SPIKE.md")
        supabase_readme = self.read("supabase/README.md")

        self.assertIn("Documentation truth hierarchy", architecture)
        self.assertIn("HISTORICAL", implementation_plan)
        self.assertIn("HISTORICAL", component_spike)
        self.assertIn("bootstrap baseline", supabase_readme)
        self.assertIn("ordered migrations", supabase_readme)
        self.assertIn("second current schema specification", supabase_readme)


if __name__ == "__main__":
    unittest.main()
