# Roadmap

The roadmap is evidence-gated. Code completion is not success; a milestone closes only when the relevant runtime/browser evidence exists.

## Documentation status rule

Current development is governed by:

- `ENGINEERING_CONSTITUTION.md`
- `docs/ARCHITECTURE.md`
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/AUTH_REDIRECTS.md`
- `docs/OPERATIONS.md`
- this roadmap
- the latest accepted ADR for the subject

Historical plans/evidence explain prior decisions but never override current architecture.

## Gate 0 — Documentation baseline ✅

Closed.

## Gate 1 — Offline component spike ✅

Closed with CI safety invariants.

## Gate 2 — Live single-prospect technical test ✅

Closed on 2026-08-25. Overture remains the canonical Phase-1 discovery source and one shared Cloudflare/Supabase operating path is proven. See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

# Integrated operating-model rollout ← CURRENT

Canonical model:

```text
SYSTEM ROLES
ADMIN | KEY_USER | USER

PROSPECT RESPONSIBILITIES
CASE_LEAD | DESIGN | OUTREACH

FINAL HOST SHAPE
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>

CURRENT TEMPORARY PUBLIC ROUTE
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

Domain names are delivery configuration. `prospects.public_slug` remains prospect identity.

## M0 — Architecture contract & truth reconciliation ✅ VERIFIED

Closed.

- one application;
- one Cloudflare Pages project;
- one Supabase operational state plane;
- one stored-artifact LIVE lifecycle;
- membership/role, responsibility and historical activity are separate concepts;
- database truth is bootstrap baseline + ordered migrations;
- current architecture/docs outrank historical implementation plans;
- no parallel CRM/task/analytics platform introduced.

## M1 — Team identity & invite-only access ✅ BROWSER VERIFIED

Implemented and browser-verified on the isolated PR-28 environment:

- stable Auth UUID in `team_members`;
- `display_name` is primary human identity; e-mail is secondary account metadata;
- derived initials avatars; no avatar/profile subsystem;
- `ADMIN / KEY_USER / USER`;
- Admin/Key user invite rules;
- explicit server-validated invite activation origin;
- mandatory first password setup;
- `joined_at` only after activation completion;
- display-name correction;
- deactivate/reactivate lifecycle;
- Admin-only permanent deletion for history-free/test accounts;
- last-Admin, active-assignment and business-history safeguards;
- failed/rate-limited invite does not leave a usable half-account;
- role-dependent Team visibility.

Browser evidence: `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

### Authorization cutover

Stage 1 completed on 2026-08-30:

```text
Operator authorization / RLS
operator_allowlist
      ↓
active team_members by auth.uid()
```

`operator_is_active_team_member()` is now the common membership predicate and `operator_assert_allowed()` uses it. Verified remaining RLS references to `operator_allowlist`: **0**.

`operator_allowlist` remains temporarily only as a compatibility bridge for the pre-merge production frontend bootstrap and two lifecycle sync functions. It is **not** an authorization source anymore. Do not add new consumers.

**Removal condition:** after PR #28 is merged, the new frontend is deployed to production and production auth/data smoke succeeds, remove the legacy browser bootstrap check, lifecycle sync and the compatibility table in one cleanup change.

### Production Auth readiness before operational pilot

The default Supabase SMTP service is bounded test infrastructure, not the production invitation/password-recovery channel.

Before M7:

```text
custom SMTP configured through Supabase Auth
→ sender/domain verified
→ invite delivery tested
→ password recovery tested
→ redirect behavior re-verified
```

Use Supabase's built-in password policy. Enable Leaked Password Protection if the selected Supabase plan supports it; do not build a custom breach checker.

## M2 — Responsibility & actor-aware history ✅ BROWSER VERIFIED

Implemented and browser-verified:

- one primary `CASE_LEAD`, `DESIGN`, `OUTREACH` per prospect;
- guarded assignment/reassignment;
- `events.actor_user_id`;
- material lifecycle/activity events with human display names;
- deactivation blocked while responsibilities remain;
- `Mijn werk` reflects assigned work;
- dossier Activity reflects real actor changes.

No task engine, co-assignee model or capacity planner is introduced.

## M3 — Multi-user information architecture ✅ BROWSER VERIFIED

Top navigation:

```text
Mijn werk
Prospects
Bedrijven zoeken
Team        # Key user/Admin only
```

Prospect dossier:

```text
Overzicht | Design | Outreach | Activiteit
```

Browser-verified:

- role-specific navigation;
- personal work surface derived from assignments;
- contextual opening into Design/Outreach;
- Team work-distribution view;
- responsibility card;
- simple unassigned-work filters;
- prospect filters contained within the prospect-list column;
- narrow/mobile usability.

JS owns filter behavior; CSS owns filter layout. Do not reintroduce inline JS layout constraints.

## M4 — Brand-agnostic public delivery ✅ CURRENT ROUTE DEPLOYMENT VERIFIED

Current rollout:

```text
PUBLIC_PROSPECT_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_PATH_PREFIX=/prospect
```

Final brand cutover:

```text
INTERNAL_ORIGIN=https://cms.<brand>.nl
PUBLIC_PROSPECT_ORIGIN=https://<brand>.nl
PUBLIC_PROSPECT_PATH_PREFIX=
```

Implemented/deployment-verified:

- same Pages project / Supabase / Storage;
- slug → prospect → current LIVE → stored artifact;
- new LIVE publication requires `artifact_path`;
- UUID route hidden from public communication;
- canonical slash redirect preserves attribution query;
- `noindex, nofollow, noarchive`;
- old `/<slug>` on the current CMS host is compatibility redirect only;
- isolated `pr-<number>` Pages deployments;
- PR CMS prospect links deliberately remain on the same PR origin so acceptance tests execute PR code rather than production code;
- deployed smoke verifies the centrally injected `prospect-engagement.js` asset exists on the PR host;
- one representative grandfathered legacy LIVE preview remains under the public slug URL without leaking its historical host.

### Finite legacy LIVE compatibility

Six historical LIVE records predate artifact-only publication. Only the known SolidDesign legacy preview hosts are accepted.

Do not add new legacy hosts. Migrate/retire these records as dossiers are refreshed. When the count reaches zero:

```text
remove legacy proxy path
→ revisit anonymous demos.preview_url access
```

### Remaining final-brand gate

After the brand/domain is selected, prove on the actual public hostname:

- root `/<slug>` delivery;
- nested local assets;
- strict hostname capability boundary;
- CMS/internal routes unavailable on the public hostname.

Do not copy a second resolver to implement this.

## M5 — Prospect engagement MVP 🟡 IMPLEMENTED / PERSISTENCE RE-TEST

Implemented:

- one `prospect_visits` row per measured opening;
- central telemetry injection at public delivery;
- short visible-dwell threshold before registration;
- active visible time;
- maximum scroll;
- broad device class;
- QR/direct source;
- internal/external classification;
- demo snapshot;
- random per-opening update token;
- five-minute signed internal QA token bound to prospect slug;
- no raw IP, IP hash, fingerprint, persistent visitor identity, replay or clickstream;
- no direct anon/authenticated table grants;
- telemetry failure is fail-open for the prospect page.

### Evidence correction — 2026-08-30

Initial browser acceptance appeared successful, but authoritative persistence showed:

```text
EXTERNAL visits = 0
INTERNAL visits = 0
```

and Edge Function logs contained no browser `POST` calls. Root cause: PR-28 prospect links still opened the production public host, so the browser left PR code before telemetry could execute.

This has been corrected: PR previews now keep their public prospect links on the same PR origin, and CI/deployment smoke proves the engagement client asset is deployed.

**Remaining gate:** one post-fix browser test must create a persisted EXTERNAL row and a persisted INTERNAL row, with active-time/scroll updates. Verify database + Edge Function logs, not UI appearance alone.

Evidence: `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

## M6 — Commercial-loop integration 🟡 IMPLEMENTED / ENGAGEMENT RE-TEST

Outreach combines:

```text
mailing
→ public prospect link
→ measured response
→ next action
→ human contact/outcome
```

Implemented UI:

- first/last measured opening;
- external opening count;
- time from the most recent mailing preceding first opening;
- active time;
- max scroll;
- device/source;
- internal/external detail table;
- explicit **Test als medewerker** action.

No automatic lead score or contact-status transition.

**Remaining gate:** after M5 produces real persisted visits, refresh Outreach and confirm the operator can make the intended follow-up decision from the dossier without a separate analytics tool.

## M7 — Integrated operational pilot — NEXT BUSINESS EVIDENCE GATE

Start only after:

- M5/M6 persistence verification is green;
- PR #28 is safely deployed to production;
- compatibility allowlist cleanup is complete;
- production Auth mail delivery uses configured custom SMTP.

Pilot with multiple real operators and approximately 10–20 real prospect mailings. Validate:

- onboarding and role clarity;
- assignments/handover;
- My Work/unassigned work;
- actor/event quality;
- public short-link/QR usability;
- engagement false positives/internal traffic;
- Outreach decision usefulness;
- maintenance burden.

**Exit:** added commercial clarity demonstrably exceeds added operational complexity.

## M8 — Evidence-gated extensions only

Only after M7 evidence may we consider:

- engagement sorting/filtering;
- simple funnel reporting;
- `tel:` / `mailto:` telemetry;
- first-view notifications;
- photo avatars only if initials fail in real use;
- separate public runtime only for proven reliability/security needs;
- per-dossier authorization only for proven confidentiality needs;
- task management only if responsibility + `next_action_at` repeatedly proves insufficient.

# Business evidence gates

These remain separate from the CMS operating-model rollout.

## Gate 3 — Five-prospect operational feasibility

Prove real prospect packs can be produced safely and consistently with measured effort/cost. Automate only repeated observed friction.

## Gate 4 — 30–50 physical-mail offer validation

Measure:

```text
raw → valid → audited → qualified → mailed → viewed → responded
```

Track delivered mail, measured demo visit rate, response rate, meeting rate, cost and human minutes.

## Gate 5 — Pricing / first customer

Validate accepted project price, sales effort, delivery hours, corrections, external costs, gross margin and support burden.

## Gate 6 — 100+ prospect learning

Only at sufficient outcome volume compare qualification/engagement signals with responses, meetings, proposals, wins and gross margin. Only then tune weighting or consider predictive modelling.

## Gate 7 — Automate proven bottlenecks

Do not introduce queues, richer orchestration, agentic workflows or a production-site factory until an observed bottleneck earns them.

# Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. Prefer derived views over new state.
3. Prefer existing platform capabilities over new services.
4. Prefer explicit human actions over hidden automation until evidence justifies automation.
5. Domain names are delivery configuration, not business identity.
6. Auth redirects use the configured/validated internal origin, never localhost fallback or arbitrary caller destinations.
7. Auth mail transport remains a Supabase platform concern; production uses custom SMTP rather than a parallel SolidDesign mailer.
8. Human identity is display-name/UUID based; e-mail is account metadata, not workflow identity.
9. Deactivation preserves history; permanent deletion is only for history-free cleanup accounts.
10. `team_members.active` is the membership authorization truth; the old allowlist may not regain authorization semantics.
11. Transitional compatibility must have an explicit shrink/remove condition.
12. Historical plans/evidence do not override current architecture.
13. Browser appearance is not evidence of persistence; verify authoritative state for stateful features.
14. No future milestone is implemented merely because it appears on this roadmap.
