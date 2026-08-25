# Overture Discovery Model — Phase 1

**Status:** canonical Phase-1 discovery contract  
**Primary source:** Overture Maps Places  
**Fallback/enrichment:** optional, evidence-gated  
**Principle:** solid but simple; no overengineering

## 1. Decision

SolidDesign uses **Overture Maps Places as the canonical Phase-1 business discovery source**.

Google Places is no longer required for prospect enumeration. It may be used later as optional enrichment if real experiments prove that a Google-specific signal such as rating/review volume materially improves selection quality enough to justify cost and account complexity.

The resulting model is:

```text
OVERTURE PLACES
      ↓
bounded geography
      ↓
sector/taxonomy filter
      ↓
existing website required
      ↓
operating-status / data-quality screening
      ↓
website reachability + Pitch Doctor audit
      ↓
human qualification
      ↓
selected prospects
      ↓
optional manual / paid enrichment only if useful
```

This is deliberately not a multi-source discovery platform.

## 2. Why Overture

Phase 1 does not need a perfect census of every Dutch company. It needs enough valid businesses in one sector and geography to produce 5, then 30–50, credible commercial tests.

Overture is a strong fit because:

- the Places theme contains 75M+ global real-world place records;
- it is openly accessible without a Google Cloud project, API key or per-request billing;
- Overture publishes cloud-hosted GeoParquet on Amazon S3 and Microsoft Azure;
- official tooling and DuckDB can query only a bounded area;
- place records can contain name, category/taxonomy, website, phone, address, operating status and source confidence;
- Overture uses stable GERS IDs that can help deduplicate and track entities across releases;
- the data is compiled from multiple providers instead of being tied to one commercial discovery API.

Primary documentation:

- https://docs.overturemaps.org/guides/places/
- https://docs.overturemaps.org/getting-data/
- https://docs.overturemaps.org/getting-data/cloud-sources/
- https://docs.overturemaps.org/attribution/

## 3. What Overture is not

Overture is **not**:

- the Dutch Chamber of Commerce / KvK register;
- a guarantee that every Dutch company is present;
- a guarantee that every record is current;
- a demand or reputation database;
- a substitute for website audit evidence;
- a source of Google ratings/review counts.

A record appearing in Overture means only that it is part of Overture's place data. It does not prove commercial attractiveness.

## 4. Netherlands assumption

We do not hard-code a claim that Overture has complete Dutch business coverage.

The Phase-1 hypothesis is narrower:

> For a selected Dutch sector and local geography, Overture can return enough current businesses with working websites to supply the commercial experiment at acceptable human-cleanup cost.

This is measured empirically.

### Netherlands coverage test

For each new market/sector sample, record:

```text
raw places returned
businesses with website
website reachable
correct sector
correct geography
apparently active
duplicates
stale/incorrect records
qualified after audit
human cleanup minutes
```

Suggested quality ratios:

```text
website_yield        = with_website / raw_places
valid_record_rate    = real_current_correct / sampled_records
audit_eligible_rate  = audit_eligible / with_website
qualified_rate       = qualified / audited
```

No arbitrary minimum is treated as universal truth. Gate 2 records the actual values and determines whether Overture alone is sufficient.

## 5. Current Overture taxonomy

Overture is migrating the Places schema away from the legacy `categories` property.

As of the July 22, 2026 release:

- `categories` is deprecated;
- `basic_category` is the simplified category label;
- `taxonomy.primary` is the most specific current taxonomy label;
- `taxonomy.hierarchy` contains the general-to-specific hierarchy;
- `taxonomy.alternates` contains additional categories.

The legacy `categories` field is announced for removal in September 2026.

**SolidDesign therefore does not build new logic on `categories`.**

Canonical category matching uses:

```text
basic_category
taxonomy.primary
taxonomy.hierarchy
taxonomy.alternates
```

This is a deliberate forward-compatibility decision, not an abstraction layer.

Reference:

- https://docs.overturemaps.org/blog/2026/07/22/release-notes/
- https://docs.overturemaps.org/guides/places/taxonomy/
- https://docs.overturemaps.org/schema/reference/places/types/taxonomy/

## 6. Geography contract

Overture queries are bounded by a rectangle:

```text
west,south,east,north
```

Example shape:

```text
4.90,52.00,5.20,52.20
```

The values above illustrate format only; the operator must select a bounding box appropriate to the actual experiment.

Why explicit bbox in Phase 1:

- deterministic;
- no geocoder dependency;
- no hidden API/account;
- easy to reproduce;
- easy to record alongside experiment results.

Do not build a geocoding service merely to make this input prettier. Add market-name resolution only if repeated operator friction proves it useful.

The official Overture Python-client docs also use `west,south,east,north` bbox order.

## 7. Sector contract

Sector filters should use Overture taxonomy labels, not arbitrary Dutch marketing phrases.

Example:

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50
```

`--category` can be repeated and is OR-matched.

Example:

```bash
--category electrician \
--category plumber
```

If the desired sector does not map cleanly to a taxonomy label, first inspect Overture Explorer/taxonomy. Do not solve ambiguity by introducing an LLM into discovery.

## 8. Candidate fields

Phase-1 `Prospect` captures:

```text
id                     SolidDesign ID
name                   business/place name
category               normalized Overture basic/taxonomy category
city                   locality when available
address                freeform address when available
website_url            required
phone                   optional
place_id                Overture GERS/place ID
discovery_source        overture
discovery_version       Overture release ID
source_confidence       Overture existence confidence, when present
operating_status        Overture operating status, when present
rating                  normally null at discovery
review_count            normally null at discovery
```

### Important semantic rule

`source_confidence` is **not a demand score**.

Overture defines `confidence` as confidence that the place exists. A high value cannot be converted into evidence that the business has many customers, strong reviews or high purchase intent.

Similarly, `operating_status` is an activity/existence signal, not proof of demand.

## 9. Discovery filters

Phase 1 applies only the filters required by the business model:

### Required

- bounded geography;
- name exists;
- website exists;
- not marked `permanently_closed`;
- sector/category filter when the experiment defines one.

### Not required by default

- phone;
- email;
- social profile;
- minimum source-confidence threshold;
- review count;
- rating.

Why no arbitrary confidence cutoff:

A missing confidence value means Overture has no confidence information, not that the place is invalid. We preserve confidence as evidence and validate the website/business downstream.

## 10. Existing website requirement

SolidDesign targets conversion leakage on an existing website.

Therefore:

```text
website missing
→ not a Phase-1 SolidDesign prospect
```

This is the inverse of many web-agency lead generators.

The website is subsequently validated for:

- public HTTP(S);
- safe network destination;
- reachability;
- identity match;
- auditability.

An Overture URL is discovery evidence, not automatically trusted truth.

## 11. Release policy

Default live behavior:

```text
official Overture STAC catalog
→ latest release
```

The adapter records the release in `Prospect.discovery_version`.

For reproducible experiments, the operator can pin:

```bash
--release 2026-07-22.0
```

or set:

```text
OVERTURE_RELEASE=2026-07-22.0
```

Rules:

1. commercial batches should record release ID;
2. do not silently compare two batches as if identical when source releases differ;
3. schema-breaking release changes require tests/docs review;
4. no automatic donor-framework upgrade is implied by an Overture data release.

## 12. Cost model

For the Overture source itself:

```text
API key          none
Google project   none
per-request API fee  none
```

Overture describes its datasets as freely available from its public cloud sources.

This does **not** mean every execution environment is universally costless: local/cloud compute, network, storage or downstream tools can still have costs.

For Phase 1, measure:

```text
source API fee              €0 expected
query runtime
downloaded/scanned data
operator minutes
invalid-record cleanup
cost per qualified prospect
```

The economic advantage matters only if data quality remains sufficient.

## 13. Demand evidence after removing Google Places

The business thesis remains:

> Convert existing demand better.

But Overture discovery does not itself prove demand.

Demand becomes a **separate qualification step**.

Evidence may include:

- commercial-intent sector;
- evidence that the business is established/active;
- search visibility observed during human review;
- review/reputation evidence observed manually or from a later lawful enrichment source;
- local peer comparison;
- website traffic/search evidence if legitimately available;
- market-specific signals.

Do not assign high Existing Demand merely because:

- the business exists in Overture;
- it has a website;
- Overture confidence is high.

This separation is intentional:

```text
DISCOVERY asks:
Does this business belong in the candidate universe?

QUALIFICATION asks:
Is there enough economic demand to pursue it?
```

## 14. Optional Google use

Google Places is no longer a Phase-1 dependency.

Possible later uses:

- targeted rating/review enrichment for the final shortlist;
- validating whether review signals improve response/win prediction;
- filling a proven Overture coverage gap.

Rules:

- no Google scraping;
- no paid enrichment across the full raw universe by default;
- only add an API if measured value exceeds cost/complexity;
- keep Google-specific data optional in `Prospect`.

## 15. Fallback strategy

Do not start with multiple live discovery sources.

Fallback ladder:

```text
1. Overture alone
      ↓ if insufficient empirical coverage
2. Overture + bounded OpenStreetMap/Overpass enrichment
      ↓ if still insufficient and economics justify it
3. targeted commercial source such as Google Places
```

A fallback is justified by evidence such as:

- too few valid candidates;
- systematic missing categories;
- unacceptable stale-record rate;
- missing attributes that materially improve selection.

Not by architecture preference.

## 16. Deduplication

Use Overture's place/GERS ID as the primary source identifier when present.

Additional dedupe can later use:

```text
normalized website host
+
normalized business name
+
address
```

Do not build a generalized entity-resolution system before duplicates become operationally material.

## 17. Privacy and responsible use

Phase 1 targets business entities and business contact surfaces.

Rules:

- minimize personal data;
- do not intentionally harvest personal/private e-mail addresses;
- do not enrich individuals without a defined lawful purpose;
- do not publish raw prospect datasets in this public repository;
- retain only data required by the acquisition/learning experiment.

Overture's own contribution guidelines seek to exclude PII, but SolidDesign must still apply its own data-minimization rules.

## 18. Licensing and attribution

Overture Places combines multiple permissively licensed sources.

SolidDesign records:

```text
Data source: Overture Maps Foundation
Access date / release
Place/GERS ID where available
```

Use appropriate attribution when Overture data is published/displayed externally. Internal lead-selection results are still documented with source provenance.

See:

- https://docs.overturemaps.org/attribution/

The runtime query engine is DuckDB; donor inspiration for the bounded Overture/DuckDB pattern was also reviewed in `Dukotah/leadgen` under MIT.

## 19. Failure handling

Discovery must fail loudly rather than silently return a misleading empty universe when:

- STAC latest-release lookup fails;
- release ID is malformed;
- DuckDB/httpfs cannot query Overture;
- query/schema is incompatible.

An actual empty result from a successful query is different from infrastructure failure.

## 20. Phase-1 acceptance test

Gate 2 closes the Overture discovery portion when one real Dutch market/sector run proves:

```text
[ ] bounded Overture query succeeds
[ ] release ID recorded
[ ] candidates have existing websites
[ ] sampled records are manually checked
[ ] stale/incorrect rate recorded
[ ] at least one candidate reaches audit
[ ] no Google key/billing is required
[ ] operator time is recorded
```

Gate 3 then measures repeatability over five prospects.

## 21. Anti-overengineering rule

Do not add:

- Elasticsearch;
- a geocoding microservice;
- a map tile server;
- a national Overture mirror;
- multi-provider reconciliation;
- entity-resolution ML;
- a discovery agent;
- scheduled bulk refreshes;

until the current bounded-query model is proven insufficient.

The canonical Phase-1 implementation is intentionally:

```text
bbox + taxonomy
→ DuckDB
→ Overture cloud GeoParquet
→ Prospect[]
```

That is enough to test the business.
