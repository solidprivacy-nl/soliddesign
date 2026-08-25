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

Stable internal `Prospect` fields let us replace Google Places later without touching scoring/demo logic.

### Audit donor → AuditResult

Pitch Doctor is invoked behind a CLI/JSON adapter. Donor internals do not become our domain model.

### Audit/Prospect → VerifiedFacts

This is the AI trust boundary. Raw HTML is excluded.

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

## Acceptance tests

- score is reproducible;
- failed hard gate blocks demo;
- loopback/private metadata URLs are rejected;
- no raw HTML crosses VerifiedFacts;
- no testimonials are generated;
- no form block is generated;
- preview has noindex + concept banner;
- print pack renders comparison + QR/URL;
- the complete fixture run has no network dependency.
