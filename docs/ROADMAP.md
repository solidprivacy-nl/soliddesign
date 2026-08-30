# Roadmap

SolidDesign is evidence-gated: code completion is not success; runtime/business evidence closes a milestone.

Current architecture is governed by `ENGINEERING_CONSTITUTION.md`, `docs/ARCHITECTURE.md`, `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, this roadmap and the latest accepted ADR for the subject. Historical plans/evidence explain decisions but do not override current state.

## Technical foundation

- **Gate 0 — Documentation baseline:** ✅ closed.
- **Gate 1 — Offline component spike:** ✅ closed with CI safety invariants.
- **Gate 2 — Live single-prospect technical test:** ✅ closed on 2026-08-25. Overture remains the canonical Phase-1 discovery source.

## Integrated operating model — ✅ PRODUCTION CUTOVER COMPLETE

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

Domain names are delivery configuration; `prospects.public_slug` is prospect identity.

### M0 — Architecture & truth reconciliation ✅

One application, one Cloudflare Pages project, one Supabase state plane and one stored-artifact LIVE lifecycle. Membership, responsibility and history are separate concepts. No parallel CRM/task/analytics platform was introduced.

### M1 — Team identity & invite-only access ✅ browser verified

- stable Auth UUID + `team_members.display_name`;
- `ADMIN / KEY_USER / USER`;
- invite → activation → mandatory first password → joined member;
- Admin/Key-user governance rules;
- deactivate/reactivate;
- guarded permanent deletion only for history-free/test accounts;
- last-Admin, active-assignment and business-history safeguards;
- role-dependent Team visibility.

Authorization truth is now only:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` was retired on 2026-08-30 by `20260830_operator_allowlist_retirement_v01.sql`. Verified post-cutover state: table absent, RLS references `0`, function references `0`.

### M2 — Responsibility & actor-aware history ✅ browser verified

One primary `CASE_LEAD`, `DESIGN` and `OUTREACH` per prospect; guarded reassignment; `events.actor_user_id`; human-readable Activity; `Mijn werk` derived from assignments. No task engine/co-assignee/capacity planner.

### M3 — Multi-user information architecture ✅ browser verified

```text
Mijn werk | Prospects | Bedrijven zoeken | Team
Overzicht | Design | Outreach | Activiteit
```

Role-specific navigation, contextual work opening, work-distribution filters and narrow/mobile behavior are browser-verified.

### M4 — Brand-agnostic public delivery ✅ production deployed

- slug → prospect → current LIVE → stored artifact;
- new LIVE publication requires `artifact_path`;
- public communication hides UUID routes;
- canonical redirects preserve attribution queries;
- `noindex, nofollow, noarchive`;
- PR previews stay on their own origin;
- deployment workflow smoke-tests the actual deployed CMS, membership bootstrap, public resolver, telemetry asset, CORS and bounded legacy compatibility.

Six grandfathered historical LIVE records remain behind a finite known-host compatibility path. Do not add legacy hosts. Remove that path when the count reaches zero.

Final brand/domain cutover is separate: prove root `/<slug>`, nested assets and strict public-host capability boundaries on the selected hostname without copying a second resolver.

### M5 — Prospect engagement MVP ✅ browser + persistence verified

Authoritative 2026-08-30 acceptance evidence:

```text
EXTERNAL openings = 3
active time total = 32 s
max scroll = 78%

INTERNAL openings = 1
active time total = 9 s
max scroll = 95%
```

Successful browser start/update POSTs were observed in Supabase Edge Function logs. Staff-test traffic remains separate from external prospect response. No raw IP, IP hash, fingerprint, persistent visitor identity, replay or clickstream is stored.

Evidence: `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

### M6 — Commercial-loop integration ✅ browser verified

Outreach combines mailing → prospect link → measured response → human next action/contact. First/last opening, count, mailing latency, active time, scroll, device/source and internal/external details are available without an analytics subsystem. Engagement never automatically changes contact status or creates a lead score.

### Production cutover evidence — 2026-08-30 ✅

- accepted release candidate passed PR CI/Pages smoke;
- release PR #29 merged to `main` as `4493ec443d9b3b928914dc3d45bc0c0d06038c97`;
- production CI #417 passed;
- production Pages deploy #133 passed on that exact SHA;
- `operator_allowlist` retirement migration applied successfully;
- table absent;
- database allowlist references = `0`;
- three active joined team members remained intact (Admin / Key user / User).

## M7 — Integrated operational pilot ← NEXT BUSINESS GATE

Before sending the pilot into routine production use, finish platform Auth readiness:

```text
custom SMTP through Supabase Auth
→ sender/domain verified
→ invite delivery tested
→ password recovery tested
→ practical built-in password policy confirmed
→ Leaked Password Protection enabled if the selected plan supports it
```

Then pilot with multiple real operators and approximately 10–20 real prospect mailings. Validate onboarding/role clarity, handover, My Work, actor history, public-link/QR usability, engagement false positives/internal traffic, Outreach usefulness and maintenance burden.

**Exit:** commercial/operational clarity must demonstrably exceed added complexity.

## M8 — Evidence-gated extensions only

Only after M7 evidence may we consider simple funnel reporting, engagement sorting, `tel:`/`mailto:` telemetry, first-view notifications, photo avatars, separate public runtime, per-dossier authorization or task management. Each requires an observed problem; roadmap presence is not authorization to build it.

# Business evidence gates

- **Gate 3 — Five-prospect operational feasibility:** prove real prospect packs can be produced safely and consistently with measured effort/cost.
- **Gate 4 — 30–50 physical-mail offer validation:** measure `raw → valid → audited → qualified → mailed → viewed → responded`, response/meeting rates, cost and human minutes.
- **Gate 5 — Pricing / first customer:** validate accepted price, sales/delivery effort, corrections, external cost, gross margin and support burden.
- **Gate 6 — 100+ prospect learning:** only at sufficient outcome volume compare qualification/engagement with responses, meetings, proposals, wins and gross margin.
- **Gate 7 — Automate proven bottlenecks:** no queues, richer orchestration, agentic workflows or production-site factory until observed friction earns them.

## Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. Prefer derived views over new state and proven platform capability over new services.
3. Prefer explicit human actions over hidden automation until evidence justifies automation.
4. Domain names are delivery configuration, not business identity.
5. Auth redirects use validated internal origins; Auth mail transport remains a Supabase platform concern.
6. Human workflow identity is Auth UUID + display name; e-mail is account metadata.
7. Deactivation preserves history; permanent deletion is only for history-free cleanup accounts.
8. Active `team_members` is the sole durable membership-authorization truth.
9. Transitional compatibility must shrink and have an explicit removal condition.
10. Browser appearance is not persistence evidence; verify authoritative state for stateful features.
11. No subsystem is added merely because it appears on this roadmap.
