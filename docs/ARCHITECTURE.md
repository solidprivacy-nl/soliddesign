# Architecture v0.3 — Composed MVP

## Architecture objective

The architecture exists to support one commercial learning loop with the smallest possible operational surface.

```text
OVERTURE PLACES
    │
    ▼
DISCOVERY ADAPTER
    │
    ▼
SUPABASE / STATE
    │
    ▼
QUALIFICATION
    │
    ▼
AUDIT
    │
    ▼
HUMAN SELECT
    │
    ▼
VERIFIED FACTS BOUNDARY
    │
    ▼
CONVERSION BRIEF
    │
    ▼
DEMO BUILDER
    │
    ▼
REVIEW
    │
    ▼
STATIC PREVIEW
    │
    ▼
PRINT PACK
    │
    ▼
PHYSICAL MAIL
    │
    ▼
HUMAN SALES
    │
    ▼
CUSTOMER / OUTCOME DATA
    │
    └────────────→ BETTER SELECTION
```

## Architecture principle

> **The business pipeline is stable; individual providers are replaceable.**

SolidDesign owns the contracts between components. It does not import a vendor's entire business model.

## Truth boundaries

### GitHub — software truth

GitHub stores:

- mission and business contracts;
- schemas;
- code and tests;
- discovery contract;
- scoring rubrics;
- prompts safe to expose;
- donor/provenance records;
- decisions and roadmap.

### Supabase — operational truth

The dedicated SolidDesign Supabase project stores operational:

- prospects;
- source/release provenance;
- audits;
- demos;
- mailing status;
- engagement events;
- sales outcome;
- later delivery economics.

For the offline component spike, fixtures/local artifacts remain valid so core logic never depends on live credentials.

## Component strategy

### Discovery — Overture primary

Canonical Phase-1 source:

```text
Overture Maps Places
+
explicit bbox
+
current taxonomy
+
DuckDB
```

Rules:

- no Google API key or billing required;
- existing website required;
- `permanently_closed` records excluded;
- source release recorded;
- Overture GERS/place ID retained where available;
- source confidence retained as **existence evidence**, never interpreted as demand;
- use `basic_category` and `taxonomy`; do not build new logic on deprecated `categories`.

Detailed contract: `DISCOVERY_OVERTURE.md`.

#### Why bbox is explicit

Phase 1 deliberately accepts `west,south,east,north` rather than building a geocoder. This is deterministic, reproducible and removes another external dependency. A market-name resolver is only justified if repeated operator friction proves it necessary.

#### Google Places

Google Places is no longer canonical discovery.

It remains an optional future enrichment/fallback candidate for signals such as rating/review count if measured commercial value justifies the additional provider, billing and credential surface.

No automated Google scraping is part of the architecture.

#### Discovery fallback ladder

```text
Overture only
    ↓ if empirical coverage is insufficient
bounded OSM/Overpass enrichment
    ↓ if still insufficient and economics justify it
targeted commercial source
```

Do not activate multiple sources before evidence demands them.

### Audit

Primary donor: `NezbiT/pitch-doctor`.

Why:

- existing-site semantics;
- Playwright screenshots;
- technical/UX/contact/SEO/trust checks;
- business-language output;
- HTML/PDF reporting patterns;
- MIT license.

The adapter normalizes donor output into SolidDesign's own `AuditResult`; donor internals never become the operational state model.

### Qualification

Owned thin logic.

Five factors, each 0–5:

1. Customer Economics
2. Existing Demand
3. Conversion Opportunity
4. Execution Fit
5. Competitive Context

Hard gates precede ranking.

Important separation:

```text
OVERTURE DISCOVERY
= candidate universe

EXISTING DEMAND SCORE
= separate commercial evidence
```

Overture confidence, website presence or operating status alone cannot prove demand.

### AI trust boundary

```text
OVERTURE / EXTERNAL WEBSITE / THIRD-PARTY DATA
→ UNTRUSTED INPUT
→ extraction + validation
→ VERIFIED_FACTS
→ conversion brief / demo
```

Downstream generation receives structured verified facts, not raw external instructions.

### Conversion brief

Structured artifact, initially ChatGPT-assisted and human-reviewed. No autonomous service required.

### Demo

OpenPage-compatible JSON-first SiteConfig remains the preferred pre-sale representation.

Benefits:

- deterministic rendering;
- visual correction without source-code editing;
- portable JSON;
- standalone HTML;
- no universal production builder needed in Phase 1.

### Preview

Static, provider-neutral preview output.

Target hosting: one Cloudflare static preview area.

Preview invariants:

- `noindex`;
- opaque identifier;
- concept/non-affiliation notice;
- no secrets;
- no real lead-capture forms;
- easy disable/delete.

### Print pack

Thin owned module. Produces current/concept proof, concise findings and personal QR/URL.

## Data model implications

`Prospect` records now preserve discovery provenance:

```text
discovery_source
discovery_version
source_confidence
operating_status
place_id
```

For Overture:

```text
discovery_source = overture
discovery_version = release ID
place_id = Overture GERS/place ID
rating/review_count = null unless separately enriched
```

The Supabase schema mirrors these fields.

## Deliberately absent

Not architectural dependencies yet:

- geocoding service;
- national Overture mirror;
- multi-source entity-resolution engine;
- queue service;
- realtime dashboard;
- Cloudflare Worker capability gateway;
- ChatGPT MCP;
- automated sales agent;
- production-site factory.

These become candidates only after a measured bottleneck.

## Change rule

A provider can be replaced without changing the business model if it continues to satisfy the owned boundary:

```text
DiscoverySource
→ Prospect[]
```

This is sufficient abstraction. Do not add a generalized plugin framework until two live discovery sources are actually required.
