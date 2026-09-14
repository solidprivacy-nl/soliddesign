# 2026-09-14 — Combined Skill rollback

## Decision

Return the normal SolidDesign website-design workflow to the 2026-09-07 Combined Logo + Website Redesign skill as the canonical design method.

The recent split Bootstrap → Constitution → Diagnose → Design Direction → Build → Critique stack had accumulated useful safeguards, but in practice it shifted too much design attention toward gate compliance and away from strong art direction and coherent visual composition.

The rollback is therefore methodological, not a runtime rollback.

## Canonical method after this change

`prompts/SOLIDDESIGN_COMBINED_SKILL.md`

The stable Bootstrap and `prompts/library/website-design.md` are thin entry points into that one method. The older split prompt files may remain for historical/specialist reference but are no longer required inputs in a normal redesign run.

## Preserved later lessons

Only four later lessons are deliberately carried into the 2026-09-07 base:

1. logo intervention is `KEEP / REFINE / REDESIGN`; a usable logo is not redesigned merely because it looks old;
2. decorative numbering such as `01 / 02 / 03 / 04` is rejected unless the number has genuine semantic meaning;
3. customer-facing copy may not expose redesign, audit, CMS or SolidDesign process language;
4. imagery uses real material where proof matters and art-directed/generated imagery where presentation benefits, without presenting generated imagery as unverified company-specific documentary proof.

No `ASSET_READY` protocol, per-image EVIDENCE/ILLUSTRATIVE administration or separate image-quality gate is carried forward as a mandatory normal-run layer.

## What remains unchanged

- Prospect Design Brief format and Website Opportunity remain unchanged.
- CMS design lifecycle and LIVE publication controls remain unchanged.
- No Supabase schema or migration change.
- No operator runtime capability is added.
- Existing LIVE customer versions are untouched.

## Reversibility

Exact pre-change main anchor:

`107a1d3599599b2039983d9ef28996cbfb3d73f3`

To reverse this decision, restore the prompt files and prompt-contract tests from that commit. No compensating database migration is required.

## Validation

CI must pass with tests asserting the new single Combined Skill contract. After deployment, rerun one existing prospect and compare the new output with the immediately preceding prompt-stack result before treating the rollback as successful in practice.
