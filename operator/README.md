# SolidDesign Operator

Small internal multi-user workspace for prospect, design and outreach work.

Canonical architecture: `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`. Documentation precedence: `docs/ARCHITECTURE.md`.

## Product boundary

SolidDesign Operator deliberately supports only:

- **Mijn werk** — work derived from current responsibilities;
- **Prospects** — shared register and dossiers;
- **Bedrijven zoeken** — manual discovery/intake;
- **Team** — invite, role/lifecycle and work distribution for Key users/Admins;
- **Overzicht / Design / Outreach / Activiteit** per prospect;
- immutable mock-up versions with explicit LIVE promotion;
- stable public prospect links;
- minimal prospect engagement in Outreach;
- actor-aware history.

It is not a general CRM, website builder, task engine, workflow platform, HR system, capacity planner or analytics suite.

## Responsibility model

A prospect is the dossier. Responsibility is separate from application role:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary assignee exists per responsibility. **Mijn werk** is derived from assignments; there is no task/portfolio table.

## Roles and human identity

Roles:

```text
ADMIN
KEY_USER
USER
```

- **Admin** — governance, lifecycle and role management.
- **Key user** — operational coordination, User invitations and User management.
- **User** — normal prospect/design/outreach work.

There is no Owner/Eigenaar role.

`team_members.display_name` is the primary visible identity. E-mail is secondary login/account metadata. Assignments/activity use display names.

Initials avatars are derived client-side; no profile-photo/avatar subsystem exists.

## Invite-only onboarding

```text
Admin / Key user
→ Team
→ Gebruiker uitnodigen
→ Supabase Auth invite
→ own password
→ joined_at
→ normal login / Mijn werk
```

Rules:

- Admin can invite User or Key user;
- Key user can invite User only;
- invited users become assignable only after activation;
- one active Admin must always remain;
- active responsibilities must be reassigned before deactivation;
- no service/admin secret reaches browser code.

The invite function supplies an explicit validated Auth `redirectTo`. Exact hosted configuration is in `docs/AUTH_REDIRECTS.md`.

## Authorization

Durable authorization truth is:

```text
Supabase Auth UUID
→ active team_members
→ RLS / guarded RPC / server capability
```

`operator_is_active_team_member()` is the common membership predicate. Operator/storage RLS no longer uses `operator_allowlist` as authorization input.

The historical `operator_allowlist` remains temporarily only because the pre-merge production frontend still performs one bootstrap compatibility read and two lifecycle functions keep that compatibility row synchronized. Do not add consumers. After the new frontend is deployed to production and production smoke passes, remove the old bootstrap/sync/table together.

Onboarding metadata used by the password overlay is UX state, not authorization authority.

## Deactivation versus deletion

**Deactiveren** is normal offboarding and preserves history.

**Verwijderen** is Admin-only cleanup for mistaken/test accounts without active responsibilities or prospect-linked business history. Server guards also prevent self-delete and last-Admin removal. Users with business history are deactivated instead.

## Discovery

```text
AREA / URL intake
→ DISCOVERED / DISQUALIFIED
→ evidence-backed qualification
→ QUALIFIED and later states
→ active prospect dossier
```

Overture remains the canonical discovery source. Reachability/presence is evidence, not qualification itself.

## Design workflow

```text
verified prospect context
→ design brief / ChatGPT design workflow
→ DRAFT mock-up
→ review
→ explicit Maak live
→ stable public prospect link
```

Current internal entrypoints:

```text
https://soliddesign-cms.pages.dev/start-design
https://soliddesign-cms.pages.dev/brief/<opaque-token>
```

These may later move to `cms.<brand>.nl` without changing dossier identity.

## Mock-up storage and LIVE state

Publishable inputs:

- standalone `.html`;
- static `.zip` with root `index.html` and relative assets.

External HTTPS previews are DRAFT/review escape hatches only. New LIVE publication requires a canonical stored artifact and is database-enforced.

Internal technical preview routes may include UUIDs; prospect-facing communication does not.

Six grandfathered historical LIVE records still use finite host/path-bounded compatibility. Do not expand that path into a general external-preview proxy.

## Public prospect link

Current:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final shape:

```text
https://<brand>.nl/<slug>
https://cms.<brand>.nl        # internal CMS
```

The slug is stable prospect state; full URLs are derived from configuration.

On PR previews, prospect links deliberately use the same `pr-<number>` origin so browser acceptance executes the PR public-delivery/telemetry code rather than production code.

See `docs/PROSPECT_PUBLIC_LINKS.md`.

## Outreach and engagement

Outreach shows commercially useful measured response:

- external opening count;
- first/last opening;
- active visible time;
- max scroll;
- broad device;
- QR/direct source;
- internal/external opening details.

Engagement is observational. It never automatically changes contact status or lead score.

**Test als medewerker** mints a short-lived signed prospect-bound token so staff QA is classified `INTERNAL`. No IP allowlist or guessable internal flag is used.

For engagement acceptance, visible UI is insufficient: confirm real Edge Function POSTs and persisted `prospect_visits` rows. See `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

## Activity

Activity shows material changes and actor identity. Current state remains in canonical state tables; `events` is history.

Examples:

- responsibility changes;
- contact status/moments;
- mock-up creation/LIVE promotion;
- mailing;
- archive/restore;
- team lifecycle actions.

Routine navigation is not logged.

## Security

Frontend receives only the Supabase publishable key. RLS plus narrow guarded RPC/server capabilities protect internal state. Public delivery receives only the resolver capability required to serve the current LIVE artifact.

Do not expose service-role/secret credentials to browser code.

See `docs/SECURITY.md`.
