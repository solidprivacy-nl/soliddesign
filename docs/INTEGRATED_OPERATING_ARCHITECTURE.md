# SolidDesign Integrated Operating Architecture

**Status:** target architecture / implementation basis  
**Date:** 2026-08-29

## Objective

Extend SolidDesign from a single-operator prospect tool into a small multi-user commercial work system without changing its architectural character.

The system remains:

- one application;
- one Cloudflare Pages deployment;
- one Supabase operational state plane;
- one canonical mock-up storage/lifecycle;
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

The brand/domain is configuration. The business identity is `prospects.public_slug`.

Preferred final hostname shape:

```text
https://cms.<brand>.nl
https://<brand>.nl/<public_slug>
```

See `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`.

## Identity and governance

Durable application membership is modeled as `team_members` and uses the stable Supabase Auth user UUID.

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

System role answers what a person may administer. It does not determine their prospect responsibilities.

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

The public route resolves:

```text
slug
→ prospect
→ current LIVE demo
→ canonical artifact
```

without changing the stable prospect identity.

When `<brand>.nl` is chosen, the same resolver moves to `<brand>.nl/<slug>` through configuration and host routing rather than data migration.

The final branded public host is a strict allowlist surface and must never become an alias for internal CMS routes.

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

Shared active/archive register with responsibility/status filters and an unassigned view for coordinators.

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

## Minimum data expansion

Only these core changes are required:

```text
team_members
prospect_assignments
events.actor_user_id
prospect_visits
```

Existing prospects, demos, mailings, audits, discovery and Storage remain authoritative.

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
- separate BI platform.

## Architecture invariants

1. One prospect is one dossier.
2. One canonical operational state plane.
3. One canonical LIVE artifact state.
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
16. No new subsystem is added without an observed problem that justifies it.
