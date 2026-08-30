# SolidDesign Integrated Operating Architecture

**Status:** current production operating architecture  
**Date:** 2026-08-30

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

Authentication invitations/login flows belong to the **internal** origin, not the public prospect origin. Their hosted Supabase Site URL / Redirect URL contract is maintained in `docs/AUTH_REDIRECTS.md`. Application invite code uses an explicit validated `redirectTo`; a stale localhost Site URL is never intended runtime behavior.

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

### Human identity

`team_members.display_name` is the primary human-readable identity in SolidDesign. E-mail is secondary login/account metadata and is not used as the normal prospect-assignment or activity label.

The UI derives a lightweight initials avatar from `display_name`; there is no avatar-upload/profile-storage subsystem in the current architecture.

Admin may correct a display name without changing the stable Auth UUID that assignments and event attribution use.

### Membership lifecycle

```text
INVITED
→ ACTIVE
→ INACTIVE
```

The visible status is derived from `active`, `joined_at` and `deactivated_at`; there is no second lifecycle state machine.

Deactivation is normal offboarding and preserves history.

Permanent deletion is a narrow Admin cleanup capability for mistaken/test accounts only. Server-side guards reject deletion when the target is the caller, has active assignments, has prospect-linked business history, or would remove the last active Admin. Accounts with business history are deactivated instead.

### Membership authorization

Authorization is derived from the authenticated Auth UUID and active `team_members` membership.

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The Operator RLS policies and browser bootstrap use this model directly. The historical `operator_allowlist` was removed from production on 2026-08-30 by `20260830_operator_allowlist_retirement_v01.sql`; verified remaining RLS/function references are zero. Active `team_members` is the only durable application-membership authorization model.

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

Browser acceptance on 2026-08-30 proved persisted EXTERNAL and INTERNAL openings plus active-time/scroll updates. See `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

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

PR preview prospect links remain on their PR origin so browser acceptance runs the code being reviewed rather than silently leaving for production.

The same post-deploy HTTP smoke applies to PR previews and production: CMS root, team-membership bootstrap, telemetry client, canonical public routing, bounded legacy compatibility and Edge Function CORS must all pass.

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
- generalized external-preview/reverse-proxy platform;
- user-profile/avatar image subsystem.

## Architecture invariants

1. One prospect is one dossier.
2. One canonical operational state plane.
3. One canonical stored-artifact LIVE state for new publication.
4. System role and prospect responsibility are independent.
5. One primary assignee per responsibility.
6. Assignment is current state; event log is history.
7. Material user actions are attributable.
8. Human work identity is stable Auth UUID + `display_name`; e-mail is account metadata.
9. Deactivation preserves history; permanent deletion is only for history-free correction/test accounts.
10. Portfolio is derived, not stored separately.
11. Domain/brand names are delivery configuration.
12. Preferred final hosts are `cms.<brand>.nl` and `<brand>.nl/<slug>`.
13. Auth redirects follow the configured internal origin and never a stale localhost fallback or arbitrary browser origin.
14. Public slug is an address, not an authorization secret.
15. Public delivery never exposes internal CMS capability.
16. Engagement measures campaign response, not personal identity.
17. Telemetry failure never blocks the prospect page.
18. Routine onboarding does not require manual SQL/admin-console work; hosted Auth URL configuration remains normal platform deployment configuration.
19. Active `team_members` is the sole durable application-membership authorization model.
20. Historical external LIVE compatibility is finite and must not expand into a general proxy.
21. Database changes after bootstrap are expressed as ordered migrations.
22. Production deploy success includes runtime smoke, not upload success alone.
23. No new subsystem is added without an observed problem that justifies it.
