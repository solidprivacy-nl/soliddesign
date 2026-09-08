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

## 2. Exactly three current intake paths

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

## 3. No provider framework

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

## 4. Candidate boundary

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

The existing Supabase `operator_ingest_discovery_candidates` RPC stays authoritative for persistence and existing website-domain deduplication.

No second candidate table exists.

## 5. Research transfer contract

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

The contract is deliberately narrow and versioned because producer/consumer drift is a real failure mode.

## 6. CSV parsing and validation

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

## 7. Research evidence

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

## 8. Deterministic triage

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

## 9. Qualification merge invariant

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

The Discovery triage writer explicitly spreads existing qualification content before replacing its own `triage` namespace.

Regression tests must protect this boundary.

## 10. Discovery Inbox

There is one human decision surface.

Presentation derives the richest available evidence without creating another persisted state.

Suggested grouping semantics:

```text
AFGEWEZEN
  state = DISQUALIFIED or hard basis gate failed

AANBEVOLEN
  research.decision = DEEP_AUDIT
  OR no research and deterministic verdict = STRONG

BEOORDELEN
  research.decision = VERIFY_FIRST
  OR deterministic POSSIBLE / UNASSESSED / pending

LAGE PRIORITEIT
  research.decision = LOWER_PRIORITY / REJECT
  OR no research and deterministic verdict = WEAK
```

Research ordering, when present:

1. provisional priority descending;
2. research rank ascending;
3. deterministic opportunity/fit as supporting evidence;
4. name.

No `candidate_priority` column or combined x/10 score is persisted.

## 11. Human authority

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

## 12. Workflow state versus qualification

`QUALIFIED` as the workflow state means the operator deliberately selected the discovered candidate into active prospect work.

It does not mean every commercial qualification factor is already scored.

Until full qualification exists, the CMS must say:

```text
Kwalificatie
Nog niet uitgevoerd
```

rather than displaying an ambiguous `— / 25`.

## 13. Current commercial qualification

The existing five-factor 0–25 commercial qualification remains current during the pilot:

1. Customer Economics;
2. Existing Demand;
3. Conversion Opportunity;
4. Execution Fit;
5. Competitive Context.

Research priority does not replace it.

PDOS/WES/RDS/CPF can be used as experimental deeper evidence where fully measured, but must not become a permanent parallel scoring architecture before outcome calibration.

After sufficient outreach outcomes, compare predictive usefulness against replies, meetings, proposals, wins and gross margin. Choose one future canonical qualification model only when evidence supports it, then remove superseded competing logic.

## 14. Overture role

Overture has already demonstrated useful Dutch candidate recall. It remains supported while it earns that value.

Do not remove it merely because research produces better precision.

Do not preserve it merely because it exists either.

Compare incremental qualified yield and operator minutes in the commercial pilot.

## 15. Failure behaviour

### Research import

- malformed CSV → reject import before persistence;
- contract mismatch → reject explicitly;
- duplicate website → existing ingest dedupe prevents duplicate prospect;
- missing evidence → preserve as missing/verification-needed, never invent;
- site-check unavailable → candidate remains reviewable as unassessed rather than receiving fabricated scores.

### Overture

Source/query failures remain explicit as documented in `DISCOVERY_OVERTURE.md`.

### URL

Existing reachability/deduplication rules remain current.

## 16. Data minimization

Discovery targets business entities and public business websites.

Retain only information needed for prospect selection and the acquisition/learning loop.

Do not intentionally harvest private personal contact information or create individual enrichment merely because a source exposes it.

## 17. Non-goals

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
- bulk scheduled refresh infrastructure.

## 18. Acceptance

Discovery cutover is complete only when:

```text
[ ] research invocation uses the canonical Prompt Library
[ ] producer and importer use the same research import contract
[ ] real research CSV imports without manual SQL
[ ] malformed CSV fails clearly
[ ] website dedupe still works
[ ] imported research persists under qualification.research
[ ] deterministic triage persists under qualification.triage
[ ] one cannot erase the other
[ ] research evidence appears in the existing Discovery Inbox
[ ] human promotion remains explicit
[ ] Overture search still works
[ ] direct URL intake still works
[ ] missing full qualification is not presented as a score
[ ] no parallel candidate/workflow state was introduced
```

## 19. Business evidence gate

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
