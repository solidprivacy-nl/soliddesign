from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DesignPromptCoreTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_one_integrated_design_entry_without_parallel_logo_mode(self):
        bootstrap = self.read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        design_entry = self.read("prompts/library/website-design.md")
        docs = self.read("docs/PROMPT_LIBRARY.md")

        self.assertIn("## One integrated redesign flow", bootstrap)
        self.assertIn("There is one normal SolidDesign redesign flow", bootstrap)
        self.assertIn("logo assessment is mandatory", bootstrap.lower())
        self.assertIn("NO HTML BEFORE `ASSET_READY`", bootstrap)

        self.assertIn("# SolidDesign Redesign", design_entry)
        self.assertIn("Treat this as one end-to-end design assignment", design_entry)
        self.assertIn("KEEP / REFINE / REDESIGN", design_entry)
        self.assertIn("ASSET_READY", design_entry)
        self.assertNotIn("WEBSITE_ONLY", design_entry)
        self.assertNotIn("LOGO_AND_WEBSITE", design_entry)

        self.assertFalse((ROOT / "prompts/library/logo-website-design.md").exists())
        self.assertFalse((ROOT / "prompts/workflow/00_LOGO.md").exists())

        self.assertIn("there is now exactly one operator entry", docs.lower())
        self.assertIn("There is no separate WEBSITE_ONLY versus LOGO_AND_WEBSITE mode", docs)
        self.assertIn("no retired `logo-website-design` or `00_LOGO` parallel path remains", docs)

    def test_logo_is_assessed_inside_normal_design_flow(self):
        constitution = self.read("prompts/core/DESIGN_CONSTITUTION.md")
        diagnose = self.read("prompts/workflow/01_DIAGNOSE.md")
        direction = self.read("prompts/workflow/02_DESIGN_DIRECTION.md")

        self.assertIn("Logo assessment is part of every redesign", constitution)
        self.assertIn("KEEP / REFINE / REDESIGN", constitution)
        self.assertIn("## Mandatory logo assessment", diagnose)
        self.assertIn("### KEEP", diagnose)
        self.assertIn("### REFINE", diagnose)
        self.assertIn("### REDESIGN", diagnose)
        self.assertIn("## Phase B — finalize the logo decision", direction)
        self.assertIn("LOGO_FINAL_01", direction)
        self.assertIn("evolutionary redesign", direction)

    def test_prominent_imagery_is_produced_and_locked_before_html(self):
        bootstrap = self.read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        direction = self.read("prompts/workflow/02_DESIGN_DIRECTION.md")
        build = self.read("prompts/workflow/03_BUILD.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("Photography and imagery are design inputs, not post-build decoration", bootstrap)
        self.assertIn("## Phase C — define the image roles", direction)
        self.assertIn("## Phase D — produce the actual imagery", direction)
        self.assertIn("create or edit the asset now", direction)
        self.assertIn("## Phase F — lock the asset set", direction)
        self.assertIn("## `ASSET_READY` hard gate", direction)

        self.assertIn("Workflow 03 may start only when", build)
        self.assertIn("ASSET_READY = PASS", build)
        self.assertLess(build.index("ASSET_READY = PASS"), build.index("build semantic HTML/CSS"))
        self.assertIn("return internally to Workflow 02", build)
        self.assertIn("Do not make the user orchestrate that loop", build)

        self.assertIn("### Asset-readiness regression", critique)
        self.assertIn("return internally to workflow 02", critique.lower())
        self.assertIn("Do not deliver a candidate marked `REVISE`", critique)

    def test_pre_lock_image_quality_gate_is_mandatory_and_non_numeric(self):
        bootstrap = self.read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        direction = self.read("prompts/workflow/02_DESIGN_DIRECTION.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("PRE-LOCK IMAGE QUALITY GATE", bootstrap)
        self.assertIn("every prominent image has `IMAGE_QUALITY_GATE = PASS` before lock", bootstrap)

        self.assertIn("## Phase E — pre-lock image quality gate", direction)
        self.assertIn("**`IMAGE_QUALITY_GATE = PASS`**", direction)
        self.assertIn("### 1. Immediate clarity", direction)
        self.assertIn("### 2. Desired perception", direction)
        self.assertIn("### 3. Business and message relevance", direction)
        self.assertIn("### 4. Credibility and physical plausibility", direction)
        self.assertIn("### 5. Composition fit", direction)
        self.assertIn("### 6. Visual craft", direction)
        self.assertIn("Do not average away a serious weakness", direction)
        self.assertIn("do not create a numeric image-quality score", direction)
        self.assertIn("Only assets with `IMAGE_QUALITY_GATE = PASS` may be locked", direction)
        self.assertNotIn("IMAGE_QUALITY_SCORE", direction)

        self.assertIn("### Image-quality regression", critique)
        self.assertIn("A previous asset lock is not a reason to preserve a bad decision", critique)
        self.assertIn("unlock and replace/re-lock the affected asset", critique)
        self.assertIn("every prominent image still deserves `IMAGE_QUALITY_GATE = PASS`", critique)

    def test_generated_imagery_truth_boundary_is_explicit(self):
        constitution = self.read("prompts/core/DESIGN_CONSTITUTION.md")
        direction = self.read("prompts/workflow/02_DESIGN_DIRECTION.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("may not fabricate company-specific evidence", constitution)
        self.assertIn("## Truth boundary for generated visuals", direction)
        self.assertIn("company premises", direction)
        self.assertIn("vehicle/fleet", direction)
        self.assertIn("project/client location", direction)
        self.assertIn("false documentary evidence", critique)

    def test_customer_facing_process_copy_is_release_blocking(self):
        constitution = self.read("prompts/core/DESIGN_CONSTITUTION.md")
        build = self.read("prompts/workflow/03_BUILD.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("Customer-facing copy stays customer-facing", constitution)
        self.assertIn("The prospect website speaks only as the prospect business to its customers", build)
        self.assertIn("### 12. Customer-copy contamination check", critique)
        self.assertIn("the current/existing website", critique)
        self.assertIn("in this concept", critique)

    def test_adjustment_is_documented_and_has_exact_rollback_anchor(self):
        adr = self.read("docs/decisions/20260914_INTEGRATED_DESIGN_ASSETS_REVERSIBLE_ADJUSTMENT.md")
        previous_adr = self.read("docs/decisions/20260913_CANONICAL_DESIGN_CORE_REVERSIBLE_ADJUSTMENT.md")

        self.assertIn("Reversibility", adr)
        self.assertIn("cb19884283f539bcf20584aa1e770df69d2e0738", adr)
        self.assertIn("rollback/pre-2026-09-14-design-flow", adr)
        self.assertIn("No compensating Supabase migration", adr)
        self.assertIn("Website Opportunity remains unchanged", adr)
        self.assertIn("superseded on 2026-09-14", previous_adr)
        self.assertIn("20260914_INTEGRATED_DESIGN_ASSETS_REVERSIBLE_ADJUSTMENT.md", previous_adr)

    def test_image_quality_adjustment_is_documented_and_reversible(self):
        adr = self.read("docs/decisions/20260914_PRE_LOCK_IMAGE_QUALITY_GATE_REVERSIBLE_ADJUSTMENT.md")

        self.assertIn("Pre-Lock Image Quality Gate", adr)
        self.assertIn("4393af7b19d4446c4cc14661ec096570b62f568f", adr)
        self.assertIn("rollback/pre-2026-09-14-image-quality-gate", adr)
        self.assertIn("No Supabase", adr)
        self.assertIn("No CMS runtime", adr)
        self.assertIn("A. van Berkel", adr)
        self.assertIn("hard PASS/FAIL", adr)


if __name__ == "__main__":
    unittest.main()
