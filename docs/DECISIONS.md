# Architecture and Business Decisions

## ADR-001 — Optimize for learning, not platform completeness

**Decision:** Phase 1 prioritizes reliable commercial learning over architectural completeness.

**Consequence:** queues, realtime dashboards, MCP, agent fabrics and autonomous outbound are deferred.

## ADR-002 — Compose before full-chassis adoption

**Decision:** use a small composition of semantically aligned components rather than importing a complete AI web-agency chassis by default.

**Current composition:** Overture Maps + DuckDB discovery + Pitch Doctor audit + own qualification + OpenPage-compatible demo + static preview + thin print pack.

## ADR-003 — Supabase as operational state

**Decision:** operational prospect/audit/demo/mailing/outcome data uses the dedicated SolidDesign Supabase project.

**Offline exception:** fixtures/local artifacts remain permitted for deterministic tests.

## ADR-004 — GitHub as software/documentation truth

**Decision:** mission, schemas, code, tests, prompts safe for disclosure, provenance and decisions live in GitHub.

## ADR-005 — Pre-sale proof separated from production delivery

**Decision:** optimize pre-sale demo for persuasion, speed, correctness and editability. Production stack is selected after real customer requirements exist.

## ADR-006 — Physical mail + human sales

**Decision:** Phase 1 uses personalized physical mail for outbound attention and human sales after engagement. Automated cold email/calling is not part of MVP.

## ADR-007 — Five-factor unweighted score

**Decision:** use hard gates plus five 0–5 rubrics; do not introduce arbitrary factor weights before outcome data.

## ADR-008 — Public-repo safety boundary

**Decision:** this public repo contains no secrets, real prospect/customer datasets or intentionally proprietary core material.

## ADR-009 — Overture Maps is the canonical Phase-1 discovery source

**Date:** 2026-08-25

**Decision:** replace Google Places as the default discovery provider with Overture Maps Places.

**Reasons:**

- no Google Cloud project or billing requirement;
- no provider API key;
- open global Places dataset;
- website/phone/address/category fields are available;
- bounded cloud-native queries fit the small-market MVP;
- data-provider complexity should not precede proof that it improves sales.

**Implementation:** DuckDB queries Overture cloud GeoParquet using an explicit bbox and current taxonomy fields.

**Consequence:** Google-specific rating/review data is no longer assumed at discovery time. `rating` and `review_count` remain optional/null unless later enriched.

## ADR-010 — Demand evidence is independent from discovery-source existence

**Decision:** Overture presence, confidence, operating status and website presence cannot by themselves establish Existing Demand.

**Reason:** Overture's `confidence` describes confidence that a place exists, not commercial demand.

**Consequence:** demand is separately evidenced during human qualification.

## ADR-011 — Explicit bbox before geocoder

**Decision:** Phase-1 market geography is supplied as `west,south,east,north`.

**Reason:** deterministic, reproducible, free and dependency-light.

**Consequence:** no geocoding service is built until operator friction proves it necessary.

## ADR-012 — New Overture taxonomy fields only

**Decision:** new SolidDesign discovery logic uses `basic_category` and `taxonomy`, not the deprecated legacy `categories` field.

**Reason:** Overture announced removal of `categories` in September 2026.

## ADR-013 — Single-source first, fallback only after measured failure

**Decision:** do not simultaneously activate Overture + OSM + Google.

**Fallback order:**

1. Overture;
2. bounded OSM/Overpass if a specific coverage gap is proven;
3. targeted commercial enrichment if economics justify it.

## ADR-014 — Raw donor audit is evidence; prospect-facing audit is root-cause reviewed

**Date:** 2026-08-25

**Decision:** preserve the raw Pitch Doctor report unchanged, but require a human-reviewed `AuditResult` before audit findings become prospect-facing proof or sales copy.

**Trigger:** the first live Utrecht audit showed a blocking expired TLS certificate. Because the page never loaded normally, the donor also emitted numerous downstream critical checks that were not independent verified defects.

**Rule:** when a blocking root cause prevents normal page evaluation, cascading failed-load findings are suppressed/collapsed in the presentation layer rather than counted as separate opportunities.

```text
RAW DONOR AUDIT
→ preserve
→ identify root cause
→ collapse cascading unknowns
→ human-reviewed AuditResult
→ brief / print pack
```

**Consequence:** SolidDesign favors fewer defensible findings over a larger, more dramatic list. This is both a trust requirement and a commercial-quality requirement.

## ADR-015 — Sector Intelligence uses ChatGPT + GitHub, not a new subsystem

**Date:** 2026-08-27

### Problem

Future designs should reuse what SolidDesign learns from strong websites in the same market without repeating expensive research per prospect.

### Hard requirements

- research follows actual market language, not only the technical Overture taxonomy term;
- external inspiration remains subordinate to verified prospect facts;
- knowledge is reviewable, versioned and reusable;
- missing Sector Intelligence must never block design production;
- a later Sector Intelligence publication must be able to improve an existing mock-up without replacing the current LIVE version automatically.

### Simplest viable solution

Use the ordinary ChatGPT client for extensive web research, synthesis and GitHub writing. Store one reviewed Markdown file per canonical sector under `sector-intelligence/`.

The Overture key is the stable filename/identity; the human discovery term and market geography guide research vocabulary.

The design bootstrap conditionally loads the matching published sector file when it exists.

### Existing solution reused

- ChatGPT: research, synthesis, self-review and design refinement;
- GitHub: Markdown storage, branches, PR review, history and rollback;
- existing CMS demos: DRAFT/LIVE versioning and promotion.

### Added complexity

One GitHub directory, one conditional bootstrap lookup and one CMS clipboard action for a Sector Intelligence improvement pass. No new database table, service, queue, crawler, screenshot store or lifecycle is introduced.

### Failure modes

- taxonomy term skews research → use human market language and location;
- external inspiration becomes pseudo-policy → keep Sector Intelligence below Prospect Design Brief / verified facts in source priority;
- late research silently changes a mailed/live proof → create a new DRAFT and require the existing human `Maak live` step;
- deterministic baseline becomes a template zoo → do not inject unstructured Sector Intelligence into the baseline renderer.

### Reversibility

High. Sector Intelligence is Markdown and the CMS addition is a thin launch action. No operational data migration is required.

### Verdict

Adopt. The deterministic automatic baseline remains unchanged. Sector Intelligence enriches the ChatGPT design/refinement layer. If Sector Intelligence exists before design refinement, it is used immediately; if it arrives later, the CMS can launch one SI-informed improvement pass that returns a new DRAFT for normal review and LIVE promotion.

Canonical method: `sector-intelligence/README.md`.

## ADR-016 — Operators do not need GitHub access for Sector Intelligence

**Date:** 2026-08-28

**Supersedes:** only the operator publication mechanism in ADR-015. ADR-015 remains authoritative for the purpose, storage model and design use of Sector Intelligence.

### Problem

Sector Intelligence was the only normal CMS function that required an operator to connect a personal ChatGPT account to GitHub. That breaks an otherwise clean separation between operational users and engineering infrastructure.

### Hard requirements

- a normal operator needs only a CMS account and access to the shared SolidDesign ChatGPT project;
- research remains extensive and human-reviewable;
- GitHub remains canonical storage and version history;
- publication never writes directly to `main`;
- the operator must not need repository knowledge, repository credentials or repository paths;
- user flow must stay minimal;
- do not add a research database, queue, scheduler or general-purpose GitHub gateway.

### Simplest viable solution

Split research from publication at the CMS boundary:

```text
CMS → start research prompt → ChatGPT research → final Markdown
    → operator Copy → CMS Verwerk onderzoeksresultaat
    → deterministic validation → constrained server-side publisher
    → branch + PR → human review → merge
```

The research prompt contains the complete execution contract and research inputs but no repository URL, path, branch or PR instructions. ChatGPT does not read or write GitHub in this operator flow.

The browser submits only `canonical_sector_key` and Markdown. Repository, path, branch, base branch and PR metadata are server-side constants.

### Existing solutions reused

- existing Discovery sector input and Overture resolver;
- ordinary ChatGPT for research and synthesis;
- browser clipboard API, with paste-field fallback;
- Cloudflare Pages Function for the narrow server-side capability;
- GitHub branches and pull requests for review/versioning.

### Security boundary

The publication endpoint:

- requires an authenticated, allowlisted CMS operator;
- validates the canonical sector key and Markdown contract;
- can write only canonical Sector Intelligence content;
- creates a new branch and PR;
- never accepts arbitrary repository/path/branch input;
- never writes directly to `main`.

The technical GitHub credential is a fine-grained repository-scoped token stored only as the Cloudflare Pages secret `GITHUB_SECTOR_INTELLIGENCE_TOKEN`.

### Added complexity

One narrow Pages Function and one second CMS action (`Verwerk onderzoeksresultaat`). No new database table, job state, queue, scheduler, agent, generic GitHub API proxy or operator credential is added.

### Failure modes

- clipboard read blocked → reveal a simple paste field only as fallback;
- user copies the wrong ChatGPT content → reject deterministic contract mismatch before publication;
- result already equals canonical content → create no branch or PR;
- technical credential missing/expired → fail closed with a generic CMS error; no fallback to operator GitHub access;
- publication fails after branch creation → no direct-main impact; maintainer can inspect/remove the orphan branch.

### Reversibility

High. Remove the one endpoint and processing action to return to manual publication. Canonical Sector Intelligence files and Git history remain unchanged.

### Verdict

Adopt. Normal SolidDesign operators do not require a GitHub account or ChatGPT↔GitHub connection. GitHub is an engineering/publication boundary behind the CMS.
