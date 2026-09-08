# SolidDesign Integrated Operating Architecture

**Status:** current target production operating architecture  
**Date:** 2026-09-09

## Objective

Operate SolidDesign as one small multi-user commercial work system while continuously reducing duplicate method, state and workflow.

The system remains:

- one application;
- one Cloudflare Pages project/deployment topology;
- one Supabase operational state plane;
- one prospect dossier/workflow;
- one Discovery Inbox;
- one canonical mock-up storage/LIVE lifecycle;
- GitHub-governed reusable method/content;
- explicit human control;
- minimal state and dependencies.

Core commercial loop:

```text
TEAM
  ↓
RESPONSIBILITY
  ↓
DISCOVERY
  ↓
PROSPECT DOSSIER
  ↓
DESIGN
  ↓
PUBLIC DELIVERY + PRINTMAILING
  ↓
ENGAGEMENT
  ↓
OUTREACH
  ↓
OUTCOME
  ↓
LEARNING
```

Research evidence may inform discovery. Design is prospect-first and is not driven by reusable sector research.

## System boundaries

### GitHub

Canonical for:

- source code;
- engineering documentation;
- reusable SolidDesign prompts/methods;
- content history/diff/rollback.

GitHub is not the operational CRM/state plane.

### Cloudflare

Owns:

- the internal CMS runtime;
- server-side repository capabilities where currently required;
- stable prompt/design-method consumption URLs;
- public prospect delivery.

Repository paths, branches and tokens are implementation details and do not become normal operator concepts.

### Supabase

Remains the one operational business-state plane:

- team membership;
- responsibilities;
- prospects/discovery runs;
- qualification/evidence state;
- audits;
- demos;
- mailings;
- engagement;
- events.

Prompt bodies are not duplicated into Supabase content tables.

## Identity and governance

Durable application membership is `team_members` using the stable Supabase Auth UUID.

System roles:

```text
ADMIN
KEY_USER
USER
```

- Admin: governance, Admin/Key-user management and operator Prompt Library mutations.
- Key user: operational coordination, normal User invitations and work distribution.
- User: normal prospect work.

Authorization remains:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` is retired. Active `team_members` is the sole durable membership authority.

## Prospect responsibility

Current responsibility is explicit in `prospect_assignments`:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary accountable person exists per responsibility/prospect. Assignment is current state; material history is in `events`.

## Prompt Library

SolidDesign centralizes reusable operator ChatGPT methods without creating a prompt-management platform.

Canonical operator prompt content:

```text
prompts/library/<slug>.md
```

System/design architecture prompts remain engineering-governed under the Bootstrap/core/workflow structure and are outside CMS mutation capability.

USER and KEY_USER may see prompt metadata/invocation fields and copy a complete invocation. They do not receive prompt body through CMS management APIs and cannot mutate prompts. ADMIN may additionally retrieve/create/update/delete operator prompts.

Git is prompt version history; no second version model exists.

Canonical detail: `docs/PROMPT_LIBRARY.md`.

## Discovery

Discovery is source-agnostic at the business boundary without introducing a provider framework.

Current concrete intake paths are exactly:

```text
RESEARCH IMPORT
OVERTURE AREA SEARCH
SPECIFIC URL
```

All three normalize into the existing candidate/prospect ingest and then the same Discovery Inbox.

Canonical flow:

```text
Research | Overture | URL
          ↓
validated candidate
          ↓
existing Supabase ingest/dedupe
          ↓
deterministic website preflight
          ↓
Discovery Inbox
          ↓
human promote / reject
```

Do not introduce a ProviderRegistry, candidate table, research-results table or second Inbox.

### Sector in Discovery

Sector is a search/classification concern only.

- `Gericht zoeken` uses human sector + location as market scope for research.
- `Breed zoeken` resolves human sector terms to valid Overture taxonomy when required.
- `canonical_sector_key` may remain on candidates/prospects as discovery/provenance metadata when a validated key naturally exists.
- a direct-URL prospect may have no canonical sector key.

There is no operator workflow to assign a sector for design, and no design process may use `canonical_sector_key` as a lookup or design instruction.

Canonical sector-resolution detail: `docs/DISCOVERY_SECTOR_RESOLUTION.md`.

### Research discovery

Research is the method; CSV is transport.

```text
CMS sector + location
→ canonical prospect-research invocation
→ ChatGPT evidence-backed research
→ CSV
→ contract validation
→ normalized candidate rows
→ existing ingest
```

One machine-readable contract is authoritative for producer/consumer handoff:

```text
prompts/contracts/prospect-research-import-v1.json
```

Research evidence is stored under `qualification.research`; deterministic intake evidence remains under `qualification.triage`. Writers must preserve unrelated namespaces.

### Discovery Inbox

One Inbox remains the human decision surface. Human promotion is mandatory. Research rank, Overture presence and site-check results are evidence, not commercial authority.

Canonical detail: `docs/DISCOVERY.md`.

## Qualification

Workflow state and full commercial qualification remain distinct.

`QUALIFIED` workflow state means a human selected a candidate into active prospect work. It does not imply the five-factor score has already been performed.

Until full qualification exists, the CMS displays `Nog niet uitgevoerd` rather than an ambiguous `— / 25`.

The current five-factor 0–25 commercial qualification remains current during the operational pilot:

- Customer Economics;
- Existing Demand;
- Conversion Opportunity;
- Execution Fit;
- Competitive Context.

Research priority is discovery evidence. PDOS/WES/RDS/CPF remain experimental deeper evidence until enough real outreach outcomes support calibration.

## Prospect-first Design

Design starts at the individual prospect, not at a sector abstraction.

Hard boundary:

```text
DISCOVERY
sector may help find/classify a business
        ↓
PROSPECT
        ↓
DESIGN
sector no longer participates
```

Canonical design context is:

```text
current user/operator instruction
+ SolidDesign design method
+ Prospect Design Brief / verified facts
+ source website / assets / screenshots
+ current LIVE / current concept
+ other relevant evidence
```

No Design runtime, Design Brief or Bootstrap path may:

- load reusable Sector Intelligence;
- resolve or require a canonical sector key;
- select a sector for design;
- apply a category template/preset;
- offer a separate sector-improvement prompt.

A prospect with no canonical sector key must complete the same Design workflow normally.

Canonical detail: `docs/PROSPECT_FIRST_DESIGN.md` and `docs/DESIGN_BRIEF.md`.

### Design tab UX

The Design tab exposes the operator workflow, not the implementation machinery.

Primary sequence:

```text
1. Kopieer designopdracht
2. Werk in ChatGPT
3. Upload resultaat
```

`Kopieer designopdracht` saves the prospect-specific design instruction, publishes the current Design Brief and copies the stable start URL + Design Brief URL.

Occasional project controls such as a ChatGPT project URL and opening the raw/current Design Brief stay behind progressive disclosure.

### Website design versions

Canonical lifecycle:

```text
upload HTML/ZIP
→ CONCEPT
→ inspect
→ publish LIVE
```

External concept links are review escape hatches, not a second production path.

## Public delivery

Canonical temporary route:

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

New LIVE publication requires `artifact_path`. External HTTPS preview links are DRAFT/review escape hatches and cannot become newly LIVE.

## Printmailing artifacts

Designed output and physical send remain separate facts:

```text
DESIGN
→ immutable mailing_artifacts versions

OUTREACH
→ selects exact artifact
→ records physical send in mailings
```

The same stored artifact may be surfaced in Design and Outreach but is never duplicated into separate phase state.

## Engagement

`prospect_visits` measures campaign response, not visitor identity.

Current signals remain bounded to prospect/demo, source, broad device, timestamps, active visible seconds and scroll depth.

No raw IP, IP hash, fingerprint, persistent visitor identity, heatmap or replay exists. Telemetry failure never blocks public delivery.

## Internal information architecture

Top-level navigation:

```text
Mijn werk
Prospects
Bedrijven zoeken
Prompts
Team
```

There is no `Sectoronderzoek` workspace.

Prospect dossier:

```text
Overzicht | Design | Outreach | Activiteit
```

### Bedrijven zoeken

Owns:

- research invocation + research CSV import;
- Overture broad search;
- direct URL intake;
- the one Discovery Inbox;
- recent discovery runs.

### Prompts

Owns reusable operator prompt discovery/invocation and Admin-only operator prompt management. It never becomes a ChatGPT execution engine.

### Design

Owns:

- the prospect-specific ChatGPT handoff;
- website concept/version lifecycle;
- immutable printmailing design outputs.

### Outreach

Owns mailing send, engagement interpretation, next action/contact and outcome.

## Database evolution

Current database state is:

```text
supabase/schema.sql       # historical/bootstrap baseline
        ↓
supabase/migrations/*     # ordered canonical evolution
        ↓
production database
```

Historical migrations are not rewritten to hide past architecture.

The prospect-first cutover retains `canonical_sector_key` as legitimate discovery/provenance data but removes unused design-side linking RPCs through a forward retirement migration.

## Deployment topology

One Cloudflare Pages project remains:

```text
main        → production
pr-<n>      → isolated verification preview
```

The deploy workflow stages `prompts/` into the Operator artifact. The retired `sector-intelligence/` content root is no longer staged or smoke-tested.

## Explicit non-goals

Do not add without observed need:

- task engine / Kanban / capacity planner;
- second CRM/state plane;
- generic attachment system;
- custom permission builder;
- separate analytics datastore;
- visitor fingerprinting;
- automated lead scoring;
- marketing automation;
- generalized reverse proxy;
- prompt database/version database;
- prompt marketplace/favorites/usage analytics;
- Prompt Manager role;
- generic prompt/form builder;
- generalized discovery provider framework;
- candidate/research-results tables;
- discovery agent/background crawler;
- autonomous promotion;
- PDOS columns/parallel permanent score model;
- sector design templates/overlays;
- reusable Sector Intelligence subsystem;
- AI job queue/server-side AI execution before measured need.

## Architecture invariants

1. One prospect is one dossier.
2. One Supabase operational state plane.
3. GitHub is canonical for reusable prompt/design-method content.
4. One canonical stored-artifact LIVE state for new publication.
5. Active `team_members` is the sole durable membership authorization model.
6. Assignment is current responsibility; events are material history.
7. Prompt system methods and Admin-managed operator prompts have separate governance.
8. User/Key User receive no prompt body through CMS management APIs.
9. Discovery has concrete research, Overture and URL inputs without a provider platform.
10. CSV is transport; the candidate object/ingest is the domain boundary.
11. One Discovery Inbox remains the human selection surface.
12. Research and deterministic triage remain distinguishable evidence namespaces.
13. Human promotion remains mandatory.
14. Workflow `QUALIFIED` is not equivalent to a completed 0–25 score.
15. Existing commercial qualification remains canonical until outcome evidence justifies replacement.
16. Sector may participate in Discovery but never determines prospect Design.
17. Design Brief and Design Bootstrap are sector-independent.
18. There is one primary ChatGPT action in the prospect Design workflow.
19. Transitional compatibility/configuration must shrink after verified cutover.
20. Replaced code and documents are removed rather than kept as competing current truth.
21. No subsystem is added without an observed problem that justifies it.
22. Done means business outcome + implementation + verification + cleanup + documentation alignment.
