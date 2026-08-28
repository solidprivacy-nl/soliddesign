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

## Gate 2 — Live single-prospect technical test ✅

**Goal:** prove external integrations one by one using the lowest-cost discovery path.

Closed on 2026-08-25 with one real Utrecht service-business proof.

### 2A. Overture Netherlands discovery — proven

Evidence:

- bounded Overture Places query worked with no API key;
- release `2026-08-19.0` recorded;
- current `basic_category` / `taxonomy` fields used;
- canonical query requires an existing website and excludes `permanently_closed`;
- refined Utrecht service query returned 996 website-bearing records / 930 unique domains;
- 740 records reported locality Utrecht;
- 83 installation-related candidates surfaced;
- at least one candidate proceeded to live audit.

A first broad `LIMIT` sample was shown to be geographically biased. Canonical operating rule is now `bbox + sector filter → limit`, not arbitrary first-N interpretation.

A larger stale/incorrect-rate sample and operator-cleanup timing are **not Gate-2 blockers**. Those are repeatability/economics questions and are measured in Gate 3 instead of creating checklist work before repeated operation exists.

### 2B. Audit and proof — proven

Evidence:

- one real public website was audited safely;
- raw donor output normalized to `AuditResult`;
- failed-load cascading findings were separated from verified root causes;
- human qualification was evidence-backed at 19/25;
- selected demo generated from VerifiedFacts;
- static Cloudflare Pages preview published under an opaque path;
- browser HTTP 200 verified;
- HTML `noindex`, no form and no testimonials verified;
- preview disable lifecycle proved with a neutral unavailable page;
- original proof restored successfully;
- one minimal synthetic preview-visit event recorded without fingerprinting;
- selected operational state persisted in the dedicated SolidDesign Supabase project.

### 2C. Source decision — closed

Observed candidate volume is sufficient for the Phase-1 MVP.

Decision:

```text
Overture remains canonical primary source.
No fallback source is activated.
```

Fallback order remains available only after a measured gap:

1. bounded OSM/Overpass enrichment;
2. targeted commercial enrichment such as Google Places only if justified.

No multi-source framework is built in advance.

See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

## Gate 3 — Five-prospect operational feasibility ✅

**Question:** can we repeatedly produce excellent prospect packs?

Closed on 2026-08-25.

Five real prospects were selected from the Overture candidate universe using independent demand evidence plus human root-cause review. Raw Pitch Doctor score was not used as an automatic qualification decision; several low-scoring sites were rejected because their real current website was already materially stronger or the audit was unreliable.

Final proof:

- 5 qualified prospects;
- qualification scores: 24, 21, 23, 21 and 23 out of 25;
- all 5 premium-v1 concepts assembled successfully;
- all 5 passed `noindex`, no-form and no-gradient safety checks;
- all 5 returned zero Impeccable findings;
- desktop and mobile proof screenshots completed;
- one existing Cloudflare Pages project / one static deployment tree used;
- all 5 opaque live preview paths verified HTTP 200;
- total deterministic concept assembly time: 0.564 seconds;
- no recurring technical blocker required new architecture.

Human selection/research/root-cause review remains the meaningful labour component. No fabricated human-time metric is recorded where a reliable measurement was not captured.

Repeated design observation: the five concepts are visually homogeneous when viewed side by side. This is recorded as a limitation, not as justification for a template catalogue or second builder. Commercial evidence must show that more variation matters before adding a second deterministic composition.

See `docs/evidence/GATE3_FIVE_PROSPECT_RUN.md`.

## Gate 4 — 30–50 physical-mail offer validation ← CURRENT

**Question:** do qualified prospects pay attention and respond?

This is now the primary uncertainty. Do not add architecture before measuring it.

Start with the five already-qualified Gate-3 prospects as the first bounded outbound batch, then expand toward 30–50 only after the physical-mail/follow-up workflow is operationally clear.

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

This lets us detect whether poor outcomes come from source quality, qualification quality, offer quality or execution.

Gate-4 guardrails:

- physical direct mail remains human-approved;
- human sales follow-up remains human-executed;
- no autonomous outbound;
- no new queue, CRM, orchestration layer or dashboard unless repeated measured friction requires it;
- use the existing previews and print-pack path first;
- record outcomes before changing qualification weights or design architecture.

**Exit condition:** enough mailed prospects and follow-up outcomes exist to estimate whether the offer gets attention and creates qualified conversations. Five mailings alone are an operational first batch, not business validation.

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
