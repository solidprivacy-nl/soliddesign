# Roadmap

The roadmap is evidence-gated. Completing code is not success; closing the relevant learning/verification gate is success.

## Gate 0 — Documentation baseline ✅

Closed.

## Gate 1 — Offline component spike ✅

Closed with CI safety invariants.

## Gate 2 — Live single-prospect technical test ✅

Closed on 2026-08-25. Overture remains the canonical Phase-1 discovery source and one shared Cloudflare/Supabase operating path is proven. See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

# Integrated operating-model rollout — verification & pilot preparation ← CURRENT

SolidDesign now has the implemented foundation for a small multi-user commercial work system while preserving one application, one operational state plane, explicit human control and minimal moving parts.

Canonical design:

- `docs/ARCHITECTURE.md`
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`

Status rule used below:

- **Implemented** means the required code/schema/UI exists on the integration branch and backwards-compatible database/server changes are applied where necessary.
- **Deployment verified** means the relevant real Cloudflare/Supabase request path has passed the automated deployed smoke.
- **Browser verified** requires the real authenticated/user interaction that cannot be proven by static code or anonymous HTTP alone.
- Historical evidence or completed plans never override these current statuses.

## M0 — Architecture contract & truth reconciliation ✅ VERIFIED

Frozen contracts:

```text
SYSTEM ROLES
ADMIN | KEY_USER | USER

RESPONSIBILITIES
CASE_LEAD | DESIGN | OUTREACH

FINAL HOST SHAPE
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>

TEMPORARY PUBLIC ROUTE
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

Architecture, security, public-link, database-evolution and Operator documentation now point to one operating model. Domain names are delivery configuration; `public_slug` remains prospect identity.

Documentation precedence is explicit in `docs/ARCHITECTURE.md`. Completed Gate-1/2 plans and evidence are marked historical so they cannot silently become competing runtime architecture.

## M1 — Team identity & invite-only access 🟡 IMPLEMENTED / BROWSER VERIFY

Implemented:

- `team_members` with stable Supabase Auth UUID;
- current operators backfilled without access loss;
- `ADMIN / KEY_USER / USER`;
- server-side Auth invite flow;
- Admin can invite User/Key user;
- Key user can invite User only;
- mandatory first password setup flow;
- invited user is not considered joined before the activation flow finishes;
- deactivate/reactivate lifecycle;
- last-Admin and active-assignment safeguards;
- self-signup hidden in the normal UI;
- browser CORS/preflight support on the invite function.

### Remaining M1 verification/debt

`operator_allowlist` still gates a finite set of older Operator RLS/functions. It is transitional compatibility only; do not add new semantics to it.

**Browser verification gate:**

1. invite one controlled test colleague through Team;
2. finish first-login/password activation;
3. verify normal access and role-specific Team visibility;
4. verify a Key user can invite User but not elevate roles;
5. deactivate/reactivate without SQL/admin-console intervention;
6. verify active assignments block unsafe deactivation.

**After this browser gate passes:** perform one explicit access cutover from the remaining `operator_allowlist`-based RLS/function/browser checks to active `team_members`, then remove the compatibility model. Do not dual-maintain both indefinitely.

**Password hardening before pilot:** use Supabase's built-in password policy. Minimum length must be at least 8; use stronger practical requirements for the small internal team. If the project plan supports it, enable Supabase Leaked Password Protection rather than building a custom breach checker. The current Supabase advisor reports this protection as disabled; Supabase documents it as a Pro-plan-or-above feature.

## M2 — Responsibility & actor-aware history 🟡 IMPLEMENTED / BROWSER VERIFY

Implemented:

- `prospect_assignments`;
- one primary `CASE_LEAD`, `DESIGN`, `OUTREACH` per prospect;
- guarded assignment changes;
- `events.actor_user_id`;
- actor-aware material history;
- assignment/lifecycle events;
- deactivation blocked until active responsibilities are released/reassigned.

**Verification gate:** browser assignment changes with two real roles/users and confirm current responsibility plus Activity attribution.

## M3 — Multi-user information architecture 🟡 IMPLEMENTED / BROWSER VERIFY

Top-level navigation:

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

Implemented:

- `Mijn werk` as default personal work surface derived from assignments;
- context opening into Design/Outreach where responsibility is unambiguous;
- Team membership/work-distribution view;
- per-prospect responsibility card;
- shared Prospect filters for `Mijn werk`, missing dossierholder, missing Design and missing Outreach;
- existing lightweight frontend retained; no framework migration.

**Verification gate:** role-by-role browser walkthrough and mobile/narrow-layout check.

## M4 — Brand-agnostic public delivery 🟢 CURRENT ROUTE DEPLOYMENT VERIFIED / CUSTOM DOMAIN PENDING

Temporary configuration:

```text
PUBLIC_PROSPECT_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_PATH_PREFIX=/prospect
```

Final configuration after brand selection:

```text
PUBLIC_PROSPECT_ORIGIN=https://<brand>.nl
PUBLIC_PROSPECT_PATH_PREFIX=
INTERNAL_ORIGIN=https://cms.<brand>.nl
```

Implemented:

- same Pages project / same Supabase / same Storage;
- public route resolves slug → prospect → current LIVE demo → canonical stored artifact;
- new LIVE publication requires `artifact_path` in UI and database;
- public URL keeps the slug and hides the UUID route;
- nested asset requests are mapped through the same public namespace;
- trailing-slash canonicalization preserves query attribution;
- public/internal origins are configuration;
- old one-segment `/<slug>` links on the current Pages host are alias redirects to the canonical `/prospect/<slug>/` resolver only;
- pull requests deploy to an isolated `pr-<number>` Pages preview branch in the same project; production deploys only from `main`.

Deployment smoke now proves on the real Pages/Supabase path:

- CMS root responds;
- invalid public slug returns 404;
- canonical slash redirect preserves `?src=qr`;
- public responses carry `noindex, nofollow, noarchive`;
- a canonical stored-artifact prospect page renders and receives central telemetry injection;
- old root alias cannot redirect to `/p/<uuid>` or a technical preview host;
- one representative grandfathered legacy LIVE page renders under the public prospect URL without leaking its historical host.

### Finite legacy compatibility

Six current LIVE records predate artifact-only publication. The compatibility path accepts only the known historical SolidDesign preview hosts. The shortened old `gate3-v1.soliddesign-cms.pages.dev` alias is normalized to its original legacy host to avoid recursive calls into the current application.

Do not add new legacy hosts. Migrate/retire these six records naturally as the dossiers are refreshed or before the compatibility path becomes unnecessary; when the count reaches zero, remove the proxy code and revisit whether anonymous `demos.preview_url` column access can also be removed.

**Remaining M4 gate before final brand cutover:** prove the actual custom hostname root `/<slug>` plus nested local assets and strict hostname capability boundary (`/start-design`, `/brief`, `/p`, CMS/API unavailable on public brand host). Do not implement that final route by copying a second resolver.

## M5 — Prospect engagement MVP 🟡 IMPLEMENTED / BROWSER VERIFY

Implemented:

- one `prospect_visits` row per measured opening;
- central telemetry injection at public delivery, not inside uploaded mock-ups;
- visible opening after a short dwell threshold;
- active visible time;
- maximum scroll;
- broad device class;
- QR/direct source;
- internal/external classification;
- demo snapshot;
- no direct client grants on `prospect_visits`;
- no raw IP, IP hash, fingerprint or persistent visitor identity;
- public update capability uses a random per-opening token;
- Edge Function has browser CORS/preflight handling;
- telemetry failure never blocks the prospect artifact.

Internal QA uses a five-minute server-signed token bound to the prospect slug. A guessable `?internal=1` marker and IP allowlists are not used.

Deployment smoke has proven browser preflight/CORS for both `prospect-engagement` and `team-invite` from the Pages preview origin.

**Browser verification gate:** real public-page browser opening must create an external visit; staff test must create only an internal visit; active-time/scroll update must be observed; invalid/expired staff token must not become external response.

## M6 — Commercial-loop integration 🟡 IMPLEMENTED / BROWSER VERIFY

Outreach now combines:

```text
mailing
→ public prospect link
→ measured response
→ next action
→ human contact/outcome
```

Implemented summary/detail UI:

- first/last measured opening;
- opening count;
- time from the most recent mailing preceding first opening;
- active time;
- maximum scroll;
- device/source;
- internal/external detail table;
- explicit **Test als medewerker** action.

No automatic lead score or contact-status transition.

**Verification gate:** operator can make a follow-up decision from one prospect dossier without consulting a separate analytics tool.

## M7 — Integrated operational pilot — NEXT EVIDENCE GATE

Use multiple real operators and approximately 10–20 real prospect mailings after the browser verification gates above are closed.

Validate:

- onboarding and role clarity;
- assignments/handover;
- My Work and unassigned work;
- actor/event quality;
- short public URL usability and QR behavior;
- engagement false positives/internal traffic;
- outreach decision usefulness;
- maintenance burden.

**Exit:** added commercial clarity demonstrably exceeds added operational complexity.

## M8 — Evidence-gated extensions only

Only after M7 evidence may we consider:

- engagement sorting/filtering;
- simple funnel reporting;
- `tel:` / `mailto:` interaction telemetry;
- first-view notifications;
- separate public runtime for proven reliability/security needs;
- per-dossier authorization for proven confidentiality requirements;
- task management only if responsibility + `next_action_at` repeatedly proves insufficient.

## Gate 3 — Five-prospect operational feasibility

The original business evidence gate remains conceptually separate from the operating-model rollout: prove that real prospect packs can be produced safely and consistently with measured effort/cost. Automate only repeated observed friction.

## Gate 4 — 30–50 physical-mail offer validation

Measure mail delivered, measured demo visit rate, response rate, meeting rate, cost and human minutes. Track:

```text
raw → valid → audited → qualified → mailed → viewed → responded
```

## Gate 5 — Pricing / first customer

Validate accepted project price, sales effort, delivery hours, corrections, external costs, gross margin and support burden.

## Gate 6 — 100+ prospect learning

Only at sufficient outcome volume compare pre-sale qualification and engagement signals against responses, meetings, proposals, wins and gross margin. Only then tune weighting or consider predictive modeling.

## Gate 7 — Automate proven bottlenecks

Automation candidates remain evidence-gated. Do not introduce queues, agentic workflows, richer orchestration or a production-site factory until an observed bottleneck earns them.

## Roadmap rules

1. Customer value and commercial learning lead; technology follows.
2. Prefer derived views over new state.
3. Prefer existing platform capabilities over new services.
4. Prefer explicit human actions over hidden automation until evidence justifies automation.
5. Domain names are delivery configuration, not business identity.
6. Transitional compatibility must have an explicit shrink/remove condition and may not silently become architecture.
7. Historical evidence/plans do not override current architecture or roadmap status.
8. No future milestone is implemented merely because it appears on this roadmap.
