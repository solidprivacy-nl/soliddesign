# Decision — Sector Intelligence v0.5 CMS boundary

**Date:** 2026-08-31  
**Status:** accepted architecture for the v0.5 reconciliation  
**Supersedes:** ADR-016 only where ADR-016 describes current authorization, operator review mechanics or operator-visible repository concepts. ADR-015/016 remain historical rationale for using existing version-control infrastructure rather than adding a research datastore.

## Problem

Sector Intelligence correctly became reusable across prospects, but its first CMS implementation crossed architectural boundaries:

- browser/API contracts exposed technical source and review URLs;
- the operator was sent outside the CMS for review;
- the new server capability reused the already-retired `operator_allowlist` authorization model;
- Sectoronderzoek moved and mirrored Discovery UI state instead of owning its workflow;
- current documentation and CI protected parts of that transitional implementation;
- design bootstrap/handoff resources still exposed repository-host URLs.

The business requirement is simpler: operators need reusable sector knowledge, explicit prospect-sector discretion, optional research direction and human review without needing to know how SolidDesign stores or versions that knowledge.

## Hard requirements

- one primary canonical sector per prospect;
- operator may explicitly assign or correct that sector, including for a manually added URL;
- human market language remains separate from machine identity;
- optional operator research direction is challengeable input, not approved evidence;
- broad autonomous sector research remains intact;
- human review is required before new research becomes published design evidence;
- normal CMS users have zero exposure to repository hostnames, repository identity, branches, pull requests, technical review URLs or storage paths;
- active `team_members` membership is the sole application authorization truth;
- no second research database, reference library, task engine or review subsystem is introduced.

## Simplest viable solution

Keep the existing canonical Markdown/versioning infrastructure behind one narrow server-side Sector Intelligence façade.

```text
CMS
→ human sector term + location + optional direction
→ ChatGPT research
→ deterministic validation
→ pending review
→ CMS human review
→ published Sector Intelligence
```

The browser sees domain state only:

```text
Beschikbaar
Ter beoordeling
Bijwerking ter beoordeling
Bekijken
Beoordelen
Publiceer
Afwijzen
```

Discovery and Sectoronderzoek share only the validated sector resolver. Sectoronderzoek owns its own inputs, prompt generation, clipboard handoff, result processing, review and linkage UI.

Canonical prompts and published Sector Intelligence remain single-source files in source control, but the existing Pages deployment copies them into the CMS static deployment. ChatGPT and operators therefore consume only SolidDesign-owned CMS URLs. No runtime proxy or second prompt store is added.

## Authorization

All Sector Intelligence CMS capabilities use:

```text
auth.uid()
→ active team_members
→ operator_is_active_team_member()
```

The retired `operator_allowlist` model is explicitly forbidden as a fallback or second authority.

## Operator research direction

`Aanvullende onderzoeksrichting` is one optional free-text field. It may contain URLs, observations or other research context.

The research instruction treats this as a hypothesis that must be independently inspected and may be rejected. No URL entity, rating system, tag model or reusable reference library is created.

## Review and versioning

Human review happens inside the CMS. The backend may internally use existing version-control review/versioning mechanics, but those mechanics are not browser/API domain concepts.

A successful publish/reject action is a business result. Best-effort technical cleanup after that result must not turn the completed business action into an apparent failure.

## Failure modes addressed

- stale authorization executor → one current membership predicate;
- GitHub/provider leakage → server-only transport + static CMS-owned design resources;
- duplicate executors → one Sector Intelligence server façade;
- hidden Discovery coupling → self-contained Sectoronderzoek workspace;
- operator bias → challengeable optional direction, autonomous research preserved;
- CI preserving transitional behavior → tests/gates assert architectural invariants instead of DOM wiring;
- stale current docs → v0.5 contracts and current operating architecture reconciled.

## Rejected alternatives

- **Sector Intelligence table in Supabase:** duplicates content/version state without business need.
- **Reference-management subsystem:** solves a larger problem than observed; free text is sufficient.
- **Runtime repository proxy:** adds a moving part when deployment-time static copy solves the exposure problem.
- **Automatic AI classification of arbitrary URLs:** URL alone is weak evidence and unnecessary when operator discretion exists.
- **Many-to-many prospect sectors:** no demonstrated design-selection need.

## Reversibility

High. Prospect sector identity is one existing field; research remains Markdown; the CMS façade and static deployment copy are thin. No new operational datastore or background system is introduced.

## Final rule

> SolidDesign operators work with business concepts. Engineering transport remains an implementation detail.
