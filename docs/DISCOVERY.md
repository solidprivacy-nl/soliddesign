# SolidDesign Discovery

**Status:** canonical production contract  
**Date:** 2026-09-09  
**Principle:** multiple concrete intake paths, one candidate boundary, one Discovery Inbox, one human decision.

## 1. Objective

Discovery supplies credible redesign prospects for the SolidDesign commercial loop with acceptable research and operator effort.

It is not a census platform, lead-data warehouse or generalized provider framework.

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
              VALIDATED CANDIDATE
                       ↓
                existing Supabase
                  candidate ingest
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
```

## 2. Operator UX

The CMS presents the business task, not source/provider machinery.

`Bedrijven zoeken` has one search surface with exactly three progressive modes:

```text
Gericht zoeken | Breed zoeken | Bekend bedrijf
    default
```

### Gericht zoeken

Recommended when prospect precision matters most.

Visible inputs:

```text
Sector
Plaats
+ Extra instructie   # collapsed by default
```

Normal flow:

```text
1. Kopieer opdracht
2. Importeer resultaat
```

The operator does not need PDOS terminology or CSV-contract internals in the normal flow.

### Breed zoeken

Used for inexpensive recall through Overture.

Visible inputs:

```text
Plaats
Sector
```

The routine result limit is internal rather than another operator setting.

### Bekend bedrijf

Used when a business website is already known.

Visible input:

```text
Website
```

Reachability and website-key dedupe run automatically. Sector classification is not required.

## 3. Sector boundary

Sector belongs to Discovery only.

```text
human sector + place
→ research scope or Overture category resolution
→ candidate
```

`canonical_sector_key` may persist when a validated key naturally exists. It is discovery/provenance metadata, not a Design instruction.

A direct-URL prospect may remain unclassified and still use the complete downstream workflow.

Discovery does not own or launch reusable Sector Intelligence. Prospect Design is governed by `docs/PROSPECT_FIRST_DESIGN.md`.

## 4. Three current intake paths

### Research Import

Purpose: precision and richer evidence about redesign/commercial opportunity.

```text
sector + location
→ canonical prospect-research invocation
→ ChatGPT research
→ CSV contract
→ validated import
→ candidate ingest
```

Durable provenance:

```text
discovery_runs.run_type = IMPORT
input.format = csv
input.method = prospect_research
prospects.discovery_source = research
qualification.research = imported research evidence
```

### Overture Area Search

Purpose: broad inexpensive recall from a bounded geography and sector.

Overture is a supported source adapter, not the definition of Discovery itself. Source-specific behavior lives in `docs/DISCOVERY_OVERTURE.md`.

### Specific URL

Purpose: intake for a known business website supplied directly by an operator.

It reuses the existing website preflight and deduplication path.

## 5. One candidate boundary

All three paths normalize into the existing prospect/candidate ingest shape and `operator_ingest_discovery_candidates` RPC.

Relevant fields include:

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

Website-key dedupe remains authoritative. No second candidate table, research-results table or provider registry exists.

## 6. Research transport contract

The one machine-readable producer/consumer contract is:

```text
prompts/contracts/prospect-research-import-v1.json
```

```text
prospect-research prompt
→ reads contract
→ produces CSV

CMS importer
→ reads same contract
→ validates CSV
```

CSV is transport, not domain architecture.

The browser uses the pinned mature CSV parser already in the implementation. Validation rejects malformed headers/order, oversized input, invalid enums/booleans/rank/text and non-HTTP(S) URLs before persistence.

A matching website domain enriches the existing candidate instead of creating a duplicate.

## 7. Evidence namespaces

Research and deterministic website evidence remain separate:

```text
qualification.research
= external evidence-backed prospect research

qualification.triage
= cheap deterministic website/preflight evidence
```

Any writer to `prospects.qualification` must preserve unrelated namespaces. Research never overwrites triage and triage never overwrites research/full qualification.

Research rank and deterministic triage are evidence, not commercial authority.

## 8. Discovery Inbox

One Inbox remains the decision surface.

Default candidate presentation is decision-first:

```text
Company + place
status + short reason

[Toevoegen] [Waarom?] [Website ↗] [•••]
```

`Toevoegen` is the primary normal action. Detailed evidence sits behind `Waarom?`.

Groups:

```text
KANSRIJK
NOG BEOORDELEN
LAGE PRIORITEIT      # collapsed by default
AFGEWEZEN            # collapsed by default
```

Recent searches are supporting context, collapsed by default and operator-labelled:

```text
IMPORT → Gericht zoeken
AREA   → Breed zoeken
URL    → Bekend bedrijf
```

## 9. Human authority

No source automatically promotes a company.

```text
DISCOVERED
→ operator reviews evidence
→ explicit promote or reject
```

`QUALIFIED` workflow state means the operator selected the candidate into active prospect work. It does not mean the full commercial qualification has been completed.

Until full qualification exists, the CMS says `Nog niet uitgevoerd` rather than showing an implied score.

## 10. Commercial qualification

The current five-factor 0–25 qualification remains canonical during the pilot:

1. Customer Economics;
2. Existing Demand;
3. Conversion Opportunity;
4. Execution Fit;
5. Competitive Context.

Research priority does not replace it. PDOS/WES/RDS/CPF remain experimental deeper evidence until real outcomes justify calibration and a future single canonical model.

## 11. Failure behavior

### Research Import

- malformed/mismatched CSV → reject before persistence;
- duplicate website → enrich existing candidate, no duplicate;
- missing evidence → preserve as missing/verification-needed;
- site-check unavailable → remain unassessed; never fabricate a score.

### Overture

Source/query failures remain explicit per `docs/DISCOVERY_OVERTURE.md`.

### Specific URL

Existing reachability and dedupe rules remain current.

## 12. Data minimization

Discovery targets business entities and public business websites. Retain only information needed for prospect selection and the acquisition/learning loop.

Do not intentionally harvest private personal contact information or create person-level enrichment merely because a source exposes it.

## 13. Explicit non-goals

Do not add without observed need:

- generalized discovery-provider platform;
- fourth hidden provider/fallback;
- separate candidate/research-results tables;
- AI research queue/background crawler;
- autonomous promotion/deep-audit sweep;
- PDOS database columns/parallel permanent score model;
- entity-resolution ML;
- scheduled bulk refresh infrastructure;
- discovery wizard/form framework;
- reusable sector-research/design subsystem.

## 14. Technical acceptance — verified

Current production implementation and CI establish all of the following:

- one search card exposes exactly `Gericht zoeken`, `Breed zoeken`, `Bekend bedrijf`;
- `Gericht zoeken` is default and only one mode is visible at a time;
- research extra instruction and recent searches use progressive disclosure;
- broad search exposes only place + sector as routine inputs;
- no Sectoronderzoek workspace/shortcut exists;
- producer and importer use the same versioned research contract;
- research CSV import is validated before persistence and needs no manual SQL;
- website dedupe/enrichment is one existing path;
- research persists under `qualification.research`;
- deterministic evidence persists under `qualification.triage` and writers are merge-safe;
- one Discovery Inbox remains the human decision surface;
- candidate rows have one primary normal action: `Toevoegen`;
- details are behind `Waarom?`, and low-priority/rejected groups are collapsed;
- human promotion remains explicit;
- Overture search remains supported;
- direct URL intake works without sector classification;
- missing full qualification is presented explicitly, not as a fake score;
- no parallel candidate/workflow state or retired discovery provider runtime remains.

Technical Discovery is therefore complete. The active gate is commercial evidence, not more architecture.

## 15. Business evidence gate

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

The goal is not to choose a technology winner in advance. It is to learn which source mix supplies the highest-value prospects at the lowest real operational burden.
