from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        raise AssertionError(f"missing required file: {path}")
    return target.read_text(encoding="utf-8")


class WebsiteOpportunityV51Tests(unittest.TestCase):
    def test_one_bounded_namespace_and_narrow_rpc(self) -> None:
        migration = read("supabase/migrations/20260913_website_opportunity_v51.sql")
        lower = migration.lower()

        self.assertIn("operator_set_website_opportunity", migration)
        self.assertIn("'website_opportunity'", migration)
        self.assertIn("coalesce(p.qualification, '{}'::jsonb)", migration)
        self.assertIn("source audit does not belong to prospect", migration)
        self.assertIn("at most 5 website opportunity findings", migration)
        self.assertIn("website_opportunity_reviewed", migration)
        self.assertIn("perform public.operator_assert_allowed()", migration)
        self.assertIn("security definer", lower)
        self.assertIn("set search_path = public, pg_temp", lower)
        self.assertIn("revoke all on function public.operator_set_website_opportunity", lower)
        self.assertIn("grant execute on function public.operator_set_website_opportunity", lower)
        self.assertNotIn("create table", lower)
        self.assertNotIn("update public.audits", lower)

    def test_prompt_is_business_first_and_machine_importable(self) -> None:
        prompt = read("prompts/library/website-opportunity-review.md")

        self.assertIn('title: "Website Opportunity Review"', prompt)
        self.assertIn('"source_audit_id"', prompt)
        self.assertIn('"business_impact"', prompt)
        self.assertIn('"recommendation"', prompt)
        self.assertIn("Return **only valid JSON**", prompt)
        self.assertIn("at most **5 findings**", prompt)
        self.assertIn("Never invent", prompt)
        self.assertNotIn("opportunity score", prompt.lower())
        self.assertNotIn("OP-01", prompt)

    def test_existing_dossier_gets_one_integrated_website_opportunity_surface(self) -> None:
        config = read("operator/config.js")
        module = read("operator/website-opportunity.js")
        dossier = read("operator/dossier-tabs.js")

        self.assertIn("import('./website-opportunity.js')", config)
        self.assertIn("Websitekansen", module)
        self.assertIn("Kopieer analyseopdracht", module)
        self.assertIn("Importeer beoordeeld resultaat", module)
        self.assertIn("prompts.copy(PROMPT_SLUG", module)
        self.assertIn("operator_set_website_opportunity", module)
        self.assertIn("data-dossier-pane=\"overview\"", module)
        self.assertIn("data-mailing-design", module)
        self.assertIn("Kopieer bevindingen", module)
        self.assertIn("website_opportunity_reviewed", dossier)
        self.assertNotIn("createElement('main')", module)
        self.assertNotIn("Website Opportunity score", module)

    def test_design_brief_projects_priority_and_evidence_not_sales_copy(self) -> None:
        design = read("operator/design-process.js")
        docs = read("docs/DESIGN_BRIEF.md")

        self.assertIn("Brief format version:** 0.5", design)
        self.assertIn("## Prioritized website opportunities", design)
        self.assertIn("websiteOpportunityMarkdown(prospect, audit)", design)
        self.assertIn("Evidence:", design)
        self.assertIn("refreshQualification(context)", design)
        self.assertNotIn("Why it matters:", design)
        self.assertIn("v0.5", docs)

    def test_audit_and_operator_direction_remain_separate_domains(self) -> None:
        design = read("operator/design-process.js")
        contract = read("docs/WEBSITE_OPPORTUNITY_REVIEW.md")

        self.assertIn("Verified technical/diagnostic issues", design)
        self.assertIn("## Operator direction", design)
        self.assertIn("`audits.findings` keeps its current technical/diagnostic meaning", contract)
        self.assertIn("`design_brief_note` remains explicit operator design direction", contract)

    def test_rollback_is_non_destructive_by_default(self) -> None:
        contract = read("docs/WEBSITE_OPPORTUNITY_REVIEW.md")
        decision = read("docs/decisions/20260913_WEBSITE_OPPORTUNITY_REVIEW_V51.md")

        self.assertIn("drop function if exists public.operator_set_website_opportunity", contract)
        self.assertIn("No destructive data cleanup is required", contract)
        self.assertIn("Revert the v5.1 application merge commit", decision)
        self.assertIn("Leave persisted `qualification.website_opportunity` JSON intact", decision)


if __name__ == "__main__":
    unittest.main()
