# ADR — Integrated Logo + Imagery Design Flow as Reversible Adjustment

**Date:** 2026-09-14  
**Status:** accepted for production; technical PR verification complete in PR #56  
**Scope:** SolidDesign design prompt execution only; no database or business-state migration  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business problem

The Website Opportunity concept is useful: it turns raw website evidence into a small set of business-relevant redesign priorities. The execution problem appeared downstream in Design.

During the A. van Berkel pilot, the design process required repeated operator intervention:

- an initial revision was too close to the previous concept;
- later revisions reused weak source photography in prominent positions;
- the operator had to explicitly request new/generated imagery after seeing poor results;
- multiple ChatGPT iterations were required before logo/imagery were treated as design inputs;
- a later concept was visually different but not clearly better;
- the user effectively became the visual QA loop.

That is too cumbersome for the intended SolidDesign operating model.

## Root cause

The prior adjustment improved rule ownership but still framed logo and imagery too much as separable concerns:

```text
WEBSITE_ONLY
versus
LOGO_AND_WEBSITE
```

and treated image-role planning as a prerequisite without making actual asset production the hard boundary before HTML.

This allowed an execution pattern such as:

```text
website layout
→ weak/available source images inserted
→ render
→ operator notices photography problem
→ new image request
→ rebuild/refine
```

The correct design process is the reverse:

```text
business + opportunity
→ brand/logo decision
→ art direction
→ final visual asset production
→ lock assets
→ build once around those exact assets
```

The repository already contained much of this intent in the historical Combined Logo + Website skill: one coherent identity, art-directed imagery, exact locked assets and HTML as the website source of truth. The missing piece was making that behavior mandatory in the canonical prospect Design execution flow rather than optional or a separate mode.

## Decision

SolidDesign has **one integrated redesign flow**.

Logo, brand treatment, imagery and HTML are not separate operator modes.

```text
PROSPECT DESIGN BRIEF
+ reviewed Website Opportunity
+ source website/assets
        ↓
DIAGNOSE
        ↓
LOGO ASSESSMENT
KEEP | REFINE | REDESIGN
        ↓
DESIGN DIRECTION
        ↓
VISUAL ASSET PRODUCTION
logo + prominent imagery
        ↓
ASSET_READY
        ↓
HTML BUILD
        ↓
RENDER DESKTOP + MOBILE
        ↓
CRITIQUE / INTERNAL REPAIR LOOP
        ↓
ONE FINAL PASSING CANDIDATE
```

There is no separate `LOGO_AND_WEBSITE` entry and no standalone logo workflow for normal prospect redesign.

## Logo policy

Every redesign assesses the current logo.

### KEEP
Use the existing logo when it is professionally usable and recognition value outweighs marginal improvement.

### REFINE
Improve craft while preserving the recognizable concept when spacing, geometry, legibility, production quality or digital usability materially limits the design.

### REDESIGN
Use only when the current logo materially obstructs a professional result. Prefer evolutionary redesign over unrelated replacement.

The logo is therefore part of design, but logo redesign is not mandatory.

The exact final website logo is locked as `LOGO_FINAL_01` before HTML.

## Imagery policy

Prominent image roles are defined from the intended composition and customer purpose before choosing pixels.

For each prominent image role determine:

- purpose;
- subject;
- evidence versus illustrative role;
- aspect ratio;
- focal point;
- desktop/mobile crop.

Then resolve the role to the strongest truthful asset using, in order where sensible:

1. suitable real company/project imagery;
2. real source imagery improved through crop/edit/cleanup;
3. grounded art-directed visualization based on verified reality;
4. authentic service/sector-relevant photography;
5. high-quality generated imagery;
6. generic stock only as a last resort.

If an adequate asset does not exist and image generation/editing capability is available, the design run creates/edits the required asset before HTML.

The operator is not expected to identify obvious photographic defects after the website has already been built.

## Truth boundary

Generated imagery is allowed for service illustration, atmosphere and art direction, but must not silently create documentary company evidence.

Do not present unverified generated people, premises, fleet, projects, clients, installations or certifications as if they are real prospect facts.

A generated service photo can illustrate a service. It must not be described as “our technician at this project” unless that is verified.

## `ASSET_READY` gate

No HTML build may start until `ASSET_READY = PASS`.

PASS requires:

- exact final logo locked;
- every prominent image role resolved to an exact asset;
- aspect ratios/focal points/crop intent known;
- coherent art direction across prominent imagery;
- no known low-resolution/amateur asset forced into a dominant role;
- generated imagery remains non-misleading.

If the gate fails, visual asset production continues. It does not hand an avoidably weak website to the operator for feedback.

## Internal refinement instead of operator iteration

The design run may iterate internally, but should normally expose only the strongest passing candidate.

When the actual HTML render reveals that a locked image or logo treatment is still weak:

```text
render failure
→ return to visual asset production
→ replace/re-lock affected asset
→ rebuild
→ re-render
→ critique again
```

The operator should not have to issue separate prompts such as “the photos are poor”, “generate better photos”, “use those in the site”, then “fix their crop”.

## Website Opportunity boundary

Website Opportunity remains unchanged.

It owns:

```text
actual prospect evidence
→ small reviewed set of business/UX opportunities
```

It does **not** own:

- logo direction;
- camera angle;
- photography generation;
- layout;
- typography;
- visual style.

Those remain Design responsibilities.

This preserves the useful evidence-first concept without turning Website Opportunity into a design specification.

## Why this is the smallest complete fix

### Rejected: add an asset-management subsystem

No current requirement justifies a DAM, database asset table, image queue, generation service or asset approval state machine. ChatGPT can resolve assets within the current design run and embed them in self-contained HTML where practical.

### Rejected: keep two design modes

The distinction makes the operator decide something the designer should diagnose. Every website redesign needs a logo assessment; most simply choose KEEP.

### Rejected: mandatory logo redesign

That would destroy useful brand equity and generate unnecessary work. Assessment is mandatory; redesign is conditional.

### Rejected: always generate new photography

Authentic source imagery can be stronger than generated imagery. The rule is professional fitness for the role, not “AI images everywhere”.

### Rejected: keep building then use critique as the image-quality detector

That reproduces the cumbersome operator loop. Asset quality must be resolved before HTML and re-opened internally only when the real render reveals a genuine mismatch.

## Reversibility

This adjustment is deliberately repository-content-only.

### Exact baseline before this adjustment

Production main immediately before the adjustment:

```text
cb19884283f539bcf20584aa1e770df69d2e0738
```

A dedicated rollback branch was created before implementation:

```text
rollback/pre-2026-09-14-design-flow
```

That branch points at the exact pre-adjustment production state.

### Before merge

Close the adjustment PR. Production remains on the baseline.

### After merge

Revert the adjustment squash/merge commit to restore the design behavior from baseline `cb198842...`.

If later unrelated commits exist, use the rollback branch as the exact comparison/reference rather than blindly resetting production history.

No compensating Supabase migration, prospect-state cleanup, artifact deletion or data restoration is required.

Existing design versions remain normal immutable history.

## Files intentionally affected

Expected current-truth changes are limited to:

- `prompts/SOLIDDESIGN_BOOTSTRAP.md`;
- `prompts/core/DESIGN_CONSTITUTION.md`;
- `prompts/workflow/01_DIAGNOSE.md`;
- `prompts/workflow/02_DESIGN_DIRECTION.md`;
- `prompts/workflow/03_BUILD.md`;
- `prompts/workflow/04_CRITIQUE.md`;
- `prompts/library/website-design.md`;
- Prompt Library documentation;
- design prompt regression tests.

Obsolete parallel paths removed:

- `prompts/library/logo-website-design.md`;
- `prompts/workflow/00_LOGO.md`.

No database/runtime schema change is part of this adjustment.

## Acceptance

Technical acceptance requires:

- one active design entry only;
- normal design flow includes logo KEEP / REFINE / REDESIGN assessment;
- no separate logo operator mode remains;
- all prominent image roles are resolved to final assets before HTML;
- `ASSET_READY` is a hard build gate;
- generated imagery truth boundary is explicit;
- failed visual candidates are repaired internally rather than delivered as operator work;
- current two-URL Prospect Design handoff remains valid;
- Website Opportunity contract/storage remains unchanged;
- existing CMS upload → CONCEPT → inspect → LIVE lifecycle remains unchanged;
- CI and PR deploy smoke are green;
- production CI/deploy are green after merge.

### PR verification evidence

Before production merge:

```text
PR #56
head before evidence-only documentation update: db16a9c88546c9e7473dabc9a254f150a345ac94
CI #612 / run 34786498981: SUCCESS
Deploy Operator #237 / run 34786498973: SUCCESS on retry attempt 2
first deploy attempt: static deployment succeeded; transient preview-host root 404 caused smoke failure; unchanged rerun passed
```

The evidence-only documentation update must itself pass the normal CI/deploy checks before merge.

## Qualitative acceptance case

A. van Berkel is the immediate regression case.

A successful run should not require the operator to tell ChatGPT after the first render that the photography is weak. The run should itself identify inadequate prominent source photography, produce/select the necessary professional assets before HTML, use one coherent logo decision and art direction, and deliver one candidate that passes visual critique.

That qualitative result is still human evidence; passing automated tests alone does not prove design quality.
