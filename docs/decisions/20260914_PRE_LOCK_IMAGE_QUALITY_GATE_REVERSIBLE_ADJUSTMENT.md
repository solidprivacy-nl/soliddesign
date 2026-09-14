# ADR — Pre-Lock Image Quality Gate as Reversible Design-Method Adjustment

**Date:** 2026-09-14  
**Status:** proposed in isolated PR; production unchanged until merge  
**Scope:** SolidDesign design prompt execution only  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business problem

The integrated asset flow correctly moved imagery before HTML, but the A. van Berkel pilot exposed a narrower quality-control gap.

Two prominent images were topically related to plumbing/installations yet still commercially weak:

- the hero/service image showed a technician working around visibly worn/damaged radiator components, creating an unintended deterioration/repair impression where professional workmanship and trust should dominate;
- a supporting image showed an ambiguous copper-pipe/valve arrangement whose subject and meaning were not immediately understandable.

The operator had to identify these problems after seeing the rendered result.

## Root cause

The current flow already did:

```text
image role
→ candidate image selection/generation
→ asset lock
→ ASSET_READY
→ HTML
→ rendered critique
```

but did not contain a mandatory admission test between candidate selection and asset lock.

That allowed a candidate to be locked because it was approximately sector-relevant, technically usable or visually interesting even when it communicated the wrong perception, was ambiguous, or was weak in the intended composition.

The existing later critique can catch such mistakes, but using the render as the primary image-quality detector is unnecessarily late and recreates operator-driven repair loops.

## Decision

Add one mandatory **Pre-Lock Image Quality Gate** inside Workflow 02.

The revised flow is:

```text
image role definition
→ candidate image selection / edit / generation
→ PRE-LOCK IMAGE QUALITY GATE
→ hard PASS/FAIL
→ lock only passing imagery
→ ASSET_READY
→ HTML
→ rendered critique
```

The gate evaluates the exact candidate in its intended role/crop on six dimensions:

1. immediate clarity;
2. desired perception;
3. business/message relevance;
4. credibility and physical plausibility;
5. composition fit;
6. visual craft.

A material failure on any dimension is FAIL.

There is no numeric image score. Strong lighting or aesthetics may not average away a serious ambiguity, credibility or perception problem.

## Why hard PASS/FAIL

A weighted score would add false precision and create undesirable compensation behavior.

Examples that must remain release-blocking regardless of strengths elsewhere:

- a technically impossible generated installation;
- an image whose final crop makes the activity unreadable;
- a dominant damaged/dirty subject that communicates the wrong brand impression;
- generic sector stock that does not support the actual section;
- an attractive image that is materially misleading.

For this scope, binary admission is the smallest and clearest decision rule.

## Rendered regression rule

Asset lock remains useful, but it may not protect a bad decision.

If the final rendered page reveals that a previously passing image is ambiguous, creates an unintended perception, becomes implausible in context or simply fails compositionally, Workflow 04 returns internally to Workflow 02:

```text
rendered image-quality regression
→ unlock affected asset
→ select/edit/generate replacement
→ repeat Pre-Lock Image Quality Gate
→ re-lock
→ rebuild
→ re-render
→ critique again
```

This preserves fidelity to deliberate assets without turning asset lock into fidelity to a mistake.

## Architecture boundary

This is deliberately a design-method adjustment only.

No Supabase schema, data, RPC or migration is added.

No CMS runtime component, image-review screen, approval state, scoring model, vision service, queue or asset database is added.

The gate runs inside the ChatGPT design execution method before `ASSET_READY`.

The existing CMS remains responsible for upload, preview/inspection and publish lifecycle; it does not become the primary image-selection engine.

## Why this is the smallest complete fix

### Rejected: CMS image-quality workflow

The problem originates during design selection. Moving quality judgment downstream into CMS would duplicate design responsibility and add runtime/state complexity.

### Rejected: automatic vision scorer

No operating evidence shows that a separate scorer/service is necessary. The current model can perform the six qualitative checks inside the same design run.

### Rejected: numeric rubric

The requirement is admission safety, not comparative ranking. A hard PASS/FAIL gate is simpler and prevents serious failures being averaged away.

### Rejected: always generate multiple alternatives

Mandatory candidate counts create unnecessary work. Generate/select another candidate only when the current candidate fails or when comparison is genuinely useful.

## Reversibility

This adjustment is repository-content-only and is isolated from production state.

### Exact production baseline before this adjustment

```text
4393af7b19d4446c4cc14661ec096570b62f568f
```

A dedicated rollback reference was created before implementation:

```text
rollback/pre-2026-09-14-image-quality-gate
```

It points at the exact pre-adjustment production state.

### Before merge

Close the PR. Production remains unchanged.

### After merge

Revert the adjustment merge/squash commit to remove the gate while preserving later unrelated history.

Use the rollback branch as the exact comparison/reference if needed.

No Supabase rollback, CMS data cleanup, artifact deletion or prospect-state restoration is required.

Existing immutable design/demo versions remain valid history.

## Files intentionally affected

The smallest current-truth change is limited to:

- `prompts/SOLIDDESIGN_BOOTSTRAP.md`;
- `prompts/workflow/02_DESIGN_DIRECTION.md`;
- `prompts/workflow/04_CRITIQUE.md`;
- `tests/test_design_prompt_core.py`;
- this ADR.

No other prompt path or runtime subsystem is required.

## Acceptance

Technical acceptance requires:

- the canonical redesign sequence shows the Pre-Lock Image Quality Gate before image lock and `ASSET_READY`;
- every prominent image requires `IMAGE_QUALITY_GATE = PASS` before lock;
- all six qualitative dimensions are present;
- one material dimension failure blocks lock;
- no numeric `IMAGE_QUALITY_SCORE` mechanism exists;
- Workflow 04 can reopen a wrong image lock when the real render exposes a material problem;
- no CMS/Supabase/runtime architecture is added;
- design prompt regression tests pass;
- normal CI passes on the exact PR head.

## Qualitative regression case

A. van Berkel is the immediate human acceptance case.

Under the revised method:

- a radiator/repair image dominated by worn or damaged components should fail **Desired perception** unless deterioration/repair is explicitly the intended message;
- an unclear copper-pipe technical still life should fail **Immediate clarity** when a normal visitor cannot quickly understand what is being shown and why it supports the section;
- replacement imagery should be evaluated in the exact intended crop and page role before it becomes a locked asset.

Automated prompt tests prove the gate is present. They do not prove image taste. Final qualitative validation remains the rendered A. van Berkel redesign and subsequent real prospect work.
