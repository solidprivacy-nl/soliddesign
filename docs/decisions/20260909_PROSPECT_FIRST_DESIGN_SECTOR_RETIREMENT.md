# Decision — Prospect-first Design and Sector Intelligence retirement

**Date:** 2026-09-09  
**Status:** ACCEPTED  
**Supersedes:** ADR-015, ADR-016 and `20260831_SECTOR_INTELLIGENCE_V05_CMS_BOUNDARY.md` as current architecture.

## Problem

SolidDesign had accumulated a reusable Sector Intelligence workflow intended to improve prospect design quality. In practice that advisory layer expanded into:

- a first-class `Sectoronderzoek` CMS workspace;
- research, review and publication flow;
- manual prospect-sector linking;
- sector selection inside the Prospect Design tab;
- a second sector-informed design-improvement prompt;
- canonical-sector lookup in the Prospect Design Brief;
- automatic Sector Intelligence loading in the Design Bootstrap;
- a conditional sector-overlay hook with no canonical overlays;
- dedicated API, repository content, tests and deployment smoke paths.

The actual design problem is simpler: create a materially better redesign for the specific prospect from direct evidence about that prospect.

Sector remains useful upstream for finding businesses, but its use as downstream design context added operator concepts and maintenance without demonstrated business-value evidence.

## First-principles decision

Split the concerns at the Prospect boundary:

```text
DISCOVERY
sector + location may define search scope
sector may resolve to Overture taxonomy
candidate may retain classification/provenance
        ↓
PROSPECT
        ↓
DESIGN
no sector lookup
no sector research
no sector template/preset
```

Design uses:

```text
current operator/user instruction
+ SolidDesign design method
+ Prospect Design Brief / verified facts
+ source website / source assets / screenshots
+ current LIVE / current concept
+ other relevant evidence
```

Governing rule:

> Sector helps SolidDesign find and classify businesses. It does not determine how a prospect is designed.

## Sector data that remains

`canonical_sector_key` remains in the operational model where discovery naturally produces a validated key.

Reasons to retain it:

- current Research and Overture discovery already use it legitimately;
- it is useful provenance/classification data;
- deleting the field would add migration and regression risk without simplifying the operator workflow.

It is not required for a prospect. Direct-URL prospects may have no canonical key.

No operator-facing design capability may depend on it.

## Retired capabilities

Remove active runtime and current documentation for:

- top-level `Sectoronderzoek` navigation/workspace;
- Sector Intelligence research/review/publication;
- manual prospect-sector linking;
- `Sector voor design` selector;
- sector-specific design-improvement action;
- Sector Intelligence in Design Briefs;
- Sector Intelligence / `prompts/sectors/` loading in the Design Bootstrap;
- Sector Intelligence API/browser modules;
- now-unused sector-linking RPCs.

Historical database migrations and Git history remain history. Runtime functions with no caller are removed through a forward migration rather than rewriting migration history.

## Prospect Design UX

The normal Design workflow becomes:

```text
1. Kopieer designopdracht
2. Werk in ChatGPT
3. Upload resultaat
```

Primary surface:

- optional persistent `Designinstructie`;
- one primary `Kopieer designopdracht` action;
- ChatGPT project link only when configured;
- project settings behind progressive disclosure.

The primary copy action saves the prospect-specific instruction, generates the current Design Brief and copies the existing two-URL handoff:

```text
stable start-design URL
current Prospect Design Brief URL
```

The two-URL handoff remains because it is already a proven small system boundary. This cutover does not move prospect Design into the operator Prompt Library.

## Artifact lifecycle

Website artifact lifecycle remains:

```text
HTML/ZIP upload
→ CONCEPT
→ review
→ explicit LIVE publication
```

External preview links remain a secondary review escape hatch.

Printmailing responsibility remains:

```text
DESIGN → create/version artifact
OUTREACH → select exact artifact and record physical send
```

No new state or workflow is introduced.

## Rejected alternatives

### Keep Sector Intelligence but hide the menu
Rejected. It leaves design-side lookup, stale state and maintenance complexity while merely concealing it from the UI.

### Keep sector overlays for possible future use
Rejected. No canonical overlay currently exists. Retaining a conditional framework for hypothetical future patterns violates YAGNI.

### Remove sector everywhere including Discovery/data
Rejected. Sector has an actual search/taxonomy function in Research and Overture. Removing `canonical_sector_key` would create migration risk without improving the Design workflow.

### Move prospect Design into Prompt Library during this cutover
Rejected. Prompt Library and the system-governed prospect Design handoff solve different problems. Combining them expands scope without an observed operator need.

### Rework the old private-repository Design PR around the new model
Rejected when the old candidate contains extensive sector-dependent UX. Sunk-cost preservation is not a reason to maintain a large stale candidate. Future provider/private-repository work should start from current `main`.

## Reversibility

High.

Discovery-sector data remains available. If future real outcomes prove that a category-specific design rule materially improves results and cannot cleanly become part of the generic design method, a narrow conditional mechanism can be reintroduced from evidence.

Do not preserve current runtime complexity merely to make that hypothetical reversal easier.

## Acceptance

The cutover is complete only when:

- Discovery sector inputs/resolution still work;
- direct-URL prospects work without sector classification;
- Prospect Design works without `canonical_sector_key`;
- Design exposes one primary ChatGPT action;
- Design Brief and Bootstrap perform no sector lookup;
- concept upload/LIVE publication remains intact;
- printmailing Design/Outreach boundary remains intact;
- Sector Intelligence UI/API/content and manual-linking RPCs are absent from current runtime;
- obsolete Sector Intelligence PRs are closed;
- old sector-dependent Design candidate work is superseded;
- current docs, tests, CI and deploy smoke all enforce the same boundary;
- production behavior and database state are verified.

## Final rule

> Design the actual prospect, not an abstract sector.
