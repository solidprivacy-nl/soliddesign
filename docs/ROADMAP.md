# Roadmap

SolidDesign is evidence-gated: code completion is not business validation. Technical cutovers close on implementation + verification + cleanup; operator/commercial assumptions close only on real operating evidence.

Current architecture is governed by `ENGINEERING_CONSTITUTION.md`, `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`, `docs/PROSPECT_FIRST_DESIGN.md`, `docs/WEBSITE_OPPORTUNITY_REVIEW.md`, `docs/DISCOVERY.md`, `docs/PROMPT_LIBRARY.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md` and this roadmap. Historical plans/evidence explain decisions but do not override current state.

## Technical foundation

- **Gate 0 — Documentation baseline:** ✅ closed.
- **Gate 1 — Offline component spike:** ✅ closed with CI safety invariants.
- **Gate 2 — Live single-prospect technical test:** ✅ closed on 2026-08-25. Overture proved a viable discovery source; it is not the only discovery path.
- **Gate 3 — Five-prospect operational feasibility:** ✅ technical pipeline passed. The system can repeatedly produce safe prospect concepts without additional execution architecture.

## Integrated operating model — ✅ production foundation complete

Canonical model:

```text
SYSTEM ROLES
ADMIN | KEY_USER | USER

PROSPECT RESPONSIBILITIES
CASE_LEAD | DESIGN | OUTREACH

CURRENT PUBLIC ROUTE
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

### M0–M6 — Core operating foundation ✅

Completed capabilities include:

- one application / one Supabase operational state plane;
- invite-only team identity and `ADMIN / KEY_USER / USER`;
- explicit CASE_LEAD / DESIGN / OUTREACH responsibility;
- actor-aware history;
- public slug → LIVE stored artifact delivery;
- engagement MVP without visitor fingerprinting;
- immutable printmailing artifacts with exact-version send registration.

## M7 — Prompt Library + research-discovery cutover ✅ production complete 2026-09-08

### Prompt Library ✅

```text
GitHub prompts/library/
→ authenticated metadata/body API
→ one invocation renderer
→ CMS Prompts page
```

Current rules:

- GitHub is canonical for operator prompt body/history;
- no prompt/version table exists in Supabase;
- User/Key User receive metadata + invocation fields, not prompt body through management APIs;
- Admin may read/create/update/delete operator prompts;
- writes are confined to `prompts/library/` and use SHA optimistic concurrency;
- PR previews are read-only for Prompt Library writes;
- system design prompts remain engineering-governed.

### Research Discovery ✅

Exactly three intake paths remain:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
                 Discovery Inbox
```

Research flow:

```text
sector + location
→ prospect-research invocation
→ ChatGPT research
→ canonical CSV contract
→ validated import
→ qualification.research
→ deterministic qualification.triage
→ one Discovery Inbox
→ explicit human promote / reject
```

No provider framework, candidate table, research-results table, crawler/agent, job queue or server-side AI execution was introduced.

## M8 — Integrated operational/commercial pilot ← ACTIVE

The system is optimized for real operator use and commercial learning rather than architecture for its own sake. Material friction discovered while exercising the real acquisition loop may earn the smallest root-cause correction.

### M8.1 — Discovery operator UX ✅ production 2026-09-08

`Bedrijven zoeken` presents one task with three progressive modes:

```text
Gericht zoeken    # default/recommended
Breed zoeken
Bekend bedrijf
```

Candidate decision surface:

```text
KANSRIJK             # expanded
NOG BEOORDELEN       # expanded
LAGE PRIORITEIT      # collapsed
AFGEWEZEN             # collapsed

candidate
→ status + short reason
→ Toevoegen
→ Waarom? / Website / overflow when needed
```

Canonical detail: `docs/DISCOVERY.md`.

### M8.2 — Prospect-first Design cutover ✅ production complete 2026-09-09

Business objective achieved: Design is immediately understandable as prospect-specific work and no longer carries a reusable sector-research/linking subsystem.

Current boundary:

```text
DISCOVERY
sector may help find/classify a business
        ↓
PROSPECT
        ↓
DESIGN
sector no longer participates
```

Delivered:

- top-level `Sectoronderzoek` workspace removed;
- Sector Intelligence research/review/publication API/UI/content removed;
- manual prospect-sector linking removed;
- `Sector voor design` and separate sector-improvement prompt removed;
- Prospect Design Brief v0.4 and Bootstrap v0.4 closed the original cutover without sector lookup;
- unused `prompts/sectors/` overlay hook removed;
- sector input/resolution retained in Discovery;
- `canonical_sector_key` retained only as legitimate discovery/provenance metadata;
- Design reduced to one primary ChatGPT action: `Kopieer designopdracht`;
- clean two-URL ChatGPT handoff resolves the design method from the supplied `SOLIDDESIGN_ORIGIN` and requires no repository/provider discovery;
- project settings remain behind progressive disclosure;
- website version lifecycle remains `upload → CONCEPT → inspect → LIVE`;
- printmailing artifact creation remains in Design and physical send remains in Outreach;
- obsolete sector API/RPC/tests/deploy paths and conflicting current docs removed;
- unused Google Places fallback code removed so current Discovery has exactly the three documented intake paths.

Canonical detail: `docs/PROSPECT_FIRST_DESIGN.md`.

### M8.3 — Operator acceptance ← CURRENT BUSINESS GATE

Exercise implemented boundaries with real signed-in roles and real prospect work. This is acceptance, not permission to create generic execution architecture.

Observed design/outreach gap entering this gate:

```text
technical website evidence exists
→ business-first opportunity interpretation happens in ChatGPT
→ but without persisted reviewed state the operator must copy/recreate it for Design and Print
```

That is a real one-source-of-truth/operator-friction problem, not imagined scale.

#### M8.3.1 — Website Opportunity Review v5.1 🟠 implementation / technical acceptance

Objective:

> create one human-reviewed business-first interpretation of current website evidence and reuse it consistently in the prospect dossier, Design and Print without changing audit semantics or adding an Opportunity subsystem.

Target flow:

```text
selected prospect + current audit + actual website
→ Website Opportunity Review via Prompt Library / ChatGPT
→ human review
→ qualification.website_opportunity
→ Websitekansen in existing Overview
→ Design Brief priority + evidence projection
→ same reviewed findings on Printmailing surface
→ existing immutable mailing / Outreach lifecycle
→ response/outcome learning
```

Smallest implementation boundary:

- one canonical `prompts/library/website-opportunity-review.md`;
- one bounded `qualification.website_opportunity` namespace;
- one narrow `operator_set_website_opportunity(...)` RPC;
- no new table or top-level module;
- no mutation of `audits.findings`;
- no score/severity/confidence model;
- no generic AI runtime/importer;
- Design Brief v0.5 adds only reviewed priority + evidence;
- current manual Printmailing surface reuses the same reviewed state;
- real before/after and QR/concept integrity remain human verification gates;
- implementation is reversible by reverting the application change and dropping the single RPC; persisted namespace data may remain inert to preserve history.

Technical acceptance:

```text
[ ] canonical prompt delivered through existing Prompt Library
[ ] narrow RPC validates active member, prospect, source-audit ownership and exact finding contract
[ ] unrelated qualification namespaces preserved
[ ] Websitekansen integrated into existing Overview
[ ] reviewed state projected into Design Brief in stored order
[ ] Printmailing surface reads/copies the same state
[ ] audit evidence remains unchanged
[ ] activity records human review
[ ] regression tests remain green
[ ] PR preview/deploy smoke green
[ ] rollback path documented and verified structurally
```

Commercial acceptance remains separate:

```text
A. van Berkel pilot
→ subsequent real sends
→ operator minutes + corrections
→ viewed/responded/meeting/proposal/win-loss
```

Technical completion does not prove conversion economics.

Canonical detail: `docs/WEBSITE_OPPORTUNITY_REVIEW.md` and ADR `docs/decisions/20260913_WEBSITE_OPPORTUNITY_REVIEW_V51.md`.

### M8.3.2 — Real signed-in operator acceptance

After the v5.1 technical slice is green, exercise the complete normal operator outcome:

```text
find/select prospect
→ review Websitekansen
→ open Design
→ copy design assignment
→ work in clean ChatGPT context
→ upload result
→ inspect/publish
→ create mailing artifact using the same reviewed findings
→ hand off to Outreach
```

Record observed friction. Fix only material root causes.

### M8.4 — Real research/commercial batch

Run at least one complete real batch through:

```text
Prompt Library
→ ChatGPT research
→ CSV
→ Import
→ Discovery Inbox
→ human selection
→ Website Opportunity Review
→ Design
→ mailing
→ response/outcome
```

Measure:

```text
raw candidates
→ valid websites
→ human review minutes
→ promoted
→ opportunity-review minutes/corrections
→ mailed
→ viewed
→ responded
→ meeting
→ proposal
→ win/loss
```

Preserve discovery provenance so research, Overture and manually known URLs can be compared.

## M9 — Qualification calibration

Only after sufficient real outcomes compare existing 0–25 qualification, research signals and full PDOS where valid against reply, meeting, proposal, win and margin/support burden.

Choose one future canonical qualification model only when outcome evidence is material and repeatable. Then migrate and remove superseded competing logic.

## M10 — Evidence-gated automation only

Automation is authorized only for a measured bottleneck.

Possible later boundaries include server-side research or Website Opportunity model calls only when repeated manual invocation is a measured material cost and the output contract is stable.

Until then, manual ChatGPT invocation + narrow validated workflow-specific import remains the canonical smallest solution.

No queues, generalized agents, provider framework, production-site factory, richer orchestration or server-side AI execution merely because they are technically possible.

## Business evidence gates

- **Gate 4 — 30–50 physical-mail offer validation:** measure `raw → valid → promoted → reviewed → mailed → viewed → responded`, meeting rate, cost and human minutes, including discovery-source provenance.
- **Gate 5 — Pricing / first customer:** validate accepted price, sales/delivery effort, corrections, external cost, gross margin and support burden.
- **Gate 6 — 100+ prospect learning:** compare discovery/qualification/opportunity evidence with responses, meetings, proposals, wins and gross margin.
- **Gate 7 — Automate proven bottlenecks:** only observed friction may earn queues, API-based research or other orchestration.

## Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. One application and one operational state plane remain default.
3. GitHub is reusable method/content history; Supabase is business state.
4. Prefer derived views over new state; persist only when multiple real workflow consumers need one current truth.
5. Prefer explicit human decisions over hidden automation until outcomes justify change.
6. Discovery source is provenance, not workflow identity.
7. Sector is a discovery/classification input, not a design method.
8. Design is prospect-first: actual evidence outranks abstract category assumptions.
9. Technical audit evidence and business-priority interpretation are separate concepts and must not overwrite each other.
10. Workflow `QUALIFIED` is not evidence that full qualification was completed.
11. Current qualification is not replaced merely because a richer model exists.
12. Transitional compatibility must shrink after verified cutover.
13. Technical implementation evidence and real operator/commercial evidence are separate gates.
14. No subsystem is added merely because it appears on this roadmap.
15. A milestone is not Done while replaced code, open obsolete work or contradictory current documentation remains.
