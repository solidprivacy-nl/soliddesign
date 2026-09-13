# ADR — Canonical Website Design Core as Reversible Adjustment

**Date:** 2026-09-13  
**Status:** accepted reversible adjustment; implementation tracked in PR #55  
**Scope:** design prompt architecture only; no database or business-state migration  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Context

The M8.3 Website Opportunity pilot exposed a design-quality problem during the A. van Berkel case:

- an initial revision was materially too similar to the previous concept;
- a subsequent revision changed composition but reused weak/low-resolution source imagery in prominent roles;
- customer-facing copy leaked design-process language such as commentary about the existing website/concept;
- the technically valid candidate should have been rejected by visual review before delivery.

This case alone is not sufficient evidence to invent new broad design heuristics. The root-cause correction is justified because the repository already contained the stronger rules in the previous Combined Logo + Website method: art-directed imagery, image locking, HTML-as-source-of-truth, refinement and rejection of weak literal source-photo reuse. The defect was that those rules lived in a duplicated operator prompt while the prospect Design workflow already had a separate canonical Bootstrap + core/workflow method.

The repository therefore had two partially competing website-design doctrines.

## Problem

Current state before this adjustment:

```text
Prospect Design handoff
→ SOLIDDESIGN_BOOTSTRAP.md
→ DESIGN_CONSTITUTION.md
→ workflows 01–04

Prompt Library website-design
→ embedded Combined Logo + Website skill
→ separate website rules + mandatory logo redesign
```

This creates three failure modes:

1. **scope ambiguity** — a normal website redesign can silently become a logo redesign;
2. **rule divergence** — art direction, image locking and acceptance rules may differ depending on entry path;
3. **preservation ambiguity** — “preserve what works” can be misread as preserving weak source pixels/layout rather than preserving identity and truth.

## Decision

Keep one canonical website-design method and two thin entry modes.

```text
WEBSITE_ONLY
website-design.md
        ↓
SOLIDDESIGN_BOOTSTRAP.md
        ↓
DESIGN_CONSTITUTION.md
        ↓
workflows 01–04

LOGO_AND_WEBSITE
logo-website-design.md
        ↓
workflow/00_LOGO.md
        ↓
lock LOGO_FINAL_01
        ↓
SOLIDDESIGN_BOOTSTRAP.md
        ↓
the same DESIGN_CONSTITUTION.md + workflows 01–04
```

There is no second website core for combined logo+website work.

## Design doctrine clarification

The shared website method now uses one explicit boundary:

> **Preserve identity. Re-evaluate execution.**

Before redesign, source elements are classified as:

```text
LOCK
verified facts, company name, approved logo in WEBSITE_ONLY,
verified contact/proof

PRESERVE / EVOLVE
recognizable colors, customer terminology, useful service groups,
real trust assets, useful navigation concepts

FREE TO REDESIGN
layout, hierarchy, typography scale, spacing, CTA presentation,
component structure, image treatment/crops, responsive composition

REPLACE WHEN WEAK
low-resolution imagery, amateur dominant photography,
screenshot-like fragments, obsolete/confusing UI,
generic filler, decorative clutter
```

This does not authorize rebranding. It removes accidental preservation rights from weak execution.

## Imagery decision

Prominent imagery is planned before HTML implementation.

For every prominent image role, decide first:

- customer purpose;
- subject;
- aspect ratio;
- crop/focal point;
- desktop/mobile behavior;
- evidence vs atmosphere/illustration role.

Then choose the strongest truthful asset in this order:

1. strong real company/project image;
2. grounded art-directed visualization based on verified reality;
3. authentic sector-relevant photography;
4. high-quality generated image;
5. generic stock only as last resort.

Generated imagery may improve presentation but may not fabricate documentary company evidence. Unverified people, premises, fleet, projects, clients or installations must not be presented as if they are real company proof.

## Customer-copy boundary

Customer-facing website copy must speak only as the prospect business to its customers.

The candidate fails when it exposes:

- audit terminology;
- redesign rationale;
- CMS/SolidDesign terminology;
- “the current/existing website”;
- “in this concept”;
- “we moved / we improved”;
- internal design-review language.

## Release gate

Technical validity is insufficient.

A candidate is `REVISE` when a prominent visual contains materially weak image quality/cropping, inconsistent art direction, collage-like recycled source fragments, broken assets, or generated imagery that misrepresents company-specific reality.

A candidate must also show a material source/current → candidate improvement before it is deliverable.

## Why this is the smallest complete fix

Rejected alternatives:

### Add another large redesign prompt

Rejected because it would create a third website doctrine and increase drift.

### Replace all source photography with generated imagery

Rejected because authenticity can be more valuable than polish and because generated imagery can create factual ambiguity.

### Add a scoring engine or visual QA service

Rejected because current evidence does not justify new runtime architecture. The problem is prompt ownership and release discipline, not missing infrastructure.

### Feature-flag the design method

Rejected because the adjustment is repository-content-only and Git/PR rollback already provides a simpler reversible boundary.

## Reversibility

This adjustment is intentionally easy to reverse.

It changes only:

- repository-managed prompt Markdown;
- prompt documentation;
- regression tests.

It does **not** change:

- Supabase schema;
- persisted prospect state;
- Website Opportunity JSON contract;
- audit semantics;
- design artifact lifecycle;
- publishing behavior;
- operator authorization;
- outreach state.

### Before merge

Close the pull request. Production remains unchanged.

### After merge

Revert the adjustment merge/squash commit.

No compensating database migration, data deletion or state restoration is required. Existing design artifacts remain immutable history and can remain in the CMS normally.

## Acceptance

Technical acceptance requires:

- `website-design` is a thin WEBSITE_ONLY wrapper around the canonical Bootstrap;
- normal website work does not require logo redesign;
- `logo-website-design` runs only the optional logo workflow before the same Bootstrap;
- the optional logo workflow contains no duplicate website method;
- the shared core distinguishes identity from execution;
- image roles/assets are decided and locked before HTML build;
- weak literal source-photo reuse is release-blocking when it materially degrades the candidate;
- customer-facing process commentary is release-blocking;
- generated imagery remains grounded and non-misleading;
- existing prospect Design two-URL handoff remains valid;
- no new database/runtime subsystem exists;
- CI and PR deployment smoke are green.

Commercial acceptance remains evidence-gated by real prospect use. A. van Berkel is the immediate regression case, but this adjustment is primarily a consolidation of already-existing SolidDesign rules rather than a new universal heuristic inferred from one prospect.
