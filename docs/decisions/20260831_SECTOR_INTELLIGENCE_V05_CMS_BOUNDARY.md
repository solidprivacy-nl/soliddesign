# Decision — Sector Intelligence v0.5 CMS boundary

**Date:** 2026-08-31  
**Status:** SUPERSEDED on 2026-09-09 by `20260909_PROSPECT_FIRST_DESIGN_SECTOR_RETIREMENT.md`  
**Historical scope:** this file records the rationale and implementation boundary that applied while Sector Intelligence was active. It is not current architecture.

## Problem at the time

Sector Intelligence had become reusable across prospects, but its first CMS implementation crossed architectural boundaries:

- browser/API contracts exposed technical source and review URLs;
- the operator was sent outside the CMS for review;
- the new server capability reused the already-retired `operator_allowlist` authorization model;
- Sectoronderzoek moved and mirrored Discovery UI state instead of owning its workflow;
- current documentation and CI protected parts of that transitional implementation;
- design bootstrap/handoff resources still exposed repository-host URLs.

The business requirement at that time was to provide reusable sector knowledge, explicit prospect-sector discretion, optional research direction and human review without exposing engineering storage/versioning mechanics.

## Historical solution

The v0.5 implementation kept Markdown/versioning infrastructure behind a narrow server-side Sector Intelligence façade:

```text
CMS
→ human sector term + location + optional direction
→ ChatGPT research
→ deterministic validation
→ pending review
→ CMS human review
→ published Sector Intelligence
```

It reused active `team_members` authorization and hid GitHub transport from operators.

## Why it was later retired

By 2026-09-09 the broader SolidDesign architecture had changed materially:

- discovery had become a separate evidence-rich research workflow;
- the generic design method and Prospect Design Brief were strong enough to evaluate the actual prospect directly;
- Sector Intelligence remained advisory and non-blocking;
- no canonical `prompts/sectors/` overlay had been earned from production evidence;
- maintaining research/review/linkage/lookup machinery added more interface and maintenance burden than demonstrated design value.

The accepted successor decision therefore moved the boundary:

```text
sector
→ Discovery/search/classification only

Prospect Design
→ prospect-specific evidence only
```

See `docs/decisions/20260909_PROSPECT_FIRST_DESIGN_SECTOR_RETIREMENT.md` for current rationale and acceptance criteria.

## Historical value

This decision remains useful as history because it documents why provider/repository mechanics were hidden from normal operators and why active `team_members` became the only authorization truth. Those principles remain valid even though the Sector Intelligence capability itself was retired.
