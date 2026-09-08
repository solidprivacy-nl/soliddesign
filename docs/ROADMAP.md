# Roadmap

SolidDesign is evidence-gated: code completion is not success; runtime/business evidence closes a milestone.

Current architecture is governed by `ENGINEERING_CONSTITUTION.md`, `docs/ARCHITECTURE.md`, `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, this roadmap and the latest accepted ADR for the subject. Historical plans/evidence explain decisions but do not override current state.

## Technical foundation

- **Gate 0 — Documentation baseline:** ✅ closed.
- **Gate 1 — Offline component spike:** ✅ closed with CI safety invariants.
- **Gate 2 — Live single-prospect technical test:** ✅ closed on 2026-08-25. Overture proved a viable discovery source; it is no longer defined as the only canonical discovery path.
- **Gate 3 — Five-prospect operational feasibility:** ✅ technical pipeline passed. The current system can repeatedly produce safe prospect concepts without additional execution architecture.

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

The CMS remains one application/workspace. Current target navigation after the M7 operator-efficiency cutover is:

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

# M7 — Operator efficiency + commercial-learning cutover ← ACTIVE

M7 must improve the real operator path without changing SolidDesign into an orchestration platform.

The two related problems are:

1. reusable ChatGPT method is duplicated across operator workflows;
2. prospect discovery needs richer evidence without replacing the proven Overture/URL paths or creating another candidate workflow.

The implementation is intentionally three coherent cutovers rather than many speculative subprojects.

## Cutover A — Prompt Library

### Build

```text
GitHub prompts/library/
→ authenticated Prompt Library metadata API
→ one invocation renderer
→ CMS Prompts page
```

Rules:

- GitHub is canonical for prompt body/history;
- no prompt table/version table in Supabase;
- User/Key User see metadata/invocation fields, not body through CMS APIs;
- Admin may read/create/update/delete operator prompts;
- server derives path from validated slug and can write only `prompts/library/`;
- existing system design prompts remain engineering-governed;
- static Cloudflare Markdown URLs remain the ChatGPT consumption boundary;
- current URL model does not claim strict prompt secrecy.

Initial authoritative entries:

- `prospect-research`;
- `website-design` wrapper delegating to the existing canonical Bootstrap.

Do not invent Logo/Flyer methodology merely to populate the library; add those through Admin when their authoritative prompt bodies are adopted.

### Exit evidence

```text
[ ] USER can list/fill/copy a prompt invocation
[ ] KEY_USER can list/fill/copy a prompt invocation
[ ] USER/KEY_USER body request is server-rejected
[ ] ADMIN can read/create/update/delete operator prompt
[ ] Admin write cannot escape prompts/library/
[ ] stale SHA update/delete is rejected
[ ] static deployed prompt URL is readable
[ ] no prompt content exists in Supabase
```

## Cutover B — Research Discovery

### Build

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
→ canonical CSV contract
→ validated import
→ discovery run IMPORT
→ discovery_source=research
→ qualification.research
→ existing deterministic triage
→ same Inbox
```

One machine-readable contract serves producer and importer:

```text
prompts/contracts/prospect-research-import-v1.json
```

CSV is transport, not domain architecture.

Rules:

- no provider framework;
- no candidate/research-results table;
- existing website-key dedupe remains authoritative;
- research and deterministic triage are separate evidence namespaces;
- all qualification writers must preserve unrelated namespaces;
- human promotion remains mandatory;
- current five-factor 0–25 commercial qualification remains canonical during the pilot;
- PDOS remains experimental/calibration evidence.

### Exit evidence

```text
[ ] real research CSV imports without manual SQL
[ ] malformed/contract-mismatched CSV fails clearly
[ ] duplicate website is not duplicated
[ ] research provenance/evidence persists
[ ] deterministic triage runs on imported candidates
[ ] triage does not erase research
[ ] subsequent qualification does not erase research
[ ] research evidence is usable in the one Discovery Inbox
[ ] Overture still works
[ ] direct URL still works
[ ] missing full qualification displays “Nog niet uitgevoerd”
```

## Cutover C — Truth reconciliation + production proof

This cutover closes implementation rather than adding features.

### Code cleanup

Search/remove any superseded current paths within this scope:

- obsolete Overture-as-only-canonical assumptions;
- old unused Discovery-triage loading gaps;
- duplicate research CSV contracts;
- prompt strings superseded by an adopted Prompt Library entry;
- stale references to deleted discovery documentation;
- dead imports/CSS/DOM from this change.

Do not delete unrelated existing workflows merely to make the diff look cleaner.

### Documentation cleanup

Canonical discovery becomes:

```text
docs/DISCOVERY.md
```

`docs/DISCOVERY_OVERTURE.md` owns only Overture-source mechanics.

The old standalone `docs/DISCOVERY_TRIAGE.md` is merged into `DISCOVERY.md` and removed.

Prompt architecture is canonical in:

```text
docs/PROMPT_LIBRARY.md
```

Integrated architecture, security/operations and scoring documentation must match final runtime state.

### Production proof

Done requires:

```text
[ ] unit/static/regression suite green
[ ] PR Pages preview smoke green
[ ] database migration applied and verified
[ ] production merge/deploy green
[ ] production prompt resources smoke-tested
[ ] role boundary tested
[ ] one real research batch completes:
    Prompt Library → ChatGPT → CSV → Import → Inbox
[ ] Overture regression verified
[ ] URL regression verified
[ ] no stale superseded docs/code knowingly remain
```

---

# M8 — Integrated operational/commercial pilot

After M7 production proof, run the system with real operators and real acquisition batches.

Auth readiness that still applies before routine multi-user production use:

```text
custom SMTP through Supabase Auth
→ sender/domain verified
→ invite delivery tested
→ password recovery tested
→ practical built-in password policy confirmed
→ Leaked Password Protection enabled if supported by selected plan
```

Pilot with multiple real operators and approximately 10–20 real mailings initially, then expand into Gate 4 volume.

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

For discovery, preserve source provenance so the pilot can compare:

```text
research
vs Overture
vs manually known URL
```

The objective is qualified/commercial yield per real operator effort, not selecting a preferred technology in advance.

**Exit:** commercial/operational clarity demonstrably exceeds added complexity.

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
7. CSV is current transport; the validated candidate boundary is the durable domain contract.
8. Workflow `QUALIFIED` is not evidence that full qualification was completed.
9. Current qualification is not replaced merely because a richer model exists.
10. Transitional compatibility must shrink after verified cutover.
11. Browser appearance is not persistence/authorization evidence; verify authoritative state.
12. No subsystem is added merely because it appears on this roadmap.
13. A milestone is not Done while replaced code or contradictory documentation remains current in the repository.
