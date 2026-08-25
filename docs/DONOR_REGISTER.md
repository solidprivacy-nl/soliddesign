# Donor Register

This register records external repositories/datasets considered or used by SolidDesign.

## Adoption rule

Use external code only when semantic fit is high and total integration/change cost is lower than a thin implementation.

Classifications:

- `ADOPT` — use as a subsystem/runtime dependency;
- `ADAPT` — bounded component/pattern behind local interface;
- `IDEA` — patterns only;
- `DEFER` — potentially useful later;
- `REJECT` — do not use.

## 1. Overture Maps Foundation — Places

Documentation: https://docs.overturemaps.org/guides/places/

Role: **CANONICAL PHASE-1 DISCOVERY DATASET**

Status: `ADOPT DATA SOURCE`

Relevant capability:

- 75M+ global place records;
- names;
- current taxonomy;
- websites;
- phones;
- addresses;
- operating status;
- source confidence;
- stable GERS IDs;
- public cloud GeoParquet.

Boundary:

- Overture is candidate discovery, not commercial-demand truth;
- release ID is recorded;
- external data remains untrusted until validated;
- use `basic_category` / `taxonomy`, not deprecated `categories`.

Licensing/attribution: follow Overture's theme/source attribution guidance:
https://docs.overturemaps.org/attribution/

## 2. DuckDB

Project: https://duckdb.org/  
Package: `duckdb==1.5.5`

Role: **OVERTURE QUERY ENGINE**

Status: `ADOPT DEPENDENCY`

Purpose: bounded SQL queries against Overture cloud-hosted GeoParquet.

Why DuckDB instead of a local Overture warehouse:

- one embedded dependency;
- no server;
- no data mirror;
- push filtering to cloud Parquet;
- matches Overture's official quickstart.

## 3. Dukotah/leadgen

Repository: https://github.com/Dukotah/leadgen  
Reviewed revision: `36784ad5125ac51e61741a478d0c7e3877e69d16`  
License: MIT — verified in root `LICENSE`.

Role: **OVERTURE DISCOVERY PATTERN DONOR**

Status: `ADAPT PATTERN`

Useful reviewed pattern:

- bounded Overture Places query via DuckDB/S3;
- normalized lead records;
- optional OSM fallback concept.

SolidDesign modifications:

- current Overture `basic_category`/`taxonomy` instead of deprecated `categories`;
- official STAC latest-release lookup;
- website required;
- closed-place filtering;
- explicit release/source provenance;
- no multi-source pipeline by default.

## 4. NezbiT/pitch-doctor

Repository: https://github.com/NezbiT/pitch-doctor

License: MIT — verified in root `LICENSE`.

Role: **PRIMARY AUDIT DONOR**

Status: `ADAPT / INTEGRATE`

Relevant capability:

- existing-site audits;
- Playwright screenshots;
- contact friction;
- CTA/UX checks;
- SEO/accessibility/performance;
- business-language findings;
- HTML/PDF patterns.

Boundary: normalize into SolidDesign `AuditResult`.

## 5. buildingopen/openpage

Repository: https://github.com/buildingopen/openpage

License: MIT — verified in root `LICENSE`.

Role: **PRE-SALE DEMO CONFIG CONTRACT**

Status: `ADAPT CONTRACT`

Relevant capability:

- typed JSON `SiteConfig`;
- visual editing;
- deterministic block model;
- standalone HTML export patterns.

Boundary: SolidDesign owns the renderer and only keeps subset compatibility. OpenPage is not imported as a second application runtime.

## 6. JackInSightsV2/Automated-Agentic-AI-Web-Agency

Repository: https://github.com/JackInSightsV2/Automated-Agentic-AI-Web-Agency

License: MIT — verified in root `LICENSE`.

Role: **FULL-CHASSIS COMPARATOR / OPTIONAL GOOGLE REFERENCE**

Status: `IDEA / DEFER`

Previously useful:

- Google Places field/API pattern;
- Supabase state/logging ideas;
- build/review/retry ideas.

Current decision:

- Google Places is no longer canonical discovery;
- larger agentic runtime is not incorporated.

Security note: reviewed upstream orchestrator invokes Claude Code with `--dangerously-skip-permissions`; do not import that runtime without explicit sandbox design.

## 7. Google Places

Provider, not donor repository.

Role: **OPTIONAL FUTURE ENRICHMENT/FALLBACK**

Status: `DEFER`

Potential later value:

- rating/review count;
- measured Overture coverage gaps.

Not a Phase-1 dependency. No Google scraping.

## 8. GoogleChrome/lighthouse

Repository: https://github.com/GoogleChrome/lighthouse  
License: Apache-2.0.

Role: technical benchmark.

Status: `DEFER`

Reason: avoid duplicating audit tooling until Pitch Doctor gaps are proven.

## 9. NicoSKOOL/astro-seo-website-builder

Repository: https://github.com/NicoSKOOL/astro-seo-website-builder

README states MIT, but root-license provenance must be independently confirmed before code copying.

Status: `IDEA / DEFER`.

## 10. Marcelluxx/lead-hunter-ai

Repository: https://github.com/Marcelluxx/lead-hunter-ai

License: proprietary according to repository documentation.

Status: `IDEA ONLY / NO CODE COPYING`.

Useful concepts:

- guarded crawling;
- SSRF protection;
- evidence records;
- untrusted-content boundary.

## 11. nextlevelbuilder/ui-ux-pro-max-skill

Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill  
Reviewed revision: `e353a508767c6d39f0e7698b084dbfc8699fffd3`  
License: MIT — verified in root `LICENSE`.

Role: **DESIGN-INTELLIGENCE DONOR**

Status: `IDEA / ADAPT CONTRACT`

Useful reviewed concepts:

- industry/product-aware design reasoning;
- palette, typography and style selection as structured design decisions;
- explicit design-system output instead of free-form generated code.

SolidDesign adoption:

- one small deterministic `DesignProfile` contract;
- no donor runtime;
- no copied design database;
- no search engine or agent added;
- category signals only influence bounded design tokens.

## 12. TheMattBerman/landing-page-factory

Repository: https://github.com/TheMattBerman/landing-page-factory  
Reviewed revision: `e65fbf28662ae85aa7384d13441f0537ea08a9aa`  
License: MIT — verified in root `LICENSE`.

Role: **AUTHORITY/SERVICE ROUTING + COPY/PROOF DISCIPLINE DONOR**

Status: `IDEA ONLY`

Useful reviewed concepts:

- evidence before synthesis;
- page-type routing including authority/service pages;
- proof discipline and claim control;
- customer-facing copy separated from internal strategy/audit language;
- mandatory anti-slop QA.

SolidDesign adoption:

- retain `VerifiedFacts` as claim authority;
- make concept copy customer-facing rather than audit-facing;
- keep one authority/service recipe in Phase 1;
- do not import its orchestrator, provider stack, image pipeline or agent runtime.

## 13. pbakaus/impeccable

Repository: https://github.com/pbakaus/impeccable  
Reviewed revision: `fcd7622cd2d8e2b09344ba8ede9fcac82cec4e70`  
CLI: `impeccable@3.6.0`  
License: Apache-2.0 — verified in root `LICENSE`.

Role: **DETERMINISTIC DESIGN QA**

Status: `ADOPT CI TOOL`

Relevant capability:

- static HTML/CSS design anti-pattern detection;
- deterministic rules for AI-slop tells, typography, layout, spacing, motion, color and accessibility;
- JSON output suitable for CI;
- exit code `2` for findings.

Boundary:

- CI only;
- pinned version;
- not an application runtime dependency;
- no AI provider or design-agent integration;
- findings inform a bounded human/design acceptance gate before stricter automated thresholds are justified by evidence.

## Reference-only design sources

The following remain research/reference donors only and are **not** dependencies:

- `Leonxlnx/taste-skill` — high-end visual/anti-slop heuristics;
- `winchxyz/loupe` — reference-backed design tokens and reviewer-loop concepts;
- `nexu-io/open-design` — structured design-system packaging/craft references.

Do not add their runtimes, daemons, visual editors, agents or catalogs during Phase 1.

## Provenance template

```yaml
source_repository:
source_commit_sha:
source_path:
license:
adoption_type:
local_path:
local_modifications:
reason:
security_review:
last_reviewed:
```
