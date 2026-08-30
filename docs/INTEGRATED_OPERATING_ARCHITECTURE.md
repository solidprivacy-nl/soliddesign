# SolidDesign Integrated Operating Architecture

**Status:** current operating architecture / rollout basis  
**Updated:** 2026-08-30

## Objective

Operate SolidDesign as a small multi-user commercial work system without changing its architectural character.

The system remains:

- one application;
- one Cloudflare Pages project;
- one Supabase operational state plane;
- one canonical mock-up storage/LIVE lifecycle;
- explicit human control;
- minimal state and dependencies.

## Core model

```text
TEAM
  ↓
RESPONSIBILITY
  ↓
PROSPECT DOSSIER
  ↓
DESIGN
  ↓
PUBLIC DELIVERY
  ↓
ENGAGEMENT
  ↓
OUTREACH
  ↓
OUTCOME
  ↓
LEARNING
```

## Two audiences, one system

```text
INTERNAL
current: soliddesign-cms.pages.dev
final:   cms.<brand>.nl

PUBLIC
current: soliddesign-cms.pages.dev/prospect/<slug>
final:   <brand>.nl/<slug>
```

Domain names are delivery configuration. Prospect identity is `prospects.public_slug`.

Auth invitations/login belong to the internal origin. Exact hosted Auth URL configuration lives in `docs/AUTH_REDIRECTS.md`.

PR previews are isolated verification deployments inside the same Pages project. During acceptance their prospect links stay on their own `pr-<number>` origin so PR browser behavior tests PR code rather than production code.

## Identity, authorization and governance

Supabase Auth provides identity. Durable membership is `team_members`, keyed by Auth UUID.

Roles:

```text
ADMIN
KEY_USER
USER
```

- Admin: governance and all normal team lifecycle/role management.
- Key user: operational coordination, normal User invitations and work distribution.
- User: normal prospect/design/outreach work.

There is no Owner/Eigenaar application role.

System role answers what a person may administer. It does not determine prospect responsibility.

### Authorization truth

Current authorization chain:

```text
auth.uid()
→ active team_members
→ RLS / guarded RPC / server capability
```

`operator_is_active_team_member()` is the common membership predicate. Operator/storage RLS and `operator_assert_allowed()` no longer use `operator_allowlist` as authorization input.

The old allowlist remains temporarily only because the pre-merge production frontend still performs a legacy bootstrap read and two lifecycle functions keep that compatibility row synchronized. This bridge must be removed after the new frontend is deployed to production and production smoke passes. It may not acquire new semantics or consumers.

### Human identity

`team_members.display_name` is the primary human-readable identity. E-mail is secondary login/account metadata, not the normal prospect-assignment or activity label.

The UI derives initials from `display_name`; there is no avatar-upload/profile-storage subsystem.

Admin may correct a display name without changing the stable UUID used by assignments/events.

### Membership lifecycle

```text
INVITED
→ ACTIVE
→ INACTIVE
```

Visible lifecycle is derived from `active`, `joined_at` and `deactivated_at`; there is no second state machine.

Deactivation is normal offboarding and preserves history.

Permanent deletion is an Admin-only correction/test cleanup capability. Server-side guards reject deletion when the target is the caller, has active assignments, has prospect-linked business history, or would remove the last active Admin. Accounts with business history are deactivated instead.

## Prospect responsibility

Current responsibility is explicit in `prospect_assignments`:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary accountable person exists per responsibility per prospect.

Assignments are not a read-security boundary in this version. Active team members retain shared visibility for collaboration, handover and absence coverage.

Portfolio/My Work is derived from assignments; there is no portfolio or task table.

## Activity

`events.actor_user_id` records who performed material business actions.

Events capture meaningful changes such as assignments, publication, mailing/contact changes, archive/restore and team lifecycle actions. UI clicks/navigation are not activity events.

Current responsibility comes from assignments; history comes from events.

## Internal information architecture

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

### Mijn werk

Derived personal work surface. Assigned Design/Outreach opens the matching dossier phase when unambiguous.

### Prospects

Shared active/archive register with status and simple work-distribution filters, including missing responsibilities.

### Team

Membership lifecycle + work distribution. It is not HR/capacity planning.

### Outreach

Commercial feedback loop:

```text
mailing
→ public prospect URL
→ measured response
→ next action
→ contact/outcome
```

Engagement never automatically changes contact status or creates a lead score.

## Design and LIVE lifecycle

Normal publishable inputs:

- standalone HTML;
- static ZIP with root `index.html` and relative assets.

Canonical flow:

```text
verified prospect context
→ design brief
→ DRAFT mock-up
→ review
→ explicit LIVE promotion
→ public prospect URL
```

New LIVE publication requires a stored `artifact_path`. External HTTPS previews are DRAFT/review escape hatches only.

Internal technical preview routes may expose UUIDs; prospect-facing communication does not.

## Public delivery

Current public route:

```text
/prospect/<public_slug>
```

Canonical mapping:

```text
slug
→ prospect
→ current LIVE demo
→ stored immutable artifact
```

The public URL keeps the slug visible and hides internal UUID routing.

The old root `/<slug>` route on the current CMS host is compatibility redirect only; it performs no parallel prospect/LIVE resolution.

A finite compatibility path supports six historical LIVE records that predate artifact-only publication. It accepts only known SolidDesign legacy preview hosts. It is transition debt, not a generalized proxy.

When `<brand>.nl` is chosen, the same resolver semantics move to `<brand>.nl/<slug>` through hostname/path routing, not data migration. The public hostname must expose only public prospect capability and never internal CMS routes.

## Engagement

`prospect_visits` measures response to a prospect link, not human identity.

Signals:

- prospect/demo;
- external/internal opening;
- QR/direct;
- broad device class;
- first/last telemetry timestamps;
- active visible seconds;
- max scroll.

No raw IP, IP hash, fingerprint, persistent visitor identity, heatmap, replay or clickstream.

A plain HTTP GET is not commercial engagement. A short browser-visible dwell is required before creating a measured opening.

Telemetry failure never blocks public delivery.

Internal QA uses a short-lived server-signed token bound to the prospect slug. IP-based classification and guessable internal flags are deliberately avoided.

### Acceptance evidence rule

For stateful engagement, visible UI behavior is not sufficient evidence. Browser verification must be corroborated by persisted `prospect_visits` rows and actual Edge Function POST requests.

The initial PR-28 engagement acceptance exposed an environment bug: PR prospect links opened production instead of the PR public route. PR previews now keep prospect links on their own origin. M5/M6 remain open until persisted EXTERNAL + INTERNAL rows are observed after this fix.

See `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

## Implemented data expansion

The integrated model adds only:

```text
team_members
prospect_assignments
events.actor_user_id
prospect_visits
```

Existing prospects, demos, mailings, audits, discovery and Storage remain authoritative.

No task table, portfolio table, profile database or analytics datastore was introduced.

## Database evolution

```text
supabase/schema.sql       # bootstrap baseline
→ supabase/migrations/*   # ordered canonical evolution
→ current production schema
```

Do not maintain a second manually synchronized current schema. See `supabase/README.md`.

## Deployment topology

One Pages project:

```text
main            → production
pr-<number>     → isolated pre-merge QA
```

PR previews are verification environments, not separate architecture.

## Explicit non-goals

Do not add without observed need:

- task engine;
- Kanban/Gantt/capacity planner;
- time tracking/workflow builder;
- separate portfolio model;
- custom permission builder;
- per-dossier ACLs;
- separate public application;
- second analytics datastore/BI platform;
- visitor fingerprinting;
- automated lead scoring/marketing automation;
- generalized reverse proxy;
- photo/avatar profile subsystem.

## Architecture invariants

1. One prospect is one dossier.
2. One canonical operational state plane.
3. One canonical stored-artifact LIVE state for new publication.
4. System role and prospect responsibility are independent.
5. One primary assignee per responsibility.
6. Assignment is current state; event log is history.
7. Material user actions are attributable.
8. Human identity is stable Auth UUID + `display_name`; e-mail is account metadata.
9. Active `team_members` is authorization truth.
10. Deactivation preserves history; deletion is for history-free correction/test accounts.
11. Portfolio/My Work is derived, not stored separately.
12. Domain/brand names are delivery configuration.
13. Auth redirects follow a validated internal origin, never stale localhost/arbitrary destinations.
14. Public slug is an address, not an authorization secret.
15. Public delivery never exposes internal CMS capability.
16. Engagement measures campaign response, not personal identity.
17. Telemetry failure never blocks the prospect page.
18. Browser acceptance for stateful features must be corroborated by authoritative state.
19. Historical allowlist compatibility may shrink only and disappears after production frontend cutover.
20. Historical external LIVE compatibility is finite and may not become a general proxy.
21. Post-bootstrap database changes are ordered migrations.
22. No subsystem is added without an observed problem that justifies it.
