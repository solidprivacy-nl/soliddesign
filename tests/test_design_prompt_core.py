from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DesignPromptCoreTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        path = ROOT / relative_path
        self.assertTrue(path.is_file(), f"missing required file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_one_canonical_website_method_with_two_thin_entry_modes(self):
        bootstrap = self.read("prompts/SOLIDDESIGN_BOOTSTRAP.md")
        website_entry = self.read("prompts/library/website-design.md")
        combined_entry = self.read("prompts/library/logo-website-design.md")
        logo_workflow = self.read("prompts/workflow/00_LOGO.md")
        docs = self.read("docs/PROMPT_LIBRARY.md")

        self.assertIn("WEBSITE_ONLY", website_entry)
        self.assertIn("/prompts/SOLIDDESIGN_BOOTSTRAP.md", website_entry)
        self.assertNotIn("# 6. PHASE A", website_entry)
        self.assertNotIn("# 11. Grounded artistic freedom for imagery", website_entry)

        self.assertIn("LOGO_AND_WEBSITE", combined_entry)
        self.assertIn("/prompts/workflow/00_LOGO.md", combined_entry)
        self.assertIn("/prompts/SOLIDDESIGN_BOOTSTRAP.md", combined_entry)
        self.assertIn("LOGO_FINAL_01", combined_entry)
        self.assertNotIn("# 9. Website information architecture", combined_entry)

        self.assertIn("This workflow owns logo diagnosis, redesign and asset locking only", logo_workflow)
        self.assertIn("continue with the canonical SolidDesign Design Bootstrap", logo_workflow)
        self.assertNotIn("Website information architecture", logo_workflow)

        self.assertIn("The normal two-URL Design handoff is **WEBSITE_ONLY**", bootstrap)
        self.assertIn("Do not maintain a second website-design doctrine", bootstrap)
        self.assertIn("logo-website-design", docs)
        self.assertIn("same canonical core + workflows 01–04", docs)

    def test_identity_is_preserved_without_protecting_weak_execution(self):
        constitution = self.read("prompts/core/DESIGN_CONSTITUTION.md")
        diagnose = self.read("prompts/workflow/01_DIAGNOSE.md")

        self.assertIn("Preserve identity. Re-evaluate execution.", constitution)
        self.assertIn("## Identity versus execution boundary", constitution)
        self.assertIn("### LOCK", constitution)
        self.assertIn("### PRESERVE / EVOLVE", constitution)
        self.assertIn("### FREE TO REDESIGN", constitution)
        self.assertIn("### REPLACE WHEN WEAK", constitution)
        self.assertIn("low-resolution or badly cropped imagery", constitution)

        self.assertIn("## Mandatory source inheritance map", diagnose)
        self.assertIn("FREE TO REDESIGN", diagnose)
        self.assertIn("REPLACE WHEN WEAK", diagnose)
        self.assertIn("low-resolution or enlarged thumbnail imagery", diagnose)

    def test_imagery_is_planned_and_locked_before_html(self):
        direction = self.read("prompts/workflow/02_DESIGN_DIRECTION.md")
        build = self.read("prompts/workflow/03_BUILD.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("## Image-role planning is mandatory", direction)
        self.assertIn("Do not design a prominent image container around whatever source image happens to exist", direction)
        self.assertIn("1. strong real company/project image", direction)
        self.assertIn("4. high-quality generated image", direction)

        self.assertIn("## Mandatory production order", build)
        self.assertLess(build.index("define each required image role"), build.index("build semantic HTML/CSS"))
        self.assertIn("lock image identity, crop, aspect ratio, focal point and object-position", build)
        self.assertIn("Do not enlarge low-resolution source imagery", build)

        self.assertIn("### 7. Imagery and art direction", critique)
        self.assertIn("## Hard visual release gate", critique)
        self.assertIn("enlarged low-resolution source imagery", critique)
        self.assertIn("collage-like source fragments", critique)
        self.assertIn("generated imagery that materially misrepresents company-specific reality", critique)

    def test_customer_facing_process_copy_is_release_blocking(self):
        constitution = self.read("prompts/core/DESIGN_CONSTITUTION.md")
        build = self.read("prompts/workflow/03_BUILD.md")
        critique = self.read("prompts/workflow/04_CRITIQUE.md")

        self.assertIn("Customer-facing copy stays customer-facing", constitution)
        self.assertIn("The prospect website speaks only as the prospect business to its customers", build)
        self.assertIn("### 11. Customer-copy contamination check", critique)
        self.assertIn("the current/existing website", critique)
        self.assertIn("in this concept", critique)
        self.assertIn("Do not deliver a candidate marked `REVISE`", critique)

    def test_adjustment_is_documented_as_reversible_without_state_migration(self):
        adr = self.read("docs/decisions/20260913_CANONICAL_DESIGN_CORE_REVERSIBLE_ADJUSTMENT.md")

        self.assertIn("Reversibility", adr)
        self.assertIn("Close the pull request", adr)
        self.assertIn("Revert the adjustment merge/squash commit", adr)
        self.assertIn("No compensating database migration", adr)
        self.assertIn("no database or business-state migration", adr)


if __name__ == "__main__":
    unittest.main()
