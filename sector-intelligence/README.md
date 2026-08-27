# SolidDesign Sector Intelligence

**Status:** canonical v0.1  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

Sector Intelligence is reusable external design research for one canonical business sector. It exists to raise the quality bar of future SolidDesign designs without turning sectors into templates.

## Core principles

1. **Research once per sector; reuse many times per prospect.**
2. **Ontology identifies; market language guides research.** The Overture key is the stable machine identity, not the sole research query.
3. **External references produce principles, never templates.** Do not copy branding, copy, layouts or distinctive creative elements.
4. **Sector Intelligence is advisory evidence.** Verified prospect facts, prospect-specific requirements and the SolidDesign design method remain authoritative.
5. **No extra state plane.** Sector Intelligence lives as Markdown in GitHub. Git history provides versioning; a PR provides review/publish governance.

## Inputs for a research run

Every run starts with three explicit inputs:

```text
canonical_sector_key
human_sector_term
location
```

Example:

```text
canonical_sector_key = barber
human_sector_term = kapper
location = Amsterdam
```

`barber` is used for identity and the canonical filename. It must not narrow research to businesses that explicitly call themselves barbers.

ChatGPT must interpret the actual market represented by the human term and location. For the example above, relevant vocabulary can include Dutch and English variants such as kappers, kapsalons, hair salons, barbershops and other contextually valid terms.

Do not maintain a second hand-built research taxonomy unless repeated failures prove it necessary.

## Research scope

Use the ordinary ChatGPT client as the research and synthesis workbench.

Research broadly enough to establish a credible current quality bar:

1. start with the supplied local market;
2. broaden to the Netherlands when local coverage is too narrow;
3. use a small number of international or adjacent premium references only when they add useful creative perspective.

Do not claim an objective global `top 10`. The goal is a set of **high-quality, relevant and sufficiently diverse references**.

A useful default is:

```text
approximately 7 sector benchmarks
+
approximately 3 adjacent creative references
```

This is a guideline, not a scoring formula.

## Evaluation

Inspect actual sites rather than relying only on search-result snippets. Evaluate at least:

- first impression / craft;
- typography;
- composition and visual hierarchy;
- imagery and art direction;
- trust and credibility;
- conversion hierarchy;
- mobile quality where observable;
- originality / sector specificity;
- obvious template or AI-slop patterns.

Prefer evidence-backed observations over generic design advice.

## Required output

Write one file:

```text
sector-intelligence/<canonical_sector_key>.md
```

Use minimal front matter:

```yaml
---
sector_key: barber
research_label: kappers en kapsalons
market: Nederland
researched_at: YYYY-MM-DD
method_version: 1
---
```

Recommended content:

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

Every named reference must include a source URL and a short reason for selection.

## Mandatory self-review

Before writing the GitHub result, challenge the research:

- Are these genuinely strong designs, or merely prominent brands?
- Is the reference set sufficiently diverse?
- Did the technical taxonomy code distort the real market scope?
- Are conclusions sector-specific rather than generic web-design advice?
- Is any supposed rule inferred from only one example?
- Am I mistaking a visual cliché for a best practice?
- Did any recommendation drift into imitation?
- Which three conclusions are weakest or least certain?

Keep uncertainty explicit rather than manufacturing confidence.

## Publication workflow

Use existing platform capabilities:

```text
ordinary ChatGPT research
→ synthesis + self-review
→ GitHub branch
→ sector-intelligence/<key>.md
→ PR
→ human review
→ merge to main
```

Do not add a Sector Intelligence database, queue, crawler, screenshot store, ranking service or autonomous orchestration unless a measured production problem later justifies it.

## Use in design

The design bootstrap derives the canonical sector key from the Prospect Design Brief and tries to load:

```text
sector-intelligence/<canonical_sector_key>.md
```

If the file exists, ChatGPT reads it completely and uses it as advisory design evidence. If it does not exist, design work continues normally.

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

Sector Intelligence may influence art direction, typography, hierarchy, imagery, trust presentation, service presentation, CTA emphasis and anti-pattern awareness. It may not invent or override prospect facts.

## Relationship to the deterministic baseline mock-up

The current automatic baseline mock-up is produced by the deterministic SolidDesign renderer:

```text
VerifiedFacts + ConversionBrief
→ DesignProfile
→ SiteConfig
→ static preview
```

It does not execute an LLM and therefore does not consume unstructured Sector Intelligence directly.

Do **not** add a new AI call, parser, sector template family or rule engine merely to force Sector Intelligence into this baseline renderer. The baseline remains a cheap deterministic control until measured evidence justifies changing that boundary.

The ChatGPT design/refinement workflow is the intelligence-aware layer.

## Late-arriving Sector Intelligence

If Sector Intelligence becomes available after a LIVE mock-up already exists:

```text
current LIVE mock-up
+
latest Prospect Design Brief
+
new Sector Intelligence
→ ChatGPT critique + one improvement pass
→ new HTML/ZIP
→ existing CMS upload as DRAFT
→ human review
→ existing Maak live action
```

Never mutate or replace the current LIVE version automatically. Existing demo versioning and LIVE promotion are sufficient; no new lifecycle or state is required.

## Final rule

> Standardize what SolidDesign learns, not what every sector website must look like.
