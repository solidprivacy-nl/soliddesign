# SolidDesign Operator

Small internal multi-user workspace for the human prospect, design and outreach workflow.

The canonical system model is `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`.

## Product boundary

SolidDesign Operator remains deliberately narrow. It supports:

- **Mijn werk** — personal work derived from current prospect responsibilities;
- **Prospects** — shared prospect register and dossiers;
- **Bedrijven zoeken** — manual discovery/intake;
- **Team** — invite, role/status and work-distribution view for Key users/Admins;
- per-prospect **Overzicht / Design / Outreach / Activiteit**;
- immutable mock-up versions with explicit LIVE promotion;
- stable public prospect links;
- minimal prospect engagement in Outreach;
- actor-aware dossier history.

It is explicitly not a general CRM, website builder, task engine, workflow platform, HR system, capacity planner or analytics suite.

## One dossier, phase responsibilities

A prospect is the dossier. Current responsibility is stored separately from user role:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary assignee exists per responsibility. **Mijn werk** is derived from these assignments; no task/portfolio table exists.

Opening work contextually lands on the relevant dossier phase where unambiguous.

## Roles

Application roles are:

```text
ADMIN
KEY_USER
USER
```

- **Admin** — governance, all normal team lifecycle and role changes.
- **Key user** — operational coordination, User invitations and User management.
- **User** — normal prospect/design/outreach work.

There is deliberately no Owner/Eigenaar role.

## Invite-only onboarding

Routine onboarding does not require SQL or Supabase dashboard changes.

```text
Admin / Key user
→ Team
→ Gebruiker uitnodigen
→ Supabase Auth invite e-mail
→ invited colleague opens invite
→ chooses own password
→ membership becomes Active
→ normal login / Mijn werk
```

Rules:

- Admin can invite User or Key user;
- Key user can invite User only;
- invited users are not assignable until first activation is completed;
- at least one active Admin must remain;
- a member with active responsibilities must be reassigned before deactivation;
- no service/admin secret is exposed to the browser.

`operator_allowlist` remains a temporary compatibility gate during rollout. `team_members` is the durable target membership model.

## Discovery workflow

Discovery and active prospect work remain separate views while using the same canonical `prospects` model.

```text
AREA / URL intake
→ DISCOVERED / DISQUALIFIED
→ evidence-backed qualification
→ QUALIFIED and later states
→ active prospect dossier
```

Overture remains the Phase-1 primary discovery source. Reachability/presence is discovery evidence, not proof of demand or qualification.

The existing area-discovery, URL preflight, run-history and qualification safeguards remain unchanged by the multi-user architecture.

## Design workflow

A selected prospect retains the existing design context and mock-up lifecycle:

```text
verified prospect context
→ design brief / ChatGPT design workflow
→ DRAFT mock-up version
→ review
→ explicit Maak live
→ stable public prospect link
```

Current methodological entrypoint:

```text
https://soliddesign-cms.pages.dev/start-design
```

Prospect-specific design brief:

```text
https://soliddesign-cms.pages.dev/brief/<opaque-token>
```

These are internal/design-workflow infrastructure and may later move with `INTERNAL_ORIGIN` to `cms.<brand>.nl` without changing dossier identity.

## Mock-up storage and LIVE state

Accepted inputs remain:

- standalone `.html`;
- static-site `.zip` with root `index.html` and relative static assets;
- external HTTPS preview as a deliberate escape hatch.

Immutable bundle versions live in the existing `mockup-sites` Storage model. The existing read-only preview serving path remains the canonical artifact mechanism.

Internal technical routes may include:

```text
/p/<prospect-id>/
/p/<prospect-id>/v/<demo-id>/
```

They are not the prospect-facing communication URL.

## Public prospect link

Temporary rollout URL:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final shape after brand selection:

```text
https://<brand>.nl/<slug>
```

with the internal CMS optionally at:

```text
https://cms.<brand>.nl
```

The slug is stable prospect state; full URLs are derived from configuration. A domain cutover therefore requires no data migration.

See `docs/PROSPECT_PUBLIC_LINKS.md`.

## Outreach and engagement

Outreach combines contact follow-up with the commercially relevant digital-response summary.

Minimal response signals:

- external opening count;
- first and last opening;
- active visible time;
- maximum scroll;
- broad device type;
- QR/direct source;
- detail view of measured openings.

Engagement is observational. It does not automatically change contact status or lead score.

### Staff testing

Normal design work uses internal previews.

**Test als medewerker** requests a short-lived signed token from the backend and opens the public URL with that one-time context. The public telemetry endpoint validates the token and classifies the opening as internal, so staff QA does not inflate prospect response.

No IP allowlist or guessable `?internal=1` flag is used.

## Activity

The Activity dossier tab shows material business changes and the actor where known. Current state is read from the canonical tables; `events` is history, not a second state model.

Examples:

- responsibility changed;
- contact status/contact moment;
- mock-up created or promoted LIVE;
- mailing sent;
- archive/restore;
- team lifecycle actions.

Routine UI navigation is not logged.

## Access and security

The frontend uses only the Supabase publishable key.

Internal access is enforced through:

- Supabase Auth identity;
- active `team_members` membership;
- transitional allowlist compatibility during rollout;
- RLS and narrow authenticated RPC/server capabilities;
- server-side role checks for privileged operations.

Public prospect delivery and engagement are intentionally narrow read/telemetry surfaces. Drafts and internal dossier state are never made public.

Do not expose service-role/secret credentials to this frontend.

See `docs/SECURITY.md`.
