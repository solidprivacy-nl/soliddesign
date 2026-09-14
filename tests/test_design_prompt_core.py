from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DesignPromptCoreTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_one_integrated_design_entry_uses_combined_skill(self):
        bootstrap = self.read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        design_entry = self.read("prompts/library/website-design.md")
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")
        docs = self.read("docs/PROMPT_LIBRARY.md")

        self.assertIn("single canonical redesign method", bootstrap)
        self.assertIn("/prompts/SOLIDDESIGN_COMBINED_SKILL.md", bootstrap)
        self.assertIn("not required inputs", bootstrap)
        self.assertNotIn("/prompts/core/DESIGN_CONSTITUTION.md", bootstrap)
        self.assertNotIn("ASSET_READY", bootstrap)

        self.assertIn("# SolidDesign Redesign", design_entry)
        self.assertIn("Treat this as one end-to-end design assignment", design_entry)
        self.assertIn("KEEP / REFINE / REDESIGN", design_entry)
        self.assertIn("Combined Skill is the canonical method", design_entry)
        self.assertNotIn("ASSET_READY", design_entry)
        self.assertNotIn("WEBSITE_ONLY", design_entry)
        self.assertNotIn("LOGO_AND_WEBSITE", design_entry)

        self.assertIn("Version: 2026-09-07-r2", combined)
        self.assertIn("one coherent improved identity system", combined)
        self.assertFalse((ROOT / "prompts/library/logo-website-design.md").exists())
        self.assertFalse((ROOT / "prompts/workflow/00_LOGO.md").exists())

        self.assertIn("there is now exactly one operator entry", docs.lower())
        self.assertIn("There is no separate WEBSITE_ONLY versus LOGO_AND_WEBSITE mode", docs)

    def test_logo_is_assessed_keep_refine_redesign_inside_combined_skill(self):
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")

        self.assertIn("assess the existing logo and choose KEEP / REFINE / REDESIGN", combined)
        self.assertIn("### A. KEEP", combined)
        self.assertIn("### B. REFINE", combined)
        self.assertIn("### C. REDESIGN — evolutionary", combined)
        self.assertIn("### D. REDESIGN — replacement", combined)
        self.assertIn("A logo redesign is not mandatory", combined)
        self.assertIn("LOGO_FINAL_01", combined)
        self.assertIn("KEEP when already good; otherwise evolution before replacement", combined)

    def test_imagery_is_art_directed_and_locked_before_html_without_gate_stack(self):
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")

        self.assertIn("Grounded artistic freedom for imagery", combined)
        self.assertIn("real where proof matters; generated/art-directed where presentation benefits; never misleading", combined)
        self.assertIn("Do not turn this into an administrative classification system", combined)
        self.assertIn("# 12. Image asset lock", combined)
        self.assertIn("Never substitute semantically similar but visually weaker images", combined)
        self.assertIn("## 8.1 Mandatory production order", combined)
        self.assertIn("6. lock image assets and crops;", combined)
        self.assertIn("7. build final semantic HTML/CSS;", combined)
        self.assertLess(
            combined.index("6. lock image assets and crops;"),
            combined.index("7. build final semantic HTML/CSS;"),
        )
        self.assertNotIn("ASSET_READY", combined)
        self.assertNotIn("IMAGE_QUALITY_GATE", combined)

    def test_generated_imagery_truth_boundary_is_explicit_but_compact(self):
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")

        self.assertIn("Creative freedom applies to **presentation**, not to factual claims", combined)
        self.assertIn("Do not use generated images in a way that falsely presents them as documentary evidence", combined)
        self.assertIn("clients;", combined)
        self.assertIn("certifications;", combined)
        self.assertIn("named staff;", combined)
        self.assertIn("specific completed projects;", combined)

    def test_customer_facing_process_copy_is_blocked(self):
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")
        design_entry = self.read("prompts/library/website-design.md")

        self.assertIn(
            "Customer-facing copy must never expose audit, redesign, CMS or SolidDesign process language",
            combined,
        )
        self.assertIn("current website", combined)
        self.assertIn("in this concept", combined)
        self.assertIn("Do not leak redesign/audit/CMS/SolidDesign process language", design_entry)

    def test_decorative_numbering_is_rejected(self):
        combined = self.read("prompts/SOLIDDESIGN_COMBINED_SKILL.md")

        self.assertIn("Do not use decorative numbering such as `01 / 02 / 03 / 04`", combined)
        self.assertIn("unless the number communicates a real sequence", combined)

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
