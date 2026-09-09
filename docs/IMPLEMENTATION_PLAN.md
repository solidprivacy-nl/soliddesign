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

The phase established the core source-neutral domain and the Overture adapter that remains in use. An experimental Google Places fallback adapter also existed in the original phase but was later retired because no measured current use case justified carrying a fourth discovery path.

Current source tree is authoritative; this historical record must not be used as a file inventory.

Stable lessons from this phase remain valid:

- a free bounded source such as Overture can be sufficient to prove broad discovery technically;
- raw external evidence remains untrusted until validated;
- the pre-sale proof remains separate from customer production delivery;
- deterministic logic should remain deterministic;
- infrastructure is added only when an observed bottleneck earns it.

The later source-agnostic Discovery contract supersedes the original assumption that Overture should define the overall discovery architecture. Current intake paths are documented in `docs/DISCOVERY.md`.

## No longer current planning guidance

The original plan predates the integrated multi-user Operator, prospect assignments, invite workflow, public prospect resolver, engagement telemetry, research import and prospect-first Design cutover. Statements in earlier revisions about a server-only Supabase model, a generic static preview area, single-operator operation, Overture as the only/default architectural discovery authority, optional Google fallback code, or the absence of role/membership state are historical, not current architecture.

Do not extend those earlier concepts. Use `docs/ROADMAP.md` for current implementation work.
