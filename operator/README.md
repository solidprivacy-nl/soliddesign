# SolidDesign Operator

Small internal multi-user workspace for the human prospect, design and outreach workflow.

The canonical system model is `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`. Documentation precedence is defined in `docs/ARCHITECTURE.md`.

## Product boundary

SolidDesign Operator remains deliberately narrow. It supports:

- **Mijn werk** — personal work derived from current prospect responsibilities;
- **Prospects** — shared prospect register and dossiers;
- **Bedrijven zoeken** — research import, Overture area search and specific URL intake into one Discovery Inbox;
- **Prompts** — reusable operator ChatGPT methods with small per-run invocation fields;
- **Team** — invite, role/status and work-distribution view for Key users/Admins;
- per-prospect **Overzicht / Design / Outreach / Activiteit**;
- prospect-specific ChatGPT design handoff;
- immutable website mock-up versions with explicit LIVE promotion;
- immutable printmailing versions with exact physical-send attribution;
- stable public prospect links;
- minimal prospect engagement in Outreach;
- actor-aware dossier history.

It is explicitly not a general CRM, website builder, prompt platform, document-management system, task engine, workflow platform, HR system, capacity planner or analytics suite.

## One dossier, phase responsibilities

A prospect is the dossier. Current responsibility is stored separately from user role:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary assignee exists per responsibility. **Mijn werk** is derived from these assignments; no task/portfolio table exists.

## Roles and human identity

Application roles are:

```text
ADMIN
KEY_USER
USER
```

- **Admin** — governance, team lifecycle/role changes and operator Prompt Library administration.
- **Key user** — operational coordination, User invitations and User management.
- **User** — normal prospect/design/outreach work.

There is deliberately no Owner/Eigenaar or Prompt Manager role.

`team_members.display_name` is the primary visible identity. E-mail is secondary account/login metadata.

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

Authorization is one model only:

```text
Supabase Auth UUID
→ team_members.active
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` is retired. Do not recreate a parallel membership gate.

## Discovery workflow

Discovery has exactly three current intake paths and one human decision surface:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
             deterministic site check
                       ↓
                 Discovery Inbox
                       ↓
                 human selection
```

Research uses the canonical `prospect-research` Prompt Library method and `prompts/contracts/prospect-research-import-v1.json`. Accepted evidence is stored under `qualification.research`.

The existing cheap website preflight remains under `qualification.triage`. The two evidence namespaces are merge-safe and neither is a commercial qualification by itself.

Sector is a discovery input only. `Gericht zoeken` uses sector + location as research scope; `Breed zoeken` resolves the human sector term to a valid Overture category. `canonical_sector_key` may persist as discovery/provenance metadata when naturally known. A direct-URL prospect does not need one.

A candidate becomes active prospect work only after explicit human promotion. Missing full commercial qualification is shown as **Nog niet uitgevoerd**, not as an implied score.

Canonical details: `docs/DISCOVERY.md`.

## Prompt Library

Reusable operator methods live in GitHub:

```text
prompts/library/<slug>.md
```

The CMS **Prompts** page reads metadata and invocation fields. USER and KEY_USER may fill/copy invocations. ADMIN may additionally read/edit the prompt body and create/update/delete operator prompts.

No prompt body/version table exists in Supabase. Git remains history and rollback.

Repository writes are narrow and server-side. PR previews cannot mutate GitHub `main` through the Prompt Library.

Canonical details: `docs/PROMPT_LIBRARY.md`.

## Prospect-first Design workflow

The Design tab is intentionally expressed as an operator task rather than prompt/sector machinery.

Primary flow:

```text
1. Kopieer designopdracht
2. Werk in ChatGPT
3. Upload resultaat
```

### Websiteontwerp

The normal User sees:

- optional **Designinstructie**;
- one primary **Kopieer designopdracht** action;
- **Open ChatGPT-project ↗** only when a project URL exists;
- **Projectinstellingen** behind progressive disclosure.

`Kopieer designopdracht` saves the prospect-specific instruction, generates the current Prospect Design Brief and copies the stable start URL + current Design Brief URL. The operator does not manage a raw brief URL in the normal flow.

Sector/category state does not determine design. There is no `Sector voor design`, Sector Intelligence lookup, sector improvement prompt or sector template/preset.

Current design entrypoint: `https://soliddesign-cms.pages.dev/start-design`.

Canonical design contract: `docs/PROSPECT_FIRST_DESIGN.md` and `docs/DESIGN_BRIEF.md`.

### Website versions and LIVE

```text
verified prospect context
→ ChatGPT design workflow
→ CONCEPT mock-up version
→ review
→ explicit Publiceer live
→ stable public prospect link
```

Publishable inputs are standalone `.html` or a static-site `.zip` with root `index.html`. External HTTPS previews are secondary review escape hatches behind progressive disclosure; new LIVE publication requires a canonical stored artifact.

Internal technical routes are not prospect-facing communication URLs.

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

**Design** owns the versioned artifact because the mailing is designed output. **Outreach** owns only the physical-send fact.

The same private Storage file is shown in both phases. There is no phase-specific copy, generic attachments table, approval workflow or separate document system.

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

The slug is stable prospect state; full URLs are derived from configuration.

See `docs/PROSPECT_PUBLIC_LINKS.md`.

## Outreach and engagement

Outreach combines the selected printmailing version and physical send with external opening count, first/last opening, active visible time, max scroll, broad device, QR/direct source and opening detail. Engagement is observational and never automatically creates a lead score.

**Test als medewerker** uses a short-lived signed token bound to the prospect slug; internal QA traffic remains separate from prospect response. No IP allowlist or guessable internal marker is used.

## Activity

Activity shows material business changes and the actor where known. Current state comes from canonical tables; `events` is history, not a second state model. Routine UI navigation is not logged.

## Deployment verification

The same post-deploy HTTP smoke applies to PR previews and production. It verifies:

- CMS root and active-team bootstrap;
- discovery UX and sector resolver;
- prospect-first Design UI and Bootstrap/Brief boundary;
- canonical Prompt Library and research-contract resources;
- PR-preview Prompt Library mutation rejection;
- engagement client asset;
- canonical public route and noindex behavior;
- bounded legacy LIVE compatibility;
- CORS for browser-invoked Edge Functions.

Deployment upload success alone is not runtime acceptance.

## Access and security

The frontend uses only the Supabase publishable key. Privileged operations use narrow authenticated RPC/server capabilities with server-side role checks. Public prospect delivery exposes only the minimum resolver data and engagement capability needed for the public surface.

Research CSV and AI output are untrusted input and must pass the versioned import contract before persistence. Imported research never automatically promotes a prospect, publishes a design or sends outreach.

Printmailing artifacts live in a private Storage bucket. Active team membership is required to upload/read them; browser opening uses a short-lived signed URL.

Do not expose service-role, GitHub-write or other secret credentials to browser code. See `docs/SECURITY.md`.
