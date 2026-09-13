# ADR — Canonical Website Design Core as Reversible Adjustment

**Date:** 2026-09-13  
**Status:** superseded on 2026-09-14  
**Superseded by:** `docs/decisions/20260914_INTEGRATED_DESIGN_ASSETS_REVERSIBLE_ADJUSTMENT.md`

## Historical decision

This ADR introduced one canonical website-design core with two thin entry modes:

```text
WEBSITE_ONLY
LOGO_AND_WEBSITE
```

and added stronger imagery, truth and visual-release rules.

That correction removed duplicate website doctrines, but real use showed that the two-mode split still left logo and imagery too easy to treat as separate/preparatory concerns. In practice, the operator still had to drive repeated ChatGPT rounds to repair weak photography and integrate generated assets into the final page.

The current decision therefore simplifies the architecture further:

```text
ONE INTEGRATED REDESIGN FLOW
→ mandatory logo assessment: KEEP / REFINE / REDESIGN
→ mandatory visual asset production
→ ASSET_READY
→ HTML
```

The separate `logo-website-design` entry and `00_LOGO` workflow are no longer current architecture.

Git history preserves the full original ADR and implementation for audit/rollback purposes. Do not use this superseded document as current implementation guidance.
