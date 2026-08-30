# Component Spike Contract — completed Gate-1 record

**Status:** COMPLETED / HISTORICAL TEST CONTRACT  
**Current architecture:** `docs/ARCHITECTURE.md`

This document records the deterministic component-spike contract that proved the original composed approach. Its stable interfaces remain useful, but its Phase-1 scope is not a complete description of the current multi-user/public-delivery system.

If this file conflicts with current architecture/security/operations documents or a later accepted decision, the current documents take precedence.

## Objective

Prove the composed implementation has lower total change-to-learning than importing a complete AI web-agency chassis.

## Golden path

```text
fixture Prospect
→ fixture normalized audit
→ hard gates + 5-factor score
→ VerifiedFacts
→ deterministic ConversionBrief
→ OpenPage-compatible SiteConfig
→ static preview
→ print pack
```

## Stable interfaces

### Discovery → Prospect

`Prospect` is the owned source-neutral boundary.

Canonical live source is Overture Maps; Google is optional enrichment/fallback only when evidence justifies it.

Source provenance fields:

```text
discovery_source
discovery_version
source_confidence
operating_status
place_id
```

This is enough to change a discovery provider without touching scoring/demo logic. Do not build a generalized plugin framework.

### Audit donor → AuditResult

Pitch Doctor is invoked behind a CLI/JSON adapter. Donor internals do not become the domain model.

### Audit/Prospect → VerifiedFacts

This is the AI trust boundary. Raw HTML and unvalidated source data are excluded.

### VerifiedFacts/Brief → SiteConfig

Site config follows the reviewed OpenPage-compatible shape:

```json
{
  "name": "...",
  "blocks": [
    {"id": "...", "type": "hero", "variant": "split", "props": {}}
  ],
  "theme": {}
}
```

The original spike deliberately avoided testimonial and contact-form blocks. That remains a useful trust default for unsolicited pre-sale proofs, not a universal production-site limitation.

## Overture adapter contract

```text
bbox + taxonomy
→ latest/pinned Overture release
→ businesses with website
→ non-closed records
→ Prospect[]
```

The adapter must not:

- interpret Overture confidence as demand;
- use deprecated `categories` for new logic;
- accept arbitrary remote parquet paths;
- require Google credentials.

## Acceptance tests

- score reproducible;
- failed hard gate blocks demo;
- loopback/private metadata URLs rejected;
- no raw HTML crosses VerifiedFacts;
- no invented testimonials generated;
- preview has noindex + concept indication;
- print pack renders comparison + QR/URL;
- Overture bbox/release validation is deterministic;
- Overture mapping stores source provenance;
- Overture query references `basic_category`/`taxonomy`, not deprecated `categories`;
- complete fixture run has no network dependency.
