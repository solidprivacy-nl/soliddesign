import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


class CmsRepositoryBoundaryTests(unittest.TestCase):
    def test_browser_and_handoff_contracts_do_not_expose_repository_hosts(self) -> None:
        browser_contracts = [
            "operator/start-design.html",
            "operator/design-process.js",
            "operator/sector-intelligence-ui.js",
            "prompts/SOLIDDESIGN_BOOTSTRAP.md",
        ]

        for path in browser_contracts:
            source = read(path).lower()
            self.assertNotIn("github.com", source, path)
            self.assertNotIn("raw.githubusercontent.com", source, path)
            self.assertNotIn("api.github.com", source, path)

    def test_design_resources_are_served_through_the_current_solid_design_origin(self) -> None:
        start = read("operator/start-design.html")
        bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        design = read("operator/design-process.js")
        deploy = read(".github/workflows/deploy-operator.yml")

        self.assertIn('href="/prompts/SOLIDDESIGN_BOOTSTRAP.md"', start)
        self.assertIn("Define `SOLIDDESIGN_ORIGIN` as the origin of the supplied SolidDesign start URL", bootstrap)
        self.assertIn("`/prompts/core/DESIGN_CONSTITUTION.md`", bootstrap)
        self.assertIn("SOLIDDESIGN_ORIGIN/sector-intelligence/<canonical_sector_key>.md", bootstrap)
        self.assertNotIn("https://soliddesign-cms.pages.dev", bootstrap)
        self.assertIn("`${window.location.origin}/sector-intelligence`", design)
        self.assertIn("cp -R prompts operator/prompts", deploy)
        self.assertIn("cp -R sector-intelligence operator/sector-intelligence", deploy)

    def test_ai_contract_is_provider_blind(self) -> None:
        start = read("operator/start-design.html")
        bootstrap = read("prompts/SOLIDDESIGN_BOOTSTRAP.md")

        self.assertIn("For internal SolidDesign context, use only resources served through `SOLIDDESIGN_ORIGIN`", bootstrap)
        self.assertIn("Do not discover, inspect or infer underlying source repositories", bootstrap)
        self.assertIn("Do not substitute an implementation-source lookup", bootstrap)
        self.assertIn("Normal external market research", bootstrap)

        self.assertIn("Implementation boundary:", start)
        self.assertIn(
            "Underlying repositories, database providers and deployment infrastructure are outside the design contract.",
            start,
        )

        combined = f"{start}\n{bootstrap}".lower()
        self.assertNotIn("supabase.co", combined)
        self.assertNotIn("repository_full_name", combined)
        self.assertNotIn("pull request", start.lower())

    def test_design_lifecycle_ui_has_one_visible_source_of_truth(self) -> None:
        operator = read("operator/index.html")

        self.assertIn("<h3>Ontwerpversies</h3>", operator)
        self.assertIn("Dit is de enige plek voor de ontwerpstatus.", operator)
        self.assertIn('data-link="preview" target="_blank" rel="noopener" class="hidden"', operator)
        self.assertIn('data-field="liveMockup" class="mockup-live hidden"', operator)
        self.assertIn("<h4>Alle ontwerpversies</h4>", operator)
        self.assertIn("<span>Ontwerpstatus</span>", operator)
        self.assertNotIn(">Live mock-up ↗</a>", operator)
        self.assertNotIn("<h3>Mock-up versies</h3>", operator)

    def test_design_ui_refinement_uses_published_sector_choices_and_newest_version(self) -> None:
        operator = read("operator/index.html")
        refinement = read("operator/design-ui-preview.js")

        self.assertIn('src="./design-ui-preview.js"', operator)
        self.assertIn("Nieuwste ontwerp ↗", operator)
        self.assertIn("Sector voor design ", refinement)
        self.assertIn("(optioneel)", refinement)
        self.assertIn(".filter((row) => row?.has_published)", refinement)
        self.assertIn("Automatisch gekoppeld ·", refinement)
        self.assertIn("operator_set_prospect_sector", refinement)
        self.assertIn(".order('created_at', { ascending: false })", refinement)
        self.assertIn("Nieuwste ontwerp ↗", refinement)
        self.assertNotIn("github.com", refinement.lower())
        self.assertNotIn("api.github.com", refinement.lower())

    def test_provider_transport_remains_server_only(self) -> None:
        server = read("operator/functions/api/sector-intelligence.js").lower()
        ui = read("operator/sector-intelligence-ui.js").lower()

        self.assertIn("api.github.com", server)
        self.assertNotIn("api.github.com", ui)
        self.assertNotIn("source_url", ui)
        self.assertNotIn("review_url", ui)


if __name__ == "__main__":
    unittest.main()
