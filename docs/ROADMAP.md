# Roadmap

SolidDesign is evidence-gated: code completion is not business validation. Technical cutovers close on implementation + verification + cleanup; operator/commercial assumptions close only on real operating evidence.

Current architecture is governed by `ENGINEERING_CONSTITUTION.md`, `docs/ARCHITECTURE.md`, `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, this roadmap and the latest accepted ADR for the subject. Historical plans/evidence explain decisions but do not override current state.

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

PREFERRED FINAL HOST SHAPE
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>
```

### M0 — Architecture & truth reconciliation ✅

One application, one Cloudflare Pages project, one Supabase state plane and one stored-artifact LIVE lifecycle. Membership, responsibility and history are separate concepts.

### M1 — Team identity & invite-only access ✅ browser verified

Stable Auth UUID + `team_members.display_name`, `ADMIN / KEY_USER / USER`, guarded invites/activation, deactivate/reactivate and safe deletion rules are live.

Authorization truth remains:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` is retired.

### M2 — Responsibility & actor-aware history ✅ browser verified

One primary `CASE_LEAD`, `DESIGN` and `OUTREACH` per prospect; guarded reassignment; actor-aware events; `Mijn werk` derived from assignments. No task engine/capacity planner.

### M3 — Multi-user information architecture ✅ core browser verified

Current navigation:

```text
Mijn werk | Prospects | Bedrijven zoeken | Prompts | Sectoronderzoek | Team
```

Prospect dossier:

```text
Overzicht | Design | Outreach | Activiteit
```

### M4 — Brand-agnostic public delivery ✅ production deployed

Slug → prospect → current LIVE → stored artifact, noindex public delivery, PR-preview fidelity and bounded historical compatibility remain current.

Six grandfathered historical LIVE records remain finite transition debt. Do not add legacy hosts; remove compatibility when the count reaches zero.

### M5 — Prospect engagement MVP ✅ browser + persistence verified

External/internal openings, active time and scroll depth are persisted without raw IP, fingerprinting, visitor identity or replay. Telemetry failure never blocks the public prospect page.

### M6 — Commercial-loop integration ✅ browser verified

```text
Design
→ immutable printmailing version

Outreach
→ exact artifact + LIVE concept at send time
→ physical mailing
→ measured public response
→ human next action/outcome
```

No analytics/document-management subsystem was introduced.

### Sector Intelligence v0.5 ✅ integrated supporting capability

Sector Intelligence remains advisory design evidence linked through one primary `canonical_sector_key`. Repository mechanics remain hidden from normal operator workflow.

---

# M7 — Operator efficiency + research-discovery cutover ✅ production complete 2026-09-08

M7 improved the real operator path without turning SolidDesign into an orchestration platform.

## A. Prompt Library ✅

Implemented production boundary:

```text
GitHub prompts/library/
→ authenticated metadata/body API
→ one invocation renderer
→ CMS Prompts page
```

Current rules:

- GitHub is canonical for operator prompt body/history;
- no prompt/version table exists in Supabase;
- User/Key User receive metadata + invocation fields, not prompt body through the management API;
- Admin may read/create/update/delete operator prompts;
- write paths are derived from a validated slug and confined to `prompts/library/`;
- update/delete uses current GitHub content SHA;
- PR previews are read-only for Prompt Library repository writes;
- system design prompts remain engineering-governed outside this CMS mutation boundary;
- static Cloudflare Markdown URLs are the current ChatGPT consumption boundary;
- URL invocation deliberately does not claim cryptographic prompt secrecy.

Initial adopted entries:

- `prospect-research`;
- `website-design`, delegating to the existing canonical design Bootstrap rather than duplicating it.

No Prompt Manager role, prompt DB, form builder, usage analytics, approval engine or second version model was introduced.

## B. Research Discovery ✅

Exactly three current intake paths remain:

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
→ Prompt Library prospect-research invocation
→ ChatGPT research
→ prospect-research-import-v1 CSV contract
→ validated import
→ discovery run IMPORT
→ discovery_source=research
→ qualification.research
→ deterministic qualification.triage
→ same Discovery Inbox
→ explicit human promote / reject
```

Production invariants:

- CSV is transport, not domain architecture;
- `prompts/contracts/prospect-research-import-v1.json` is the one producer/consumer contract;
- website-key dedupe remains authoritative;
- research imported for an already-known website enriches that existing record instead of creating a duplicate or discarding the research;
- original discovery provenance remains intact during enrichment;
- research-run ID is retained inside `qualification.research`;
- `qualification.research`, `qualification.triage` and full qualification are merge-safe namespaces;
- a hard deterministic website failure outranks research priority;
- research/Overture/URL never auto-promote a prospect;
- current five-factor 0–25 commercial qualification remains canonical during the pilot;
- missing full qualification displays `Nog niet uitgevoerd`;
- PDOS/WES/RDS/CPF remain experimental/calibration evidence, not parallel permanent production scoring.

No provider framework, candidate/research-results table, crawler/agent, job queue or server-side AI execution was introduced.

## C. Truth reconciliation + production proof ✅

Current truth was consolidated rather than layered:

- `docs/DISCOVERY.md` is canonical end-to-end discovery documentation;
- `docs/DISCOVERY_OVERTURE.md` contains only Overture-source mechanics;
- old `docs/DISCOVERY_TRIAGE.md` was merged into `DISCOVERY.md` and removed;
- `docs/PROMPT_LIBRARY.md` is canonical Prompt Library documentation;
- architecture, security, operations, scoring and Operator docs match the runtime;
- duplicate triage loading was removed;
- CI rejects resurrection of the deleted discovery doc and guards the new prompt/research invariants.

Verified technical evidence on 2026-09-08:

```text
PR #48 exact head f834ec114abe74d55ef15aeda9c7871dc8016b5f
→ 70 unit tests green
→ golden/artifact safety green
→ JS/static safety green
→ Pages Functions build green
→ Impeccable deterministic design gate green
→ isolated PR Pages deployment green
→ deployed prompt + research-contract smoke green
→ PR-preview Prompt Library mutation rejection green

Supabase
→ discovery_runs accepts AREA | URL | IMPORT
→ research_discovery_import_v01 applied/read back
→ research_discovery_evidence_merge_v02 applied/read back
→ transactional duplicate-domain merge test passed and rolled back
→ existing source, triage and full qualification preserved while research was added

main
→ squash merge 265a147c479a1389a658ff2e73e7e760f703c92c
→ main CI green
→ production Pages deployment green
→ production runtime smoke green
→ legacy preview alias deployment green
```

M7 is therefore technically complete. Role-by-role authenticated browser acceptance and a real operator research batch are operating evidence, not reasons to add more architecture; they move into M8.

---

# M8 — Integrated operational/commercial pilot ← ACTIVE

Run the production system with real operators and real acquisition batches. The objective is to validate operator effort and qualified/commercial yield, not to validate whether the code can deploy.

## Operator acceptance

Exercise the already-implemented boundaries with real signed-in roles:

```text
USER
→ list/fill/copy Prompt Library invocation
→ no management body access

KEY_USER
→ same invocation path
→ no management body access

ADMIN
→ read/create/update/delete operator prompt
→ stale SHA conflict behaves correctly
→ cannot escape prompts/library/
```

This is acceptance of the implemented authorization model, not a new feature milestone.

## Real research batch

Run at least one complete real batch through the normal UI:

```text
Prompt Library
→ ChatGPT research
→ CSV
→ Import
→ Discovery Inbox
→ deterministic triage
→ human decision
```

Confirm in normal operator use:

- malformed contract is rejected clearly;
- existing-domain enrichment is understandable to the operator;
- research evidence remains visible after deterministic triage;
- Overture and direct URL paths remain practical alternatives;
- no manual SQL is needed.

## Auth readiness

Before routine multi-user production use:

```text
custom SMTP through Supabase Auth
→ sender/domain verified
→ invite delivery tested
→ password recovery tested
→ practical built-in password policy confirmed
→ Leaked Password Protection enabled if supported by selected plan
```

## Commercial pilot

Start with approximately 10–20 real mailings, then expand into Gate 4 volume.

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

Preserve discovery provenance so the pilot can compare:

```text
research
vs Overture
vs manually known URL
```

Success criterion: qualified/commercial yield per real operator effort improves enough to justify the added research step.

---

# M9 — Qualification calibration

Only after sufficient real outcomes compare:

```text
existing 0–25 qualification
research priority/signals
full PDOS where valid
```

against:

- reply;
- positive reply;
- meeting;
- proposal;
- win;
- gross margin/support burden where known.

Choose a future canonical qualification model only when evidence is material/repeatable. Then migrate and remove superseded competing logic.

Do not normalize permanent multi-score architecture by default.

# M10 — Evidence-gated automation only

Automation is authorized only for a measured bottleneck.

Possible later boundary:

```text
CMS
→ server-side AI research
→ structured result
→ same candidate intake
```

Potential justifications:

- clipboard/CSV handoff becomes a dominant source of operator time/errors;
- research volume materially increases;
- strict prompt secrecy becomes a real requirement;
- structured automated research demonstrably reduces cost/error without weakening evidence quality.

Until then, manual ChatGPT invocation + validated CSV import is the canonical smallest solution.

No queues, generalized agents, production-site factory, richer orchestration or server-side AI execution merely because they are technically possible.

---

# Business evidence gates

- **Gate 4 — 30–50 physical-mail offer validation:** measure `raw → valid → promoted → mailed → viewed → responded`, meeting rate, cost and human minutes, including discovery-source provenance.
- **Gate 5 — Pricing / first customer:** validate accepted price, sales/delivery effort, corrections, external cost, gross margin and support burden.
- **Gate 6 — 100+ prospect learning:** compare discovery/qualification evidence with responses, meetings, proposals, wins and gross margin.
- **Gate 7 — Automate proven bottlenecks:** only observed friction may earn queues, API-based research or other orchestration.

# Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. One application and one operational state plane remain default.
3. GitHub is reusable method/content history; Supabase is business state.
4. Prefer derived views over new state.
5. Prefer explicit human decisions over hidden automation until outcomes justify change.
6. Discovery source is provenance, not workflow identity.
7. CSV is transport; the validated candidate boundary is the durable domain contract.
8. Workflow `QUALIFIED` is not evidence that full qualification was completed.
9. Current qualification is not replaced merely because a richer model exists.
10. Transitional compatibility must shrink after verified cutover.
11. Browser appearance is not persistence/authorization evidence; verify authoritative state.
12. Technical implementation evidence and real operator/commercial evidence are separate gates.
13. No subsystem is added merely because it appears on this roadmap.
14. A milestone is not Done while replaced code or contradictory documentation remains current in the repository.
