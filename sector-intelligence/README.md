# SolidDesign Sector Intelligence

**Status:** canonical v0.5  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

Sector Intelligence is reusable external design research for one canonical business sector. It raises the quality bar of future SolidDesign concepts without turning sectors into templates.

## Core principles

1. **Research once per sector; reuse many times per prospect.**
2. **Ontology identifies; market language guides research.** The Overture key is stable machine identity; the human sector term defines market meaning.
3. **Operator judgement may guide research, but never becomes truth automatically.** Optional operator direction is challengeable research input.
4. **External references produce principles, never templates.** Do not copy branding, copy, layouts or distinctive creative elements.
5. **Sector Intelligence is advisory evidence.** Verified prospect facts, prospect-specific direction and the SolidDesign design method outrank it.
6. **One primary sector per prospect.** The operator may explicitly correct or assign that sector.
7. **No extra state plane.** Published research remains one canonical Markdown artifact per sector; no Sector Intelligence content table is introduced in Supabase.
8. **No engineering-infrastructure exposure in the CMS.** Storage, review transport and versioning mechanics stay behind the server boundary.

## Prospect linkage

Discovery provenance and sector identity are different facts:

```text
Discovery run = how did we find this company?
Prospect sector = what market does this company belong to for reusable design intelligence?
```

The minimal model remains:

```text
Prospect
  → canonical_sector_key
  → current published Sector Intelligence
```

Rules:

- single-sector area discovery may assign a known sector automatically;
- multi-sector discovery does not guess a primary sector;
- a direct URL alone is not sufficient evidence for sector classification;
- an operator can explicitly assign or change the prospect sector at any time;
- changing sector identity never rewrites discovery provenance;
- no many-to-many sector model is introduced without measured need.

## CMS workflow

`Sectoronderzoek` is a first-class CMS workspace.

A research run has two required operator inputs and one optional input:

```text
Sector
Startlocatie
Aanvullende onderzoeksrichting (optional)
```

`Sector` is the human market term, for example `kapper` or `juwelier`. SolidDesign resolves and stores the canonical Overture key internally.

`Aanvullende onderzoeksrichting` is a simple free-text escape hatch. It may contain URLs, observations or other context such as:

```text
Bekijk ook https://voorbeeld.nl. Ik vind vooral de mobiele navigatie en rustige compositie sterk.
```

The research model must inspect such input independently, compare it with the broader market evidence and explicitly reject or qualify weak operator assumptions. Operator input may broaden or focus attention; it may not replace autonomous research.

No reference library, rating model, tag system or separate research-input lifecycle is introduced.

## Research flow

```text
CMS Sectoronderzoek
→ human market term + location + optional direction
→ research prompt
→ ChatGPT research
→ final Markdown
→ CMS deterministic validation
→ CMS review state
→ human CMS review
→ published Sector Intelligence
```

Clipboard handoff remains the current human-in-the-loop boundary. If clipboard read fails, the CMS exposes one paste-field fallback.

The research prompt contains no repository URL, branch, pull-request or storage mechanics. ChatGPT is asked only to research, challenge the evidence and return the final document.

## CMS review boundary

Normal CMS users never need infrastructure knowledge or access.

The browser sees only business concepts:

```text
Beschikbaar
Ter beoordeling
Bijwerking ter beoordeling
Bekijken
Beoordelen
Publiceer
Afwijzen
```

The browser API must not expose repository URLs, review URLs, branch names, pull-request identifiers or storage paths.

The backend may use existing engineering/versioning infrastructure internally, but that is an implementation detail behind one narrow Sector Intelligence capability.

## Authorization

All Sector Intelligence CMS capabilities use the canonical Operator authorization model:

```text
auth.uid()
→ active team_members
→ operator_is_active_team_member()
```

The retired `operator_allowlist` model must never be reintroduced as a second authorization authority.

## Deterministic validation

Before research can enter review, the backend validates without another AI call:

- valid canonical sector key;
- matching `sector_key` front matter;
- Sector Design Intelligence title;
- required core headings;
- source references;
- bounded document size.

A complete outer Markdown code fence may be stripped automatically. Invalid or mismatched content is rejected before review state is created.

## Required research output

Minimal front matter:

```yaml
---
sector_key: barber
research_label: kappers en kapsalons
market: Nederland
researched_at: YYYY-MM-DD
method_version: 1
---
```

Required content structure:

```text
# Sector Design Intelligence — <label>

## Quality bar
## Customer / market context relevant to design
## Strong recurring patterns
### Hero
### Typography
### Imagery
### Trust
### Services / offering
### Conversion
### Mobile
## Creative opportunities
## Patterns to avoid
## Sector references
## Adjacent creative references
## Principles distilled from the evidence
## Weak / uncertain conclusions
```

Every named reference includes a direct source URL and a short reason for selection.

## Research standard

Research should normally:

1. start with the supplied local market;
2. broaden to the Netherlands when local evidence is too narrow;
3. use a small number of international or adjacent premium references only where they add genuine perspective;
4. inspect actual sites rather than relying on search-result snippets;
5. evaluate craft, typography, composition, imagery, trust, conversion hierarchy, mobile quality, originality and obvious template/AI-slop patterns;
6. derive principles from multiple observations rather than one attractive example.

A useful default remains approximately seven strong sector references plus approximately three adjacent creative references. This is guidance, not a score formula.

## Mandatory self-review

Before returning the final document, challenge at least:

- Are these genuinely strong designs or merely prominent brands?
- Is the evidence set sufficiently diverse?
- Did the taxonomy distort the real market scope?
- Are conclusions sector-specific rather than generic design advice?
- Is any supposed rule inferred from one example?
- Is a cliché being mistaken for a best practice?
- Did any recommendation drift into imitation?
- Which conclusions are weakest or least certain?
- Did operator-provided direction survive independent inspection?

## Use in design

Source priority remains:

```text
current user instruction
↓
SolidDesign design method
↓
Prospect Design Brief / verified facts
↓
Sector Intelligence
↓
other external evidence
```

If published Sector Intelligence exists for the prospect's explicit sector, the design workflow may use it as advisory evidence for quality bar, art direction, hierarchy, imagery, trust presentation, service presentation, conversion and anti-pattern awareness.

Missing Sector Intelligence never blocks design work.

The deterministic automatic baseline renderer remains unchanged. Do not add an AI call, parser, sector-template family or rule engine merely to force unstructured Sector Intelligence into the baseline.

If new Sector Intelligence arrives after a LIVE concept exists, it may inform a new improvement DRAFT. It never mutates or replaces the current LIVE version automatically.

## Final rule

> Standardize what SolidDesign learns, not what every sector website must look like.
