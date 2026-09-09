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

### M8.2 — Prospect-first Design cutover ✅ production complete 2026-09-09

Business objective achieved: Design is now immediately understandable as prospect-specific work and no longer carries a reusable sector-research/linking subsystem.

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
- Prospect Design Brief v0.4 and Bootstrap v0.4 contain no sector lookup;
- unused `prompts/sectors/` overlay hook removed;
- sector input/resolution retained in Discovery;
- `canonical_sector_key` retained only as legitimate discovery/provenance metadata;
- Design reduced to one primary ChatGPT action: `Kopieer designopdracht`;
- clean two-URL ChatGPT handoff resolves the design method from the supplied `SOLIDDESIGN_ORIGIN` and requires no repository/provider discovery;
- project settings remain behind progressive disclosure;
- website version lifecycle remains `upload → CONCEPT → inspect → LIVE`;
- printmailing artifact creation remains in Design and physical send remains in Outreach;
- obsolete sector API/RPC/tests/deploy paths and conflicting current docs removed;
- unused Google Places fallback code removed so current Discovery has exactly the three documented intake paths;
- obsolete Sector Intelligence PRs #20, #21, #39 and stale sector-dependent Design PR #44 closed/superseded.

Production evidence:

```text
PR #50 merged (squash)
merge SHA: 73ff1ad8cb5122a242c60ca01f98bdb5798ff61d
CI #566 / run 34317993838: SUCCESS
Deploy Operator #223 / run 34317993847: SUCCESS
Supabase migration: 20260909061328 retire_sector_linking_v01
RPC readback:
  operator_list_sector_link_targets() = absent
  operator_set_prospect_sector(uuid,text) = absent
canonical_sector_key column = retained
```

Acceptance:

```text
[x] sector + location discovery regression boundary remains intact
[x] Overture resolution regression boundary remains intact
[x] direct URL flow has no canonical-sector requirement
[x] Design works without canonical sector
[x] exactly one primary Design ChatGPT action
[x] Design Brief v0.4 contains no sector lookup
[x] Bootstrap v0.4 performs no sector lookup
[x] clean ChatGPT handoff is origin-relative and provider-neutral
[x] HTML/ZIP concept lifecycle regression remains intact
[x] LIVE publication regression remains intact
[x] printmailing versioning regression remains intact
[x] Outreach exact-artifact send boundary remains intact
[x] no active /api/sector-intelligence path remains
[x] obsolete sector-linking RPCs dropped and read back in production
[x] CI/deploy smoke enforce the new boundary
[x] current docs/runtime represent one coherent truth
```

Canonical detail: `docs/PROSPECT_FIRST_DESIGN.md`.

### M8.3 — Operator acceptance ← NEXT BUSINESS GATE

Exercise implemented boundaries with real signed-in roles and real prospect work. This is acceptance, not a new subsystem milestone.

Focus on the actual operator outcome:

```text
find/select prospect
→ open Design
→ copy design assignment
→ work in clean ChatGPT context
→ upload result
→ inspect/publish
→ create mailing artifact
→ hand off to Outreach
```

Do not add architecture to prepare for this gate. Record observed friction and fix only material root causes.

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
