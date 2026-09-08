from pathlib import Path
import json
import unittest


ROOT = Path(__file__).resolve().parents[1]


class PromptLibraryResearchDiscoveryTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_prompt_library_has_one_repository_source_and_narrow_admin_write_boundary(self):
        api = self.read("operator/functions/api/prompt-library.js")
        middleware = self.read("operator/functions/api/_middleware.js")
        docs = self.read("docs/PROMPT_LIBRARY.md")

        self.assertIn("const ROOT = 'prompts/library'", api)
        self.assertIn("member.role !== 'ADMIN'", api)
        self.assertIn("includeBody && member.role !== 'ADMIN'", api)
        self.assertIn("expectedSha", api)
        self.assertIn("prompts/library/<slug>.md", docs)
        self.assertIn("No custom prompt resolver is required", docs)

        self.assertIn("url.pathname === '/api/prompt-library'", middleware)
        self.assertIn("DEFAULT_INTERNAL_ORIGIN", middleware)
        self.assertIn("Promptwijzigingen zijn alleen toegestaan vanuit de productie-CMS", middleware)

    def test_prompt_invocation_is_shared_and_initial_methods_are_real_repository_files(self):
        config = self.read("operator/config.js")
        invocation = self.read("operator/prompt-invocation.js")
        library = self.read("operator/prompt-library.js")
        research = self.read("operator/research-discovery.js")

        self.assertIn("SOLIDDESIGN_PROMPTS", invocation)
        self.assertIn("prompts.render", library)
        self.assertIn("prompts.copy('prospect-research'", research)
        self.assertIn("DOMContentLoaded", config)
        self.assertIn("import('./prompt-library.js')", config)
        self.assertIn("import('./research-discovery.js')", config)
        self.assertTrue((ROOT / "prompts/library/prospect-research.md").is_file())
        self.assertTrue((ROOT / "prompts/library/website-design.md").is_file())

    def test_research_csv_uses_one_machine_contract_and_existing_candidate_ingest(self):
        research = self.read("operator/research-discovery.js")
        contract = json.loads(self.read("prompts/contracts/prospect-research-import-v1.json"))
        run_type_migration = self.read("supabase/migrations/20260908_research_discovery_import_v01.sql")
        merge_migration = self.read("supabase/migrations/20260908_research_discovery_evidence_merge_v02.sql")

        expected_columns = [
            "rank", "business_name", "location", "website", "triage_decision",
            "provisional_priority", "eligible_for_pdos", "evidence_confidence",
            "desktop_content_inspected", "mobile_inspected",
            "service_or_project_page_inspected", "trust_evidence_checked",
            "technical_measurement_run", "commercial_signals", "website_observations",
            "structural_redesign_hypothesis", "verification_needed", "source_urls",
        ]
        self.assertEqual(contract["contract"], "prospect-research-import-v1")
        self.assertEqual(contract["columns"], expected_columns)
        self.assertIn("CONTRACT_URL = '/prompts/contracts/prospect-research-import-v1.json'", research)
        self.assertIn("papaparse@5.7.0", research)
        self.assertIn("operator_ingest_discovery_candidates", research)
        self.assertIn("run_type: 'IMPORT'", research)
        self.assertIn("discovery_source: 'research'", research)
        self.assertIn("research: {", research)
        self.assertIn("enriched_count", research)
        self.assertIn("'AREA','URL','IMPORT'", run_type_migration)
        self.assertNotIn("create table", run_type_migration.lower())

        self.assertIn("jsonb_build_object('research'", merge_migration)
        self.assertIn("p.discovery_run_id is distinct from p_run_id", merge_migration)
        self.assertIn("enriched_count", merge_migration)
        self.assertIn("input ->> 'canonical_sector_key'", merge_migration)
        self.assertNotIn("create table", merge_migration.lower())

    def test_discovery_search_has_one_task_and_three_progressive_modes(self):
        html = self.read("operator/index.html")
        discovery_js = self.read("operator/discovery.js")
        research = self.read("operator/research-discovery.js")

        self.assertIn("Vind bedrijven en voeg geschikte kandidaten toe aan Prospects", html)
        self.assertIn('data-discovery-mode="research"', html)
        self.assertIn('data-discovery-mode="area"', html)
        self.assertIn('data-discovery-mode="url"', html)
        self.assertIn("Gericht zoeken", html)
        self.assertIn("Breed zoeken", html)
        self.assertIn("Bekend bedrijf", html)
        self.assertIn('id="discoveryLimit" type="hidden" value="10"', html)
        self.assertNotIn("Max. resultaten", html)
        self.assertNotIn("Zoek nieuwe prospects", html)
        self.assertNotIn("Controleer een website", html)
        self.assertNotIn("Sectoronderzoek", html)
        self.assertIn("setDiscoveryMode('research')", discovery_js)
        self.assertIn("Gericht zoeken", discovery_js)
        self.assertIn(".limit(5)", discovery_js)
        self.assertIn("1. Kopieer opdracht", research)
        self.assertIn("2. Importeer resultaat", research)
        self.assertIn("+ Extra instructie", research)
        self.assertFalse((ROOT / "operator/sector-intelligence-ui.js").exists())

    def test_research_and_deterministic_triage_are_merge_safe_in_one_inbox(self):
        triage = self.read("operator/discovery-triage.js")
        discovery = self.read("docs/DISCOVERY.md")

        self.assertIn("...(existing && typeof existing === 'object' ? existing : {})", triage)
        self.assertIn("row.qualification?.research", triage)
        self.assertIn("row.qualification?.triage", triage)
        self.assertIn("researchPriority", triage)
        self.assertIn("Toevoegen", triage)
        self.assertIn("Waarom?", triage)
        self.assertIn("KANSRIJK", triage)
        self.assertIn("NOG BEOORDELEN", triage)
        self.assertIn("collapsed: true", triage)
        self.assertNotIn("Voeg toe aan Prospects", triage)
        self.assertNotIn("Bekijk beoordeling", triage)
        self.assertNotIn("Basischeck OK", triage)
        self.assertIn("qualification.research", discovery)
        self.assertIn("qualification.triage", discovery)
        self.assertFalse((ROOT / "docs/DISCOVERY_TRIAGE.md").exists())

    def test_missing_full_qualification_is_explicit_not_a_fake_score(self):
        display = self.read("operator/qualification-display.js")
        scoring = self.read("docs/SCORING_RUBRICS.md")
        self.assertIn("Nog niet uitgevoerd", display)
        self.assertIn("0–25", scoring)
        self.assertIn("research", scoring.lower())


if __name__ == "__main__":
    unittest.main()
