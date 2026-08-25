# Component Spike Contract

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

Canonical live source is now Overture Maps; Google is optional.

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

Site config follows the reviewed OpenPage shape:

```json
{
  "name": "...",
  "blocks": [
    {"id": "...", "type": "hero", "variant": "split", "props": {}}
  ],
  "theme": {}
}
```

Phase 1 deliberately avoids testimonial and contact-form blocks.

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
- no testimonials generated;
- no form block generated;
- preview has noindex + concept banner;
- print pack renders comparison + QR/URL;
- Overture bbox/release validation is deterministic;
- Overture mapping stores source provenance;
- Overture query references `basic_category`/`taxonomy`, not deprecated `categories`;
- complete fixture run has no network dependency.
