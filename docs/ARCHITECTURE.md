# Architecture v0.3 — Composed MVP

## Architecture objective

The architecture exists to support one commercial learning loop with the smallest possible operational surface.

```text
DISCOVERY
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

## Truth boundaries

### GitHub — software truth

GitHub stores:

- mission and business contracts;
- schemas;
- code;
- tests;
- scoring rubrics;
- prompts that are safe to expose;
- donor/provenance records;
- decisions and roadmap.

### Supabase — operational truth

Supabase is the intended operational store for:

- prospects;
- audits;
- demos;
- mailing status;
- engagement events;
- sales outcome;
- later delivery economics.

For the component spike, adapters may run in fixture/local mode so the pipeline can be tested without real credentials.

## Component strategy

### Discovery

Phase 1 needs sufficient good prospects, not the best possible discovery engine.

Initial implementation:

- small Google Places adapter;
- website required;
- rating/review/category/address/phone captured;
- no multi-source enrichment until needed.

Potential donor later: `Dukotah/leadgen`.

### Audit

Primary donor candidate: `NezbiT/pitch-doctor`.

Why:

- existing-site semantics;
- Playwright screenshots;
- technical/UX/contact/SEO/trust checks;
- business-language output;
- HTML/PDF reporting patterns;
- MIT license.

The local adapter must normalize donor output into our own stable audit schema.

### Qualification

Owned thin logic.

Five factors, each 0–5:

1. Customer Economics
2. Existing Demand
3. Conversion Opportunity
4. Execution Fit
5. Competitive Context

Hard gates precede ranking.

### AI trust boundary

```text
EXTERNAL WEBSITE
→ untrusted fetch/audit
→ extraction/validation
→ VERIFIED_FACTS object
→ conversion brief / demo
```

Downstream generation receives structured verified facts, not raw site instructions.

### Conversion brief

Structured artifact, initially ChatGPT-assisted/human-reviewed. No autonomous service required.

### Demo

Preferred candidate: OpenPage-compatible JSON-first site config.

Benefits:

- deterministic rendering;
- visual correction without source-code editing;
- portable JSON;
- standalone HTML export;
- no need for a universal production builder in Phase 1.

### Preview

Static previews are preferred. Target hosting is Cloudflare static hosting, but the repository must keep preview rendering provider-neutral.

Preview invariants:

- noindex;
- opaque identifier;
- concept/non-affiliation banner;
- no secrets;
- no real lead-capture forms;
- easy disable/delete.

### Print pack

Thin owned module using donor patterns where helpful. Produces a print-ready HTML/PDF-ready artifact containing current vs concept visuals, three opportunity statements and QR/URL.

## Deliberately absent

The following are not architectural dependencies yet:

- queue service;
- realtime dashboard;
- Cloudflare Worker capability gateway;
- ChatGPT MCP;
- automated sales agent;
- production-site factory.

These become candidates only after a measured bottleneck.
