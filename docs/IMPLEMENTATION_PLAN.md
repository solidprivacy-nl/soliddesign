# Implementation Plan — Gate 1/2 historical record

**Status:** COMPLETED / HISTORICAL  
**Current execution plan:** `docs/ROADMAP.md`  
**Current architecture:** `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`

## Purpose of this file

This file records the implementation sequence that established the original composed MVP and the first live Dutch proof. It is retained for traceability, not as an instruction set for current or future architecture work.

If anything here conflicts with the current architecture, security baseline, roadmap or a later accepted decision, the current documents take precedence as defined in `docs/ARCHITECTURE.md`.

## Completed objective

The original objective was to prove that one real Dutch prospect could move through the internal pre-sale pipeline without importing a large platform or requiring a paid discovery API.

The proven sequence was:

```text
Overture bounded discovery
→ selected real prospect
→ Pitch Doctor audit
→ human qualification
→ Verified Facts
→ conversion/design proof
→ Supabase operational state
→ Cloudflare preview delivery
→ print-pack / physical-mail preparation
```

The offline vertical slice and Gate-2 live integration are complete. Evidence lives under `docs/evidence/`.

## Components established by this phase

```text
src/soliddesign/
├── models.py
├── states.py
├── qualification.py
├── verified_facts.py
├── brief.py
├── discovery/
│   ├── overture.py
│   └── google_places.py     # optional fallback/enrichment only
├── audit/
│   └── adapter.py
├── demo/
│   └── openpage.py
├── print_pack/
│   └── renderer.py
└── cli.py
```

Stable conclusions from this phase remain valid:

- Overture is the canonical discovery source unless evidence justifies a fallback;
- raw external evidence remains untrusted until validated;
- the pre-sale proof remains separate from customer production delivery;
- deterministic logic should remain deterministic;
- infrastructure is added only when an observed bottleneck earns it.

## No longer current planning guidance

The original plan predates the integrated multi-user Operator, prospect assignments, invite workflow, public prospect resolver and engagement telemetry. Statements in earlier revisions about a server-only Supabase model, a generic static preview area, single-operator operation or the absence of role/membership state are therefore historical, not current architecture.

Do not extend those earlier concepts. Use `docs/ROADMAP.md` for current implementation work.
