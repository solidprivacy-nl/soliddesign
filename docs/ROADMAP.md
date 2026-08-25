# Roadmap

The roadmap is evidence-gated. Completing code is not success; closing learning gates is success.

## Gate 0 — Documentation baseline

**Goal:** one authoritative mission, architecture, guardrail, scoring, donor and business baseline.

Exit criteria:

- mission contract committed;
- architecture committed;
- guardrails committed;
- business/pricing boundaries committed;
- scoring rubrics committed;
- donor provenance committed;
- security baseline committed.

## Gate 1 — Component spike

**Goal:** one golden prospect can travel through the composed path without external customer impact.

```text
fixture/discovery
→ audit adapter
→ qualification
→ verified facts
→ conversion brief
→ demo config
→ static preview
→ print pack
```

Exit criteria:

- deterministic golden fixture;
- tests green;
- preview renders;
- print pack renders;
- no raw external website content crosses the verified-facts boundary;
- no secrets required for fixture run.

## Gate 2 — Live single-prospect technical test

**Goal:** prove external integrations one by one.

Required evidence:

- Google Places discovery works with scoped key;
- one real website can be audited safely;
- audit normalizes correctly;
- human-selected demo can be generated;
- static preview can be published with noindex;
- preview can be deleted/disabled;
- visit event can be recorded without invasive tracking.

## Gate 3 — Five-prospect operational feasibility

**Question:** can we repeatedly produce excellent prospect packs?

Measure:

- discovery time/cost;
- audit time/cost;
- human selection minutes;
- demo generation minutes;
- manual correction minutes;
- print-pack minutes;
- failure/retry rate.

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

**Question:** do our pre-sale signals predict outcomes?

Compare scores with:

- response;
- meetings;
- proposals;
- wins;
- actual gross margin.

Only then tune weights or consider statistical modeling.

## Gate 7 — Automate proven bottlenecks

Candidates only if evidence exists:

- operator gateway;
- Cloudflare Access/Worker;
- queues;
- automated mailbox triage;
- additional discovery sources;
- production builder;
- richer dashboard;
- scheduled jobs;
- agentic workflows.

## Roadmap rule

No future gate may be implemented merely because it is visible on the roadmap. Evidence from the current gate must justify the next investment.
