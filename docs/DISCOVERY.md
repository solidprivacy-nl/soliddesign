# SolidDesign Discovery

**Status:** canonical discovery contract  
**Date:** 2026-09-08  
**Principle:** multiple concrete intake paths, one candidate boundary, one Discovery Inbox, one human decision.

## 1. Objective

Discovery exists to supply enough credible redesign prospects for the commercial SolidDesign loop with acceptable research and operator effort.

It is not a census platform and not a generalized lead-source framework.

Canonical flow:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
              VALIDATED CANDIDATE
                       ↓
                existing Supabase
                  prospect intake
                       ↓
             deterministic site check
                       ↓
                DISCOVERY INBOX
                       ↓
                 HUMAN SELECT
              ├─ promote
              └─ reject
                       ↓
                  PROSPECT
                       ↓
       deeper audit / qualification / design
```

## 2. Operator UX principle

The CMS presents the business task, not the implementation machinery.

A new User should be able to answer three questions immediately:

1. How do I find companies?
2. Which candidates deserve attention?
3. How do I add one to Prospects?

The governing UI rule is:

> Show the decision; hide the machinery.

Therefore **Bedrijven zoeken** has one search card with exactly three modes. Only one mode is visible at a time:

```text
Gericht zoeken  |  Breed zoeken  |  Bekend bedrijf
    default
```

The technical source names remain durable provenance, not primary operator vocabulary.

### Gericht zoeken

Recommended default when prospect quality matters most.

Visible fields:

```text
Sector
Plaats
+ Extra instructie     # collapsed by default
```

The interaction is deliberately two-step:

```text
1. Kopieer onderzoeksopdracht
2. Importeer CSV-resultaat
```

No PDOS terminology, import-contract mechanics or evidence-model explanation is required in the normal operator path.

### Breed zoeken

Used for inexpensive recall.

Visible fields:

```text
Plaats
Sector
```

The current result limit is a system default of 10 and is not exposed as routine operator configuration. Add a control only if real operator evidence shows that changing the limit is a recurring need.

Overture and geocoding remain implementation/source details. Attribution remains present but visually secondary.

### Bekend bedrijf

Used when the operator already knows a business.

Visible field:

```text
Website
```

Reachability and duplicate checks happen automatically.

### Sectoronderzoek is separate

Sectoronderzoek has its own top-level navigation item and is not duplicated inside Bedrijven zoeken.

Do not reintroduce a shortcut from the broad-search card: it creates uncertainty about whether sector research is a prerequisite for finding companies.

## 3. Exactly three current intake paths

### A. Research import

Purpose:

> precision and richer evidence about commercial/design opportunity.

Operator supplies sector + location, copies the canonical `prospect-research` invocation to ChatGPT and imports the resulting CSV.

Research is the discovery method. CSV is only transport.

Durable provenance:

```text
discovery_runs.run_type = IMPORT
input.format = csv
input.method = prospect_research
prospects.discovery_source = research
```

### B. Overture area search

Purpose:

> broad, inexpensive candidate recall from a bounded geography and sector.

Overture remains a proven source adapter. It is not itself the definition of SolidDesign discovery.

See `docs/DISCOVERY_OVERTURE.md` for source/query-specific behaviour.

### C. Specific URL

Purpose:

> intake for a known business website supplied directly by an operator.

The existing website preflight and deduplication path remains unchanged.

## 4. No provider framework

Do not introduce:

```text
DiscoveryProvider
ProviderRegistry
ProviderFactory
source plugins
multi-provider orchestration
```

The present need is only three concrete paths that each produce the same plain candidate shape.

If a fourth source is later justified by measured coverage/value, map it to that same boundary first. Generalize only when concrete duplication actually exists.

## 5. Candidate boundary

All sources normalize to the existing prospect-ingest fields required for Discovery:

```text
name
website_url
category
city
address
phone
canonical_sector_key
discovery_source
discovery_version
qualification
```

Source-specific fields remain optional.

The existing Supabase `operator_ingest_discovery_candidates` RPC stays authoritative for persistence and website-domain deduplication.

No second candidate table exists.

## 6. Research transfer contract

The canonical machine-readable transport contract is:

```text
prompts/contracts/prospect-research-import-v1.json
```

Both sides use the same contract:

```text
prospect-research prompt
→ reads contract
→ produces CSV

CMS importer
→ reads contract
→ validates CSV
```

Do not maintain a second manually copied list of CSV columns in JavaScript or documentation.

## 7. CSV parsing and validation

The browser uses a mature pinned CSV parser rather than custom delimiter splitting.

Validation includes:

- exact contract headers/order;
- maximum row count;
- valid enum values;
- explicit booleans;
- positive integer research rank;
- bounded text sizes;
- valid HTTP(S) business/source URLs.

Malformed imports fail clearly before candidate persistence.

No silent column guessing or fabricated default evidence.

When a research row matches an existing website domain, the existing record is enriched rather than duplicated. The import feedback distinguishes newly created candidates from existing candidates that received research evidence.

## 8. Research evidence

Accepted research evidence is stored inside the existing JSON qualification record:

```text
qualification.research
```

Conceptual shape:

```json
{
  "research": {
    "method": "prospect_research",
    "version": "2026-09-08",
    "rank": 1,
    "decision": "DEEP_AUDIT",
    "priority": "VERY_HIGH",
    "eligible_for_pdos": true,
    "confidence": "MEDIUM",
    "commercial_signals": "...",
    "website_observations": "...",
    "redesign_hypothesis": "...",
    "verification_needed": "...",
    "inspection": {
      "desktop": true,
      "mobile": false,
      "service_page": true,
      "trust": true,
      "technical_measurement": false
    },
    "source_urls": []
  }
}
```

Research triage is discovery evidence. It is not the current full commercial qualification.

## 9. Deterministic triage

Every newly discovered website may receive the existing cheap deterministic preflight before human selection.

It intentionally assesses only directly observable website/delivery evidence such as:

- website reachability;
- usable HTML response;
- basic conversion hygiene;
- obvious commerce/portal/booking complexity.

It must not fabricate:

- Customer Economics;
- Existing Demand;
- Competitive Context.

Deterministic evidence remains:

```text
qualification.triage
```

Therefore:

```text
qualification.research
= externally researched evidence

qualification.triage
= system-observed cheap website evidence
```

Neither silently replaces the other.

## 10. Qualification merge invariant

Any code that writes `prospects.qualification` must preserve unrelated evidence namespaces.

Required invariant:

```text
update research
→ preserve triage + full qualification

update triage
→ preserve research + full qualification

update full qualification
→ preserve research + triage
```

Regression tests protect this boundary.

## 11. Discovery Inbox — decision-first presentation

There is one human decision surface.

The default candidate row answers only:

```text
Who is this?
Is it worth attention?
What should I do?
```

Visible row hierarchy:

```text
Company + place
status + one short reason

[Toevoegen]   [Waarom?]   [Website ↗]   [•••]
```

`Toevoegen` is the single primary action for a normal discovered candidate.

`Waarom?` progressively reveals evidence. Internal research scores, deterministic scores, source provenance and basis-gate detail are not repeated permanently across every row.

Positive normal system state such as `Basischeck OK` is not shown as a permanent badge. Exceptions such as an unreachable website remain explicit.

Rare/destructive actions such as **Afwijzen** and **Verwijderen** stay behind the existing overflow menu.

### Grouping semantics

```text
KANSRIJK
  research.decision = DEEP_AUDIT
  OR no research and deterministic verdict = STRONG

NOG BEOORDELEN
  research.decision = VERIFY_FIRST
  OR deterministic POSSIBLE / UNASSESSED / pending

LAGE PRIORITEIT
  research.decision = LOWER_PRIORITY / REJECT
  OR no research and deterministic verdict = WEAK

AFGEWEZEN
  state = DISQUALIFIED or hard basis gate failed
```

`KANSRIJK` and `NOG BEOORDELEN` are expanded by default.

`LAGE PRIORITEIT` and `AFGEWEZEN` are collapsed by default so the normal workflow is not dominated by candidates the system already considers less actionable.

Research ordering, when present:

1. provisional priority descending;
2. research rank ascending;
3. deterministic opportunity/fit as supporting evidence;
4. name.

No `candidate_priority` column or combined x/10 score is persisted.

## 12. Recent searches

Recent search history is supporting context, not the main task.

It is collapsed by default and limited to the five most recent runs. Labels use operator vocabulary:

```text
IMPORT → Gericht zoeken
AREA   → Breed zoeken
URL    → Bekend bedrijf
```

Raw run types remain durable system state but are not primary UI language.

## 13. Human authority

No source automatically promotes a company into the active prospect workflow.

```text
DISCOVERED
→ operator reviews evidence
→ operator explicitly promotes or rejects
```

Research rank is evidence.

Overture presence is evidence.

Deterministic website triage is evidence.

None is commercial authority.

## 14. Workflow state versus qualification

`QUALIFIED` as the workflow state means the operator deliberately selected the discovered candidate into active prospect work.

It does not mean every commercial qualification factor is already scored.

Until full qualification exists, the CMS must say:

```text
Kwalificatie
Nog niet uitgevoerd
```

rather than displaying an ambiguous `— / 25`.

## 15. Current commercial qualification

The existing five-factor 0–25 commercial qualification remains current during the pilot:

1. Customer Economics;
2. Existing Demand;
3. Conversion Opportunity;
4. Execution Fit;
5. Competitive Context.

Research priority does not replace it.

PDOS/WES/RDS/CPF can be used as experimental deeper evidence where fully measured, but must not become a permanent parallel scoring architecture before outcome calibration.

After sufficient outreach outcomes, compare predictive usefulness against replies, meetings, proposals, wins and gross margin. Choose one future canonical qualification model only when evidence supports it, then remove superseded competing logic.

## 16. Overture role

Overture has already demonstrated useful Dutch candidate recall. It remains supported while it earns that value.

Do not remove it merely because research produces better precision.

Do not preserve it merely because it exists either.

Compare incremental qualified yield and operator minutes in the commercial pilot.

## 17. Failure behaviour

### Research import

- malformed CSV → reject import before persistence;
- contract mismatch → reject explicitly;
- duplicate website → enrich existing candidate, no duplicate;
- missing evidence → preserve as missing/verification-needed, never invent;
- site-check unavailable → candidate remains reviewable as unassessed rather than receiving fabricated scores.

### Overture

Source/query failures remain explicit as documented in `docs/DISCOVERY_OVERTURE.md`.

### URL

Existing reachability/deduplication rules remain current.

## 18. Data minimization

Discovery targets business entities and public business websites.

Retain only information needed for prospect selection and the acquisition/learning loop.

Do not intentionally harvest private personal contact information or create individual enrichment merely because a source exposes it.

## 19. Non-goals

Do not add without observed need:

- generalized provider platform;
- separate candidate table;
- research-results table;
- AI research queue;
- background crawler;
- autonomous promotion;
- automatic deep audit across the raw candidate universe;
- PDOS database columns;
- entity-resolution ML;
- bulk scheduled refresh infrastructure;
- discovery wizard;
- generic UI-form builder;
- per-user search-layout preferences.

## 20. Acceptance

Discovery is technically complete only when:

```text
[ ] one search card presents exactly three modes
[ ] Gericht zoeken is the default mode
[ ] only one search mode is visible at a time
[ ] research extra instruction is collapsed by default
[ ] broad search exposes only place + sector in the normal path
[ ] Sectoronderzoek is not duplicated inside Bedrijven zoeken
[ ] producer and importer use the same research import contract
[ ] real research CSV imports without manual SQL
[ ] malformed CSV fails clearly
[ ] website dedupe/enrichment works
[ ] imported research persists under qualification.research
[ ] deterministic triage persists under qualification.triage
[ ] one cannot erase the other
[ ] candidate rows have one primary normal action: Toevoegen
[ ] detailed evidence is behind Waarom?
[ ] positive basis checks are not repeated as permanent badges
[ ] low-priority and rejected groups are collapsed by default
[ ] recent searches are collapsed and operator-labelled
[ ] human promotion remains explicit
[ ] Overture search still works
[ ] direct URL intake still works
[ ] missing full qualification is not presented as a score
[ ] no parallel candidate/workflow state was introduced
[ ] obsolete discovery UI copy/shortcut code is removed
```

## 21. Business evidence gate

For real batches, measure by discovery source:

```text
candidates discovered
usable websites
operator review minutes
promoted
rejected + reason
mailed
viewed
responded
meeting
proposal
win
```

The purpose is not to choose a technology winner in advance. It is to learn which source mix supplies the highest-value prospects at the lowest real operational burden.