# Roadmap

The roadmap is evidence-gated. Completing code is not success; closing learning gates is success.

## Gate 0 — Documentation baseline ✅

Closed.

## Gate 1 — Offline component spike ✅

Closed with CI safety invariants.

## Gate 2 — Live single-prospect technical test ✅

Closed on 2026-08-25. Overture remains the canonical Phase-1 discovery source and one shared Cloudflare/Supabase operating path is proven. See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

## Integrated operating-model rollout ← CURRENT

SolidDesign is now being extended from a single-operator prospect tool into a small multi-user commercial work system while preserving the existing architecture character: one application, one operational state plane, explicit human control and minimal moving parts.

The integrated target is documented in `docs/INTEGRATED_OPERATING_ARCHITECTURE.md` and the hostname decision in `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`.

### M0 — Architecture contract & truth reconciliation

- freeze system roles: `ADMIN`, `KEY_USER`, `USER`;
- freeze prospect responsibilities: `CASE_LEAD`, `DESIGN`, `OUTREACH`;
- reconcile canonical schema with later migrations;
- define actor-aware event rules;
- define public-host route contract;
- define engagement MVP and retention/privacy rules;
- make internal/public origins explicit configuration;
- preserve the preferred final pattern:

```text
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>
```

Temporary rollout:

```text
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

**Exit:** repository documentation and runtime contracts tell one coherent story.

### M1 — Team identity & invite-only access

- add `team_members`;
- migrate current authorized operators without losing access;
- introduce `ADMIN / KEY_USER / USER`;
- trusted invite flow;
- Key user may invite User;
- Admin may manage Key users and Admin governance;
- remove normal self-signup after invite flow is proven;
- deactivate rather than delete members with history.

**Exit:** normal onboarding/offboarding needs no SQL or database-console intervention.

### M2 — Responsibility & actor-aware history

- add `prospect_assignments`;
- add `events.actor_user_id`;
- one primary assignee for `CASE_LEAD`, `DESIGN`, `OUTREACH`;
- assignment changes become meaningful business events;
- material existing mutations record the authenticated actor;
- deactivation is blocked until active responsibilities are reassigned/released.

**Exit:** every active prospect answers who is responsible now and who performed material actions.

### M3 — Multi-user information architecture

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

- `Mijn werk` becomes default landing page;
- portfolio is derived from assignments, never stored separately;
- Prospects gains responsibility/unassigned filters;
- Team combines membership and work-distribution visibility;
- keep the existing lightweight frontend; no framework migration merely for routing.

**Exit:** each role reaches normal daily work in one or two interactions.

### M4 — Brand-agnostic public delivery

Build public delivery before the final brand is chosen.

Temporary:

```text
PUBLIC_PROSPECT_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_PATH_PREFIX=/prospect
```

Result:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

After the brand is chosen:

```text
PUBLIC_PROSPECT_ORIGIN=https://<brand>.nl
PUBLIC_PROSPECT_PATH_PREFIX=
INTERNAL_ORIGIN=https://cms.<brand>.nl   # optional later CMS cutover
```

- same Pages project;
- same Supabase and Storage;
- same `public_slug` and LIVE state;
- strict public-host allowlist on the final branded host;
- no UUID/internal-route exposure;
- no second deployment just for naming;
- temporary links may redirect during cutover.

**Exit:** public delivery is independent of the selected brand hostname.

### M5 — Prospect engagement MVP

- add `prospect_visits`;
- central first-party instrumentation at the delivery layer;
- measured visible opening;
- active visible time;
- max scroll;
- broad device class;
- QR/direct source;
- internal/external classification;
- demo snapshot;
- no raw IP, fingerprint or persistent visitor identity;
- telemetry failure never blocks the prospect experience.

**Exit:** response telemetry is useful and does not create a second analytics product.

### M6 — Commercial-loop integration

Outreach view combines:

```text
mailing
→ public prospect link
→ measured response
→ next action
→ human contact/outcome
```

Show first/last measured opening, time from mailing to first opening, external opening count, active time, max scroll, device/source and a simple detail table.

No automatic lead score or contact-status transition.

**Exit:** outreach users can make follow-up decisions from the prospect dossier alone.

### M7 — Integrated operational pilot

Use multiple real operators and approximately 10–20 real prospect mailings.

Validate onboarding, role clarity, assignments, handovers, My Work, unassigned work, event quality, public URL usability, QR behavior, engagement false positives/internal traffic and maintenance burden.

**Exit:** added commercial clarity demonstrably exceeds added operational complexity.

### M8 — Evidence-gated extensions only

Only after M7 evidence may we consider:

- engagement sorting/filtering;
- simple funnel reporting;
- `tel:` / `mailto:` interaction telemetry;
- first-view notifications;
- separate public runtime for proven reliability/security needs;
- per-dossier authorization for proven confidentiality requirements;
- task management only if responsibility + `next_action_at` repeatedly proves insufficient.

## Gate 3 — Five-prospect operational feasibility

This business evidence gate remains active alongside the operating-model rollout.

Run five real prospects through the composed path and measure discovery, audit, human-selection, design, correction, print-pack and total cost/effort. Automate only repeated observed friction.

**Exit:** five prospect packs can be produced safely and consistently with measured effort/cost and no unresolved recurring technical blocker.

## Gate 4 — 30–50 physical-mail offer validation

Measure mail delivered, measured demo visit rate, response rate, meeting rate, cost and human minutes. Track the full funnel:

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
