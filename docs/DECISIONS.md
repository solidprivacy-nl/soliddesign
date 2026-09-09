# Architecture and Business Decisions

This file is the concise decision index. Dated files under `docs/decisions/` preserve expanded rationale where one exists.

Current architecture always follows the documentation precedence in `docs/ARCHITECTURE.md`. A historical ADR may explain why a path once existed without remaining current runtime policy.

## ADR-001 — Optimize for learning, not platform completeness

**Decision:** Phase 1 prioritizes reliable commercial learning over architectural completeness.

**Consequence:** queues, realtime dashboards, agent fabrics and autonomous outbound are deferred until observed friction justifies them.

## ADR-002 — Compose before full-chassis adoption

**Decision:** use a small composition of semantically aligned components rather than importing a complete AI web-agency chassis.

## ADR-003 — Supabase as operational state

**Decision:** operational prospect/audit/demo/mailing/outcome data uses the dedicated SolidDesign Supabase project.

## ADR-004 — GitHub as software/documentation truth

**Decision:** mission, code, tests, reusable prompts/methods, provenance, architecture and decisions live in GitHub. Supabase remains business state.

## ADR-005 — Pre-sale proof separated from production delivery

**Decision:** optimize pre-sale demo for persuasion, speed, correctness and editability. Production delivery architecture is selected from real customer requirements.

## ADR-006 — Physical mail + human sales

**Decision:** Phase 1 uses personalized physical mail for outbound attention and human sales after engagement. Automated cold outreach is not MVP scope.

## ADR-007 — Five-factor unweighted qualification

**Decision:** use hard gates plus five 0–5 rubrics; do not introduce arbitrary factor weights before outcome data.

## ADR-008 — Repository safety boundary

**Decision:** repository content contains no secrets or raw private prospect/customer datasets. Confidentiality requirements must be solved by an actual access/execution boundary, not obscurity.

## ADR-009 — Overture as Phase-1 open discovery source

**Date:** 2026-08-25  
**Historical/current nuance:** Overture replaced Google Places as the default Phase-1 open discovery provider. Since M7, SolidDesign discovery is source-agnostic at the business boundary and also supports Research Import and Specific URL intake.

**Still current:** Overture remains the supported broad-search adapter while it earns useful recall. It is not the definition of Discovery itself.

## ADR-010 — Demand evidence is independent from discovery-source existence

**Decision:** Overture presence, confidence, operating status and website presence cannot by themselves establish Existing Demand.

## ADR-011 — Explicit bbox before unnecessary geography architecture

**Decision:** deterministic bounded geography remains preferred for reproducible technical discovery. Normal CMS UX may use the existing geocoding path where it already solves operator need.

## ADR-012 — Use current Overture taxonomy fields

**Decision:** SolidDesign discovery uses supported Overture taxonomy/category fields rather than deprecated legacy category structures.

## ADR-013 — Add discovery sources only after measured need

**Historical decision:** start with the smallest proven source set rather than activating multiple providers pre-emptively.

**Current expression:** Research, Overture and Specific URL are three concrete intake paths into one candidate boundary. Do not build a provider framework until real duplication earns it.

## ADR-014 — Raw donor audit is evidence; prospect-facing audit is root-cause reviewed

**Date:** 2026-08-25

**Decision:** preserve raw Pitch Doctor evidence, but require root-cause-aware normalization/human interpretation before findings become prospect-facing proof or sales copy.

```text
RAW DONOR AUDIT
→ preserve
→ identify root cause
→ collapse cascading unknowns
→ reviewed AuditResult
→ verified design/sales evidence
```

## ADR-015 — Sector Intelligence via ChatGPT + GitHub

**Date:** 2026-08-27  
**Status:** **SUPERSEDED 2026-09-09 by ADR-017.**

Historical decision: reuse ChatGPT + GitHub Markdown to create advisory reusable sector design research rather than a research database/service.

This remains history only. The Sector Intelligence capability and design lookup are retired.

## ADR-016 — Hide Sector Intelligence repository mechanics from operators

**Date:** 2026-08-28  
**Status:** **SUPERSEDED 2026-09-09 by ADR-017 as a Sector Intelligence capability decision.**

Historical decision: if Sector Intelligence existed, its GitHub transport/review mechanics should stay behind the CMS and active `team_members` authorization should remain the only membership authority.

The broader principles remain current:

- operators work with business concepts rather than repository plumbing;
- active `team_members` is the authorization truth;
- server credentials never enter browser code.

The Sector Intelligence UI/API/publication flow itself is retired.

## ADR-017 — Prospect-first Design; sector stops at the Discovery boundary

**Date:** 2026-09-09  
**Status:** **ACCEPTED / CURRENT**  
**Expanded decision:** `docs/decisions/20260909_PROSPECT_FIRST_DESIGN_SECTOR_RETIREMENT.md`

### Decision

Sector is a Discovery/search/classification input. It is not a Prospect Design input.

```text
DISCOVERY
sector + location
→ research / Overture category resolution
→ candidate/prospect

DESIGN
actual prospect evidence
→ prospect-specific redesign
```

`canonical_sector_key` may remain as legitimate discovery/provenance metadata when naturally available. A direct-URL prospect may have none.

### Retired

- top-level Sectoronderzoek workspace;
- Sector Intelligence research/review/publication;
- manual prospect-sector linking;
- `Sector voor design`;
- sector-specific improvement prompt;
- Sector Intelligence/canonical-sector lookup in Design Brief and Design Bootstrap;
- unused `prompts/sectors/` overlay hook;
- associated API/UI/RPC/test/deploy paths.

### Prospect Design UX

Normal operator flow:

```text
1. Kopieer designopdracht
2. Werk in ChatGPT
3. Upload resultaat
```

There is one primary ChatGPT action. Project settings are secondary. Website versioning and Printmailing/Outreach boundaries remain unchanged.

### Governing rule

> Design the actual prospect, not an abstract sector.
