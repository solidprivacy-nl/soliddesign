# SolidDesign Integrated Operating Architecture

**Status:** current operating architecture / rollout basis  
**Date:** 2026-08-29

## Objective

Operate SolidDesign as a small multi-user commercial work system without changing its architectural character.

The system remains:

- one application;
- one Cloudflare Pages project/deployment topology;
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
soliddesign-cms.pages.dev
later optionally cms.<brand>.nl

PUBLIC
temporary: soliddesign-cms.pages.dev/prospect/<slug>
later:     <brand>.nl/<slug>
```

The brand/domain is delivery configuration. The business identity is `prospects.public_slug`.

Preferred final hostname shape:

```text
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>
```

See `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`.

## Identity and governance

Durable application membership is `team_members` and uses the stable Supabase Auth user UUID.

System roles:

```text
ADMIN
KEY_USER
USER
```

- Admin: governance and Key-user/Admin management.
- Key user: operational coordination, normal User invitations and work distribution.
- User: normal prospect work.

There is no Owner/Eigenaar application role.

System role answers what a person may administer. It does not determine prospect responsibility.

### Membership rollout compatibility

`operator_allowlist` still gates older Operator RLS/access paths during the rollout. It is compatibility state only; `team_members` is the durable membership/role model.

Do not add new role/workflow semantics to the allowlist. Remove it only after the remaining RLS/access paths are explicitly migrated and browser-verified.

## Prospect responsibility

Current responsibility is explicit state in `prospect_assignments`:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

There is one primary accountable person per responsibility per prospect.

Assignments are not a read-security boundary in the first version. Active team members retain shared visibility for collaboration, handover and absence coverage.

Portfolio is derived from assignments; there is no portfolio table.

## Activity

`events.actor_user_id` records who initiated/performed material business actions.

Events record meaningful changes such as assignment changes, demo publication, mailing/contact changes, archive/restore and user-management actions.

Events do not record UI clicks/navigation.

Current responsibility is read from assignments; history is read from events.

## Public delivery

The temporary public route is:

```text
/prospect/<public_slug>
```

The canonical public mapping is:

```text
slug
→ prospect
→ current LIVE demo
→ stored immutable artifact
```

The public URL keeps the slug visible and does not expose internal UUID routes.

New LIVE publication requires `artifact_path`. External HTTPS preview links are review/DRAFT escape hatches only and cannot become newly LIVE.

A finite compatibility path exists for six grandfathered historical LIVE records that predate this invariant. It is restricted to explicitly allowlisted old SolidDesign Cloudflare preview hosts and is transition debt, not a general reverse-proxy capability.

On the current internal Pages hostname, the old root `/<slug>` route is only a redirect alias to `/prospect/<slug>/`; it no longer performs its own prospect/LIVE resolution.

When `<brand>.nl` is chosen, the same public resolver semantics move to `<brand>.nl/<slug>` through hostname/path routing rather than data migration. The branded public host must be a strict capability allowlist and never become an alias for internal CMS routes.

## Engagement

`prospect_visits` measures response to the prospect link, not human identity.

MVP fields/signals:

- prospect/demo;
- external/internal;
- QR/direct;
- broad device class;
- first/last telemetry timestamps;
- active visible seconds;
- max scroll.

No raw IP, IP hash, fingerprint, persistent visitor identity, heatmap or session replay.

A plain HTTP GET is not considered commercial engagement. Browser-visible first-party telemetry is required to reduce bot/scanner false positives.

Telemetry failure must never block public delivery.

Internal employee QA uses a short-lived server-signed token bound to the prospect slug. IP-based classification and guessable internal flags are deliberately avoided.

## Internal information architecture

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

### Mijn werk

Default landing page. Derived from assignments and contextually opens the relevant dossier tab.

### Prospects

Shared active/archive register with status and simple work-distribution filters, including unassigned responsibilities.

### Team

Combines membership lifecycle and current work-distribution visibility. It is not an HR system or capacity-planning platform.

### Outreach

Owns the commercial feedback loop:

```text
mailing
→ prospect URL
→ engagement
→ next action
→ contact/outcome
```

Engagement never automatically changes contact status or produces a lead score without later outcome evidence.

## Implemented data expansion

The integrated operating model adds only:

```text
team_members
prospect_assignments
events.actor_user_id
prospect_visits
```

Existing prospects, demos, mailings, audits, discovery and Storage remain authoritative.

No task table, portfolio table or analytics database was introduced.

## Database evolution

Current database state is defined by:

```text
supabase/schema.sql       # original bootstrap baseline
        ↓
supabase/migrations/*     # ordered canonical evolution
        ↓
current production schema
```

Do not maintain a second manually synchronized current schema file. See `supabase/README.md`.

## Deployment topology

There is one Pages project:

```text
main            → production
pr-<number>     → isolated pre-merge QA preview
```

PR preview branches are verification environments in the same application/project, not separate architecture.

## Explicit non-goals

Do not add without observed need:

- task engine;
- Kanban/Gantt;
- capacity planner;
- time tracking;
- workflow builder;
- separate portfolio data model;
- custom permission builder;
- per-dossier ACLs;
- separate public application;
- second analytics datastore;
- visitor fingerprinting;
- automated lead scoring;
- marketing automation;
- separate BI platform;
- generalized external-preview/reverse-proxy platform.

## Architecture invariants

1. One prospect is one dossier.
2. One canonical operational state plane.
3. One canonical stored-artifact LIVE state for new publication.
4. System role and prospect responsibility are independent.
5. One primary assignee per responsibility.
6. Assignment is current state; event log is history.
7. Material user actions are attributable.
8. Portfolio is derived, not stored separately.
9. Domain/brand names are delivery configuration.
10. Preferred final hosts are `cms.<brand>.nl` and `<brand>.nl/<slug>`.
11. Public slug is an address, not an authorization secret.
12. Public delivery never exposes internal CMS capability.
13. Engagement measures campaign response, not personal identity.
14. Telemetry failure never blocks the prospect page.
15. Routine onboarding does not require manual SQL/admin-console work.
16. `operator_allowlist` is rollout compatibility, not a second durable membership model.
17. Historical external LIVE compatibility is finite and must not expand into a general proxy.
18. Database changes after bootstrap are expressed as ordered migrations.
19. No new subsystem is added without an observed problem that justifies it.
