# Overture Discovery Adapter

**Status:** supported discovery-source adapter  
**Canonical discovery contract:** `docs/DISCOVERY.md`  
**Principle:** broad inexpensive recall; not commercial qualification.

## 1. Role

Overture Maps Places is one current SolidDesign candidate source.

Its job is deliberately narrow:

```text
bounded geography
+ sector/taxonomy filter
→ businesses with websites
→ existing candidate intake
→ deterministic triage
→ Discovery Inbox
```

Overture is no longer the definition of SolidDesign discovery. Research import and direct URL intake are equally valid entry points into the same Inbox.

The empirical Gate-2/Gate-3 evidence supporting continued Overture use remains valid: it can supply a sufficiently large Dutch candidate universe at negligible source cost and the existing human layer can reject poor commercial candidates.

## 2. What Overture evidence means

Overture place presence can support that a business/place record exists in the source dataset.

It does **not** prove:

- demand;
- reputation;
- commercial attractiveness;
- website redesign need;
- Google review volume/rating;
- complete Dutch company coverage.

`source_confidence`, when present, is existence confidence and must never be converted into demand evidence.

`operating_status` is an activity/existence signal, not a sales qualification score.

## 3. Current query contract

The current Operator implements the smallest proven pattern:

```text
place name entered by operator
→ existing geocode boundary
→ bounded Overture query
→ taxonomy match
→ website required
→ normalized candidate rows
```

The browser currently uses DuckDB WASM against the Overture cloud GeoParquet release discovered through the official STAC catalog.

Do not introduce a national mirror, search service or discovery backend merely to replace this proven bounded query.

## 4. Current taxonomy

New logic must use current Overture taxonomy fields rather than the deprecated legacy `categories` field:

```text
basic_category
taxonomy.primary
taxonomy.hierarchy
taxonomy.alternates
```

Sector identity in SolidDesign is separate from Overture taxonomy. Overture taxonomy is source query vocabulary; `prospects.canonical_sector_key` is optional SolidDesign discovery/provenance metadata when a validated key naturally exists. It is not required downstream and is never Design context or a design instruction.

## 5. Candidate fields

The adapter may provide:

```text
name
category
city
address
website_url
phone
place_id
discovery_source = overture
discovery_version = Overture release
source_confidence
operating_status
canonical_sector_key when one sector is resolved
```

Rating/review fields are normally absent at discovery and must not be invented.

## 6. Existing website requirement

SolidDesign's acquisition model targets leakage on an existing owned website.

Therefore the Overture adapter requires a website URL before a record enters the candidate intake.

The URL remains source evidence, not automatically trusted truth; downstream preflight validates the destination.

## 7. Release provenance

The adapter resolves the latest official Overture release at run time and records the release identifier in candidate/run provenance.

Do not silently compare batches from different releases as if the source snapshot were identical.

Schema-breaking Overture changes require adapter tests and documentation review.

## 8. Cost and operational value

Overture requires no Google Cloud project and no per-request Places API fee for the current query model.

Actual business cost still includes:

- browser/query time;
- data transfer/compute;
- invalid-record cleanup;
- operator review minutes.

Its continued place in SolidDesign is evidence-gated by qualified yield and human effort, not by architectural preference.

## 9. Deduplication

Overture `place_id` remains useful source provenance.

SolidDesign's practical cross-source candidate deduplication remains the normalized website key in the existing prospect ingest.

Do not build generalized entity-resolution infrastructure before actual duplicate behaviour proves it necessary.

## 10. Failure handling

Fail explicitly when:

- release lookup fails;
- Overture source query fails;
- DuckDB/httpfs initialization fails;
- taxonomy/schema becomes incompatible.

A successful query returning zero candidates is different from infrastructure failure and must not be disguised as the same state.

## 11. Responsible use

Keep public business data only to the extent required by the prospect-selection/acquisition loop.

Do not enrich individual people merely because source records expose contact details.

Apply Overture attribution/licensing requirements when data is published externally.

## 12. Non-goals

Do not add without measured need:

- national Overture mirror;
- geospatial search service;
- Elasticsearch;
- provider reconciliation;
- automated source enrichment;
- entity-resolution ML;
- scheduled bulk refreshes;
- an Overture-specific candidate workflow.

## 13. Removal/evolution gate

Keep this adapter while it supplies useful incremental candidates at acceptable operator cost.

Remove or replace it only when real comparative discovery evidence demonstrates that it no longer earns its maintenance/operational burden.

All candidate workflow semantics live in `docs/DISCOVERY.md`; this document owns only Overture-specific source/query behaviour.
