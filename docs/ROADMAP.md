# Roadmap

The roadmap is evidence-gated. Completing code is not success; closing learning gates is success.

## Gate 0 — Documentation baseline ✅

Closed.

## Gate 1 — Offline component spike ✅

Closed with CI safety invariants.

## Gate 2 — Live single-prospect technical test ✅

Closed on 2026-08-25. Overture remains the canonical Phase-1 discovery source and one shared Cloudflare/Supabase operating path is proven. See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

# Integrated operating-model rollout — verification & pilot preparation ← CURRENT

SolidDesign is being extended from a single-operator prospect tool into a small multi-user commercial work system while preserving one application, one operational state plane, explicit human control and minimal moving parts.

Canonical design:

- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`

Status rule used below:

- **Implemented** means the required code/schema/UI exists on the integration branch and backwards-compatible database/server changes are applied where necessary.
- **Verified** requires CI plus the relevant real browser/operator smoke test.

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

Architecture, security, public-link and Operator documentation now point to one operating model. Domain names are delivery configuration; `public_slug` remains prospect identity.

## M1 — Team identity & invite-only access 🟡 IMPLEMENTED / BROWSER VERIFY

Implemented:

- `team_members` with stable Supabase Auth UUID;
- current operators backfilled without access loss;
- `ADMIN / KEY_USER / USER`;
- server-side Auth invite flow;
- Admin can invite User/Key user;
- Key user can invite User only;
- mandatory first password setup;
- invited user is not considered joined before password setup finishes;
- deactivate/reactivate lifecycle;
- last-Admin and active-assignment safeguards;
- self-signup hidden in the normal UI;
- browser CORS/preflight support on the invite function.

Transitional `operator_allowlist` remains in place until invite-only onboarding is proven end-to-end in the deployed UI.

**Verification gate:** invite one controlled test colleague, finish first-login activation, verify role visibility/access, then deactivate/reactivate without SQL/admin-console intervention.

## M2 — Responsibility & actor-aware history 🟢 IMPLEMENTED

Implemented:

- `prospect_assignments`;
- one primary `CASE_LEAD`, `DESIGN`, `OUTREACH` per prospect;
- guarded assignment changes;
- `events.actor_user_id`;
- actor-aware material history;
- assignment/lifecycle events;
- deactivation blocked until active responsibilities are released/reassigned.

**Verification gate:** browser smoke assignment changes with two roles/users and confirm Activity attribution.

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

## M4 — Brand-agnostic public delivery 🟡 IMPLEMENTED / DEPLOYMENT VERIFY

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
- public route resolves slug → prospect → current LIVE demo → existing artifact;
- public URL keeps the slug and hides the UUID route;
- assets are served through the same public namespace;
- trailing-slash canonicalization preserves query attribution;
- public/internal origins are configuration;
- pull requests can deploy to an isolated `pr-<number>` Pages preview branch for pre-merge browser validation; production still deploys only from `main`.

**Verification gate:** deployed preview smoke for valid slug, assets, invalid slug/404, noindex, query preservation and LIVE-version switching.

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

**Verification gate:** real public-page browser opening must create an external visit; staff test must create only an internal visit; active-time/scroll update must be observed; invalid/expired staff token must not become external response.

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

Use multiple real operators and approximately 10–20 real prospect mailings.

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
6. No future milestone is implemented merely because it appears on this roadmap.
