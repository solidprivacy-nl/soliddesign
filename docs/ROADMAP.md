# Roadmap

The roadmap is evidence-gated. Completing code is not success; closing learning gates is success.

## Gate 0 — Documentation baseline ✅

**Goal:** one authoritative mission, architecture, guardrail, scoring, donor and business baseline.

Closed.

## Gate 1 — Offline component spike ✅

**Goal:** one golden prospect can travel through the composed path without external customer impact.

```text
fixture
→ audit adapter
→ qualification
→ verified facts
→ conversion brief
→ demo config
→ static preview
→ print pack
```

Closed with CI safety invariants.

## Gate 2 — Live single-prospect technical test

**Goal:** prove external integrations one by one using the lowest-cost discovery path.

### 2A. Overture Netherlands discovery

Required evidence:

- bounded Overture Places query works with no API key;
- actual Overture release ID is recorded;
- current `basic_category` / `taxonomy` fields are used;
- businesses without websites are excluded;
- `permanently_closed` is excluded;
- one Dutch sector/geography sample is manually quality-checked;
- stale/incorrect/duplicate rate is recorded;
- operator cleanup minutes are recorded;
- at least one candidate proceeds to audit.

### 2B. Audit and proof

Required evidence:

- one real public website can be audited safely;
- donor output normalizes to `AuditResult`;
- human qualification is evidence-backed;
- selected demo is generated from VerifiedFacts;
- static preview is published with noindex and concept notice;
- preview can be deleted/disabled;
- one minimal visit event can be recorded without invasive tracking.

### 2C. Source decision

After the sample:

```text
If Overture produces enough valid candidates
→ keep Overture only.

If Overture coverage is insufficient
→ define the measured gap first,
→ then test the smallest fallback.
```

Possible fallback order:

1. bounded OSM/Overpass enrichment;
2. targeted commercial enrichment such as Google Places only if justified.

No multi-source framework is built in advance.

## Gate 3 — Five-prospect operational feasibility

**Question:** can we repeatedly produce excellent prospect packs?

Measure:

- Overture query/runtime effort;
- raw candidates;
- valid-record rate;
- website/reachability yield;
- audit time;
- human selection minutes;
- demo generation minutes;
- manual correction minutes;
- print-pack minutes;
- failure/retry rate;
- total cost per qualified prospect.

Do not interpret five mailings as business validation.

## Gate 4 — 30–50 physical-mail offer validation

**Question:** do prospects pay attention and respond?

Measure:

- mail delivered count;
- demo visit rate;
- response rate;
- meeting rate;
- cost per mailed prospect;
- human minutes;
- concept-only versus live-demo delta where practical.

Discovery-source quality must also be tracked:

```text
raw → valid → audited → qualified → mailed → responded
```

This lets us detect whether poor outcomes come from source quality or offer quality.

## Gate 5 — Pricing / first customer

**Question:** will a suitable customer pay around the target price, and can we deliver profitably?

Measure:

- accepted project price;
- sales effort;
- delivery hours;
- corrections;
- external costs;
- gross margin;
- support burden.

## Gate 6 — 100+ prospect learning

**Question:** do pre-sale signals predict outcomes?

Compare:

- Customer Economics;
- independently evidenced Existing Demand;
- Conversion Opportunity;
- Execution Fit;
- Competitive Context;
- discovery source/release;

against:

- response;
- meetings;
- proposals;
- wins;
- actual gross margin.

Only then tune weights or consider predictive modeling.

## Gate 7 — Automate proven bottlenecks

Candidates only if evidence exists:

- market-name → bbox helper;
- OSM fallback;
- targeted reputation enrichment;
- operator gateway;
- queues;
- automated mailbox triage;
- production builder;
- richer dashboard;
- scheduled jobs;
- agentic workflows.

## Explicit non-roadmap items

Do not build merely because they seem technically useful:

- national Overture warehouse/mirror;
- Elasticsearch/vector search for places;
- multi-provider reconciliation engine;
- discovery agent;
- automated Google Maps scraping;
- generalized geospatial platform.

## Roadmap rule

No future gate may be implemented merely because it is visible on the roadmap. Evidence from the current gate must justify the next investment.
