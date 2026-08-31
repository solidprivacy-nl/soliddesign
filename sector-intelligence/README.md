# SolidDesign Sector Intelligence

**Status:** canonical v0.4  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

Sector Intelligence is reusable external design research for one canonical business sector. It exists to raise the quality bar of future SolidDesign designs without turning sectors into templates.

## Core principles

1. **Research once per sector; reuse many times per prospect.**
2. **Ontology identifies; market language guides research.** The Overture key is the stable machine identity, not the sole research query.
3. **External references produce principles, never templates.** Do not copy branding, copy, layouts or distinctive creative elements.
4. **Sector Intelligence is advisory evidence.** Verified prospect facts, prospect-specific requirements and the SolidDesign design method remain authoritative.
5. **No extra state plane.** Sector Intelligence lives as Markdown in GitHub. Git history provides versioning; a PR provides review/publish governance.
6. **Normal operators need no GitHub access.** GitHub is an engineering/publication boundary behind the CMS, not an operator dependency.

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

## CMS launcher and operator flow

The primary operator entry point is the standalone **Sectoronderzoek** workspace in the CMS. **Bedrijven zoeken** keeps only a shortcut into that workspace so research is no longer coupled to the discovery form that happened to find a prospect.

The research inputs are:

- `Sector` supplies the original human market term, for example `kapper`;
- `Startlocatie` remains the market starting point;
- the existing validated Overture sector resolver supplies the canonical machine key.

The human market term and the canonical key are deliberately different concepts. A canonical key such as `barber` must never be silently substituted for the human research term `kapper`.

Sector Intelligence is one canonical file per sector, so the research flow accepts **one sector per run**. Discovery itself may still search multiple sectors in one run.

The normal operator flow is:

```text
1. Open Sectoronderzoek
2. Enter the human sector term and starting location
3. Start sectoronderzoek in ChatGPT
4. ChatGPT researches and returns one final Markdown document
5. Operator copies the final ChatGPT answer
6. Verwerk onderzoeksresultaat
7. CMS validates and submits it for review
```

The same workspace also shows published and in-review sector research and can link a validated canonical sector to any non-archived company/prospect, including a company added through a direct URL.

Sector identity belongs to the prospect, not to its discovery provenance:

```text
Prospect
→ canonical_sector_key
→ sector-intelligence/<canonical_sector_key>.md
```

A single-sector AREA discovery can inherit its already validated canonical key automatically. A direct URL does not provide enough evidence to choose a sector safely, so SolidDesign does not guess; the operator links the correct sector explicitly.

The primary ChatGPT handoff is clipboard-first. If the browser cannot read the clipboard, the CMS reveals a plain paste field as fallback. No research job, draft object or extra research lifecycle is stored in Supabase.

### What the launch prompt contains

The copied research instruction contains only the task contract and the three research inputs. It does **not** expose repository URLs, repository paths, branches or PR mechanics.

ChatGPT is responsible only for:

- web research;
- reference selection;
- analysis and synthesis;
- mandatory self-review;
- the final Markdown document.

ChatGPT must not publish, create branches or perform repository actions in this operator flow.

## Deterministic result validation

Before publication, the CMS backend validates the returned document without another AI call.

At minimum it requires:

- a valid canonical sector key;
- matching `sector_key` front matter;
- a Sector Design Intelligence title;
- required core headings;
- source references;
- a bounded file size.

A complete outer Markdown code fence is tolerated and removed automatically. Invalid or mismatched content is rejected before any repository write.

## Narrow publication capability

The browser may submit only:

```text
canonical_sector_key
markdown
```

The browser cannot choose a repository, path, branch, base branch or PR metadata.

The server-side publication function owns those constants and may write only the canonical Sector Intelligence path for the validated key. It never writes directly to `main`.

Publication flow:

```text
CMS operator
→ validated Markdown
→ constrained CMS backend capability
→ new branch
→ sector-intelligence/<key>.md
→ PR to main
→ human review
→ merge
```

If the submitted Markdown is byte-equivalent to the current canonical file after trimming, no new branch or PR is created.

## Runtime credential

The CMS backend uses one technical GitHub identity stored only as a Cloudflare Pages secret:

```text
GITHUB_SECTOR_INTELLIGENCE_TOKEN
```

For v0.4 the simplest viable credential is a fine-grained token scoped to the SolidDesign repository with only the permissions required to read/write contents and create pull requests. It is not stored in Git, browser code, Supabase or operator accounts.

A normal SolidDesign operator therefore needs:

```text
CMS account
+
access to the shared SolidDesign ChatGPT project
```

and does **not** need a GitHub account or ChatGPT↔GitHub connection.

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

The final research result must use minimal front matter:

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

Every named reference must include a source URL and a short reason for selection.

## Mandatory self-review

Before returning the final result, challenge the research:

- Are these genuinely strong designs, or merely prominent brands?
- Is the reference set sufficiently diverse?
- Did the technical taxonomy code distort the real market scope?
- Are conclusions sector-specific rather than generic web-design advice?
- Is any supposed rule inferred from only one example?
- Am I mistaking a visual cliché for a best practice?
- Did any recommendation drift into imitation?
- Which three conclusions are weakest or least certain?

Keep uncertainty explicit rather than manufacturing confidence.

## Use in design

The design bootstrap reads the prospect's first-class `canonical_sector_key` from the Prospect Design Brief and tries to load:

```text
sector-intelligence/<canonical_sector_key>.md
```

For older prospects that predate first-class sector identity, a single canonical sector from the legacy discovery run may be used only as a backwards-compatible fallback.

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
