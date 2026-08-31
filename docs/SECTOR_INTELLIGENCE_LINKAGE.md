# Sector Intelligence linkage

**Status:** architecture v0.4  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business goal

Research a market once, keep the result reusable, and make it available to any relevant prospect regardless of how that prospect entered SolidDesign.

A prospect found through an Overture area search, a prospect entered through a direct URL, and a prospect added by another future discovery source must all use the same Sector Intelligence mechanism.

## First-principles model

Discovery provenance and sector identity are different facts:

```text
Discovery run = how did we find this company?
Canonical sector = what market does this prospect belong to for reusable design intelligence?
```

They must not be coupled.

The minimal model is therefore:

```text
Prospect
  → canonical_sector_key
  → sector-intelligence/<canonical_sector_key>.md
```

The Markdown file in GitHub remains the canonical Sector Intelligence artifact. No second research-content table is introduced in Supabase.

## Prospect sector identity

`prospects.canonical_sector_key` is the primary machine identity for the prospect's sector.

Rules:

- one primary sector per prospect;
- canonical value is a validated Overture Places category key;
- the human sector term remains the research/search language and need not equal the canonical key;
- design briefs prefer the prospect's explicit `canonical_sector_key`;
- the old single-sector discovery-run value is only a backwards-compatible fallback;
- changing a prospect's sector does not rewrite its discovery provenance.

A many-to-many sector model is deliberately not introduced. It is not needed for the current business goal and would add ambiguity to design research selection.

## Automatic versus explicit linkage

Automate only when the sector is genuinely known.

### Single-sector area discovery

When an AREA discovery run contains exactly one validated canonical sector, new candidates inherit that sector automatically.

### Multi-sector area discovery

No automatic primary-sector choice is made. An operator can explicitly link the correct sector later.

### Direct URL discovery

A URL alone is not sufficient evidence for a reliable sector classification. SolidDesign therefore does not guess. The resulting company/candidate can be linked to a sector explicitly from the Sectoronderzoek workspace.

This avoids an unnecessary AI classification step and prevents silent category errors.

## CMS workspace

`Sectoronderzoek` is a first-class Operator workspace alongside `Prospects` and `Bedrijven zoeken`.

It provides three small capabilities:

1. **Research** — enter a human sector term and starting location and reuse the existing validated prompt + publication workflow.
2. **Overview** — see which canonical sectors are published and which have a Sector Intelligence PR in review.
3. **Link** — choose any non-archived company/prospect and link a validated canonical sector to it.

The prospect Design tab also exposes its current sector link and a direct route to Sectoronderzoek.

The existing clipboard handoff to ChatGPT remains for now. It is a human-in-the-loop research boundary, not a data-model dependency. The new architecture removes the more important coupling: research is no longer tied to the discovery form or discovery run that happened to create a prospect.

## Research lifecycle

The existing publication boundary remains unchanged:

```text
CMS
→ research prompt
→ ChatGPT research
→ validated Markdown result
→ constrained CMS publication endpoint
→ GitHub branch + PR
→ review
→ main
```

Only research merged into `main` is consumed as published Sector Intelligence by design briefs. An open research PR is visible in the CMS as `In review`, but is not treated as published evidence.

## Design brief lookup

The lookup order is:

```text
1. prospect.canonical_sector_key
2. legacy single-sector discovery-run key (compatibility only)
3. no Sector Intelligence
```

This means a direct-URL prospect becomes Sector Intelligence-aware immediately after an operator links its sector; no new discovery run is required.

## Non-goals

This change deliberately does not add:

- a Sector Intelligence content table in Supabase;
- background research jobs;
- automatic LLM classification of arbitrary websites;
- multiple sectors per prospect;
- automatic promotion of research PRs;
- automatic mutation of an existing LIVE mock-up.

Those additions would increase complexity without being necessary to meet the current business objective.
