# Roadmap

SolidDesign is evidence-gated: code completion is not business validation. Technical cutovers close on implementation + verification + cleanup; operator/commercial assumptions close only on real operating evidence.

Current architecture is governed by `ENGINEERING_CONSTITUTION.md`, `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`, `docs/PROSPECT_FIRST_DESIGN.md`, `docs/DISCOVERY.md`, `docs/PROMPT_LIBRARY.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md` and this roadmap. Historical plans/evidence explain decisions but do not override current state.

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

The system is now optimized for real operator use and commercial learning rather than more architecture.

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

### M8.2 — Prospect-first Design cutover ← CURRENT IMPLEMENTATION GATE

Business objective: remove sector/design machinery from the prospect workflow and make Design immediately understandable to a new operator.

Target boundary:

```text
DISCOVERY
sector may help find/classify a business
        ↓
PROSPECT
        ↓
DESIGN
sector no longer participates
```

Required implementation:

- remove top-level `Sectoronderzoek` workspace;
- remove Sector Intelligence research/review/publication API/UI;
- remove manual prospect-sector linking;
- remove `Sector voor design` and separate sector-improvement prompt;
- remove sector lookup from Prospect Design Brief and Design Bootstrap;
- remove unused `prompts/sectors/` overlay hook;
- retain sector input/resolution in Discovery;
- retain `canonical_sector_key` only as legitimate discovery/provenance metadata;
- simplify Design to one primary ChatGPT action: `Kopieer designopdracht`;
- keep project settings behind progressive disclosure;
- keep canonical website version lifecycle (`upload → CONCEPT → inspect → LIVE`);
- keep printmailing artifact creation in Design and physical send in Outreach;
- remove obsolete API/RPC/tests/deploy paths and conflicting current docs;
- close obsolete Sector Intelligence content PRs and supersede stale design PRs that depend on retired sector UX.

Acceptance:

```text
[ ] sector + location discovery still works
[ ] Overture resolution still works
[ ] direct URL prospect works without canonical sector
[ ] Design works without canonical sector
[ ] exactly one primary design ChatGPT action
[ ] Design Brief v0.4 contains no sector lookup
[ ] Bootstrap v0.4 performs no sector lookup
[ ] HTML/ZIP concept upload works
[ ] concept can be published LIVE
[ ] printmailing versioning remains intact
[ ] Outreach still records exact sent artifact
[ ] no active /api/sector-intelligence path remains
[ ] obsolete sector linking RPCs dropped in production
[ ] CI/deploy smoke enforce the new boundary
[ ] current docs contain one coherent truth
```

Canonical detail: `docs/PROSPECT_FIRST_DESIGN.md`.

### M8.3 — Operator acceptance

Exercise implemented boundaries with real signed-in roles and real prospect work. This is acceptance, not a new subsystem milestone.

### M8.4 — Real research/commercial batch

Run at least one complete real batch through:

```text
Prompt Library
→ ChatGPT research
→ CSV
→ Import
→ Discovery Inbox
→ human selection
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

Possible later boundary:

```text
CMS
→ server-side AI research
→ structured result
→ same candidate intake
```

Until then, manual ChatGPT invocation + validated CSV import is the canonical smallest solution.

No queues, generalized agents, production-site factory, richer orchestration or server-side AI execution merely because they are technically possible.

## Business evidence gates

- **Gate 4 — 30–50 physical-mail offer validation:** measure `raw → valid → promoted → mailed → viewed → responded`, meeting rate, cost and human minutes, including discovery-source provenance.
- **Gate 5 — Pricing / first customer:** validate accepted price, sales/delivery effort, corrections, external cost, gross margin and support burden.
- **Gate 6 — 100+ prospect learning:** compare discovery/qualification evidence with responses, meetings, proposals, wins and gross margin.
- **Gate 7 — Automate proven bottlenecks:** only observed friction may earn queues, API-based research or other orchestration.

## Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. One application and one operational state plane remain default.
3. GitHub is reusable method/content history; Supabase is business state.
4. Prefer derived views over new state.
5. Prefer explicit human decisions over hidden automation until outcomes justify change.
6. Discovery source is provenance, not workflow identity.
7. Sector is a discovery/classification input, not a design method.
8. Design is prospect-first: actual evidence outranks abstract category assumptions.
9. Workflow `QUALIFIED` is not evidence that full qualification was completed.
10. Current qualification is not replaced merely because a richer model exists.
11. Transitional compatibility must shrink after verified cutover.
12. Technical implementation evidence and real operator/commercial evidence are separate gates.
13. No subsystem is added merely because it appears on this roadmap.
14. A milestone is not Done while replaced code, open obsolete work or contradictory current documentation remains.
