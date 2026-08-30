# SolidDesign Operator

Small internal multi-user workspace for the human prospect, design and outreach workflow.

The canonical system model is `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`. Documentation precedence is defined in `docs/ARCHITECTURE.md`.

## Product boundary

SolidDesign Operator remains deliberately narrow. It supports:

- **Mijn werk** — personal work derived from current prospect responsibilities;
- **Prospects** — shared prospect register and dossiers;
- **Bedrijven zoeken** — manual discovery/intake;
- **Team** — invite, role/status and work-distribution view for Key users/Admins;
- per-prospect **Overzicht / Design / Outreach / Activiteit**;
- immutable website mock-up versions with explicit LIVE promotion;
- immutable printmailing versions with exact physical-send attribution;
- stable public prospect links;
- minimal prospect engagement in Outreach;
- actor-aware dossier history.

It is explicitly not a general CRM, website builder, document-management system, task engine, workflow platform, HR system, capacity planner or analytics suite.

## One dossier, phase responsibilities

A prospect is the dossier. Current responsibility is stored separately from user role:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary assignee exists per responsibility. **Mijn werk** is derived from these assignments; no task/portfolio table exists.

Opening assigned work contextually lands on the relevant dossier phase where unambiguous.

## Roles and human identity

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

`team_members.display_name` is the primary visible identity. E-mail is secondary account/login metadata. Assignments and Activity use display names, with initials derived client-side; no profile-photo/avatar subsystem exists.

## Invite-only onboarding and access

```text
Admin / Key user
→ Team
→ Gebruiker uitnodigen
→ Supabase Auth invite e-mail
→ invited colleague opens invite
→ chooses own password
→ joined_at is recorded
→ normal login / Mijn werk
```

Rules:

- Admin can invite User or Key user;
- Key user can invite User only;
- invited users are not assignable until activation is complete;
- at least one active Admin must remain;
- active responsibilities must be reassigned before deactivation;
- no service/admin secret is exposed to the browser.

The invite Edge Function supplies an explicit validated Auth `redirectTo`; hosted Site/Redirect URL configuration and the future `cms.<brand>.nl` cutover are defined in `docs/AUTH_REDIRECTS.md`.

Authorization is one model only:

```text
Supabase Auth UUID
→ team_members.active
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` was removed from production on 2026-08-30. Do not recreate a parallel membership gate.

Invitation metadata used by the password-setup overlay is onboarding UX state, not authorization authority.

## Deactivation versus deletion

**Deactiveren** is normal offboarding and preserves historical attribution.

**Verwijderen** is Admin-only cleanup for mistaken/test accounts with no active responsibilities or prospect-linked business history. The server prevents self-delete and removal of the last active Admin. If business history exists, deactivate instead.

## Discovery workflow

Discovery and active prospect work remain separate views while using the same canonical `prospects` model.

```text
AREA / URL intake
→ DISCOVERED / DISQUALIFIED
→ evidence-backed qualification
→ QUALIFIED and later states
→ active prospect dossier
```

Overture remains the canonical discovery source. Reachability/presence is discovery evidence, not proof of demand or qualification.

## Design and LIVE workflow

```text
verified prospect context
→ design brief / ChatGPT design workflow
→ DRAFT mock-up version
→ review
→ explicit Maak live
→ stable public prospect link
```

Current design entrypoint: `https://soliddesign-cms.pages.dev/start-design`.

Publishable inputs are standalone `.html` or a static-site `.zip` with root `index.html`. External HTTPS previews are DRAFT/review escape hatches only; new LIVE publication requires a canonical stored artifact.

Internal technical routes such as `/p/<prospect-id>/` and `/p/<prospect-id>/v/<demo-id>/` are not prospect-facing communication URLs.

A finite set of grandfathered historical LIVE records still uses a host/path-bounded compatibility path. Do not expand it; remove it when the historical count reaches zero.

## Printmailing workflow

The printmailing sits deliberately across two dossier phases without duplicating data:

```text
DESIGN
→ upload v1 / v2 / v3 ...
→ immutable private artifact

OUTREACH
→ select exact existing version
→ check/open file
→ Registreer als verstuurd
```

**Design** owns the versioned artifact because the mailing is designed output. Each new PDF/PNG/JPG upload creates a new immutable version; version numbers are derived from creation order and existing versions are never overwritten.

**Outreach** owns only the physical-send fact. Registering a send stores the exact `artifact_id`, the current LIVE `demo_id` and send time in the existing `mailings` record. This means the dossier can later prove exactly which paper artifact and website concept formed the proposition.

The same private Storage file is shown in both phases. There is no phase-specific copy, generic attachments table, approval workflow or separate document system.

PDF is recommended for the final print artifact. PNG/JPG are supported for concept/review use. Maximum size is 25 MB.

See `docs/decisions/20260830_PRINT_MAILING_ARTIFACTS.md`.

## Public prospect link

Current rollout:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final shape:

```text
https://<brand>.nl/<slug>
https://cms.<brand>.nl   # internal CMS
```

The slug is stable prospect state; full URLs are derived from configuration. PR previews derive their prospect links from the PR origin so acceptance remains on reviewed code.

See `docs/PROSPECT_PUBLIC_LINKS.md`.

## Outreach and engagement

Outreach combines the selected printmailing version and physical send with external opening count, first/last opening, active visible time, max scroll, broad device, QR/direct source and opening detail. Engagement is observational and never automatically creates a lead score.

Registering the physical send may advance only early contact states to `mailed`; it never regresses a prospect already further in the commercial process.

**Test als medewerker** uses a short-lived signed token bound to the prospect slug; internal QA traffic remains separate from prospect response. No IP allowlist or guessable internal marker is used.

Browser/persistence acceptance on 2026-08-30 verified EXTERNAL and INTERNAL openings plus active-time/scroll updates. See `docs/evidence/INTEGRATED_CMS_BROWSER_ACCEPTANCE_20260830.md`.

## Activity

Activity shows material business changes and the actor where known. Current state comes from canonical tables; `events` is history, not a second state model. Printmailing version creation and physical send are material events; opening/previewing a file is not. Routine UI navigation is not logged.

## Deployment verification

The same post-deploy HTTP smoke applies to PR previews and production. It verifies:

- CMS root;
- `app.js` uses `team_members.active` and contains no retired allowlist dependency;
- engagement client asset;
- canonical public route and noindex behavior;
- bounded legacy LIVE compatibility;
- CORS for browser-invoked Edge Functions.

Deployment upload success alone is not considered runtime acceptance.

## Access and security

The frontend uses only the Supabase publishable key. Privileged operations use narrow authenticated RPC/server capabilities with server-side role checks. Public prospect delivery exposes only the minimum resolver data and engagement capability needed for the public surface.

Printmailing artifacts live in a private Storage bucket. Active team membership is required to upload/read them; browser opening uses a short-lived signed URL. They are not prospect-facing public assets by default.

Do not expose service-role/secret credentials to this frontend. See `docs/SECURITY.md`.
