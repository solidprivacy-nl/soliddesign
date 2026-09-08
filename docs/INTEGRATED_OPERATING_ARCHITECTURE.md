# SolidDesign Integrated Operating Architecture

**Status:** current target production operating architecture  
**Date:** 2026-09-08

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

Reusable Sector Intelligence and research evidence are advisory inputs. They are not second workflow/state planes.

## System boundaries

### GitHub

Canonical for:

- source code;
- engineering documentation;
- reusable SolidDesign prompts/methods;
- published Sector Intelligence content;
- content history/diff/rollback.

GitHub is not the operational CRM/state plane.

### Cloudflare

Owns:

- the internal CMS runtime;
- server-side repository capabilities;
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

Prompt bodies and Sector Intelligence content are not duplicated into Supabase content tables.

## Two audiences, one system

```text
INTERNAL
soliddesign-cms.pages.dev
later optionally cms.<brand>.nl

PUBLIC
temporary: soliddesign-cms.pages.dev/prospect/<slug>
later:     <brand>.nl/<slug>
```

The brand/domain is delivery configuration. Prospect business identity is `prospects.public_slug`.

Authentication invitations/login flows belong to the internal origin. See `docs/AUTH_REDIRECTS.md`.

## Identity and governance

Durable application membership is `team_members` using the stable Supabase Auth UUID.

System roles:

```text
ADMIN
KEY_USER
USER
```

- Admin: governance and Admin/Key-user management; additionally owns operator Prompt Library mutations.
- Key user: operational coordination, normal User invitations and work distribution.
- User: normal prospect work.

There is no Owner application role and no separate Prompt Manager role.

Authorization remains:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical `operator_allowlist` is retired. Active `team_members` is the sole durable membership authority.

`team_members.display_name` is the primary human-readable work identity; email is account/login metadata.

Membership lifecycle:

```text
INVITED
→ ACTIVE
→ INACTIVE
```

Deactivation preserves history. Permanent deletion remains a narrow guarded Admin cleanup path for history-free mistaken/test accounts.

## Prospect responsibility

Current responsibility is explicit in `prospect_assignments`:

```text
CASE_LEAD   → Dossierhouder
DESIGN      → Design
OUTREACH    → Outreach & opvolging
```

One primary accountable person exists per responsibility/prospect. Assignment is current state; material history is in `events`. Assignment is not a read-security boundary in the current model.

## Prompt Library

SolidDesign centralizes reusable operator ChatGPT methods without creating a prompt-management platform.

Canonical operator prompt content:

```text
prompts/library/<slug>.md
```

System/design architecture prompts remain engineering-governed under the existing Bootstrap/core/workflow structure and are outside CMS mutation capability.

A library prompt contains:

```text
stable slug/filename
metadata
invocation contract
Markdown prompt body
```

The invocation contract is intentionally small:

```text
key
label
control = text | url | textarea
placeholder
required
```

No form builder, conditions, formulas, prompt database, favorites, usage analytics or approval workflow exists.

### Prompt roles

USER and KEY_USER may:

- see prompt title/category/description;
- see/fill invocation fields;
- copy a complete ChatGPT invocation.

They do not receive prompt body through the CMS management API and cannot mutate prompts.

ADMIN may additionally:

- retrieve operator prompt body;
- create/update/delete operator prompts.

Writes are server-authorized and can address only a validated slug under `prompts/library/`. Existing prompt updates/deletes use GitHub SHA optimistic concurrency.

Git is prompt version history; no second version model exists.

The stable prompt consumption URL uses the already proven Cloudflare static resource pattern:

```text
https://soliddesign-cms.pages.dev/prompts/library/<slug>.md
```

There is deliberately no custom `/prompt/<slug>` resolver.

### Prompt confidentiality truth

The guaranteed current boundary is:

> User/Key User cannot inspect prompt bodies through CMS management surfaces.

URL-delivered prompts are not claimed to be cryptographically secret from those operators: anything ChatGPT can anonymously fetch from a copied URL can in principle be fetched outside the CMS. A later private GitHub repository protects repository access but does not change that URL fact.

Strict prompt secrecy, if ever required, requires a future server-side AI execution boundary. It is not simulated with obscure URLs or user-agent checks.

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

### Research discovery

Research is the method; CSV is transport.

```text
CMS sector + location
→ canonical prospect-research invocation
→ ChatGPT evidence-backed research
→ CSV
→ contract validation
→ Normalized candidate rows
→ existing ingest
```

Durable provenance:

```text
discovery_runs.run_type = IMPORT
input.format = csv
input.method = prospect_research
prospects.discovery_source = research
```

One machine-readable contract is authoritative for the producer/consumer handoff:

```text
prompts/contracts/prospect-research-import-v1.json
```

The research prompt and importer both use it; CSV headers are not maintained independently in multiple places.

### Research versus deterministic evidence

Research evidence is stored under:

```text
qualification.research
```

The existing cheap system preflight remains under:

```text
qualification.triage
```

Research asks whether a company appears commercially/design-wise worth deeper work. Triage independently checks cheap directly observable site/delivery signals.

All qualification writers must preserve unrelated namespaces. Research, triage and full qualification may coexist without destructive overwrite.

### Discovery Inbox

One Inbox remains the human decision surface.

Research priority/rank drives ordering when research exists; deterministic triage remains supporting independent evidence and hard basis failures remain visible. Without research evidence, the existing deterministic verdict drives the grouping.

No persisted `candidate_priority` or combined triage score exists.

Human promotion is mandatory. Research rank, Overture presence and site-check results are evidence, not commercial authority.

Canonical detail: `docs/DISCOVERY.md`. Overture-specific query/source mechanics live only in `docs/DISCOVERY_OVERTURE.md`.

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

Research priority is discovery evidence. PDOS/WES/RDS/CPF remain experimental deeper evidence until enough real outreach outcomes support calibration. Do not create permanent parallel scoring state before that evidence gate.

## Sector Intelligence

Sector Intelligence is reusable reviewed design research for one canonical business sector.

```text
prospect
→ canonical_sector_key
→ current published Sector Intelligence
```

Discovery provenance and sector identity remain separate facts. A source may supply/resolve a known canonical sector; operators may explicitly correct it.

Sector Intelligence is advisory design evidence. Verified prospect facts and explicit prospect/operator direction outrank it. Missing Sector Intelligence never blocks design production.

The CMS owns research/review/linkage while repository mechanics remain hidden from normal operators.

Canonical contracts: `sector-intelligence/README.md` and `docs/SECTOR_INTELLIGENCE_LINKAGE.md`.

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

The finite historical compatibility path for grandfathered LIVE records remains transition debt and must not expand into a generic proxy.

A later domain cutover changes hostname/path routing, not prospect identity/data.

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

PDF is preferred final print format; PNG/JPG are supported. No generic document-management or print-vendor subsystem exists.

## Engagement

`prospect_visits` measures campaign response, not visitor identity.

Current signals remain bounded to prospect/demo, source, broad device, timestamps, active visible seconds and scroll depth.

No raw IP, IP hash, fingerprint, persistent visitor identity, heatmap or replay exists. Telemetry failure never blocks public delivery. Internal QA traffic remains distinguishable via short-lived server-signed staff tokens.

## Internal information architecture

Top-level navigation:

```text
Mijn werk
Prospects
Bedrijven zoeken
Prompts
Sectoronderzoek
Team        # Key user/Admin only where existing role policy applies
```

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

It does not own reusable sector-research state.

### Prompts

Owns reusable operator prompt discovery/invocation and Admin-only operator prompt management. It never becomes a ChatGPT execution engine.

### Sectoronderzoek

Owns reusable sector research, review and explicit prospect-sector linkage.

### Design

Owns website concepts and immutable printmailing design outputs. Reusable prompt invocation may prefill known prospect context but does not create parallel prompt state in the prospect record.

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

Do not manually maintain a second synchronized current-schema specification.

Research discovery adds only the `IMPORT` value to the existing discovery-run type constraint. No new discovery/prompt table is justified.

## Deployment topology

One Cloudflare Pages project remains:

```text
main        → production
pr-<n>      → isolated verification preview
```

The deploy workflow stages `prompts/` and `sector-intelligence/` into the same Operator artifact and smoke-tests the deployed runtime.

Prompt Library server writes use server-side repository credentials; credentials never reach browser code.

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
- strict prompt-secrecy facade over publicly readable URLs;
- generalized discovery provider framework;
- candidate/research-results tables;
- discovery agent/background crawler;
- autonomous promotion;
- PDOS columns/parallel permanent score model;
- AI job queue/server-side AI execution before measured need.

## Architecture invariants

1. One prospect is one dossier.
2. One Supabase operational state plane.
3. GitHub is canonical for reusable prompt/design-research content.
4. One canonical stored-artifact LIVE state for new publication.
5. System role and prospect responsibility are independent.
6. Active `team_members` is the sole durable membership authorization model.
7. Assignment is current responsibility; events are material history.
8. Material user actions are attributable.
9. Prompt system methods and Admin-managed operator prompts have separate governance.
10. User/Key User receive no prompt body through CMS management APIs.
11. Prompt Admin writes can address only `prompts/library/`.
12. Git history is prompt version history; no duplicate version state exists.
13. Static Cloudflare Markdown URLs are sufficient for current prompt consumption.
14. URL-based invocation does not claim strict prompt secrecy.
15. Discovery has concrete research, Overture and URL inputs without a provider platform.
16. CSV is transport; the candidate object/ingest is the domain boundary.
17. One research-import contract serves producer and consumer.
18. One Discovery Inbox remains the human selection surface.
19. Research and deterministic triage remain distinguishable evidence namespaces.
20. Qualification writes preserve unrelated evidence namespaces.
21. Human promotion remains mandatory.
22. Workflow `QUALIFIED` is not equivalent to a completed 0–25 score.
23. Existing commercial qualification remains canonical until outcome evidence justifies replacement.
24. Transitional compatibility/configuration must shrink after verified cutover.
25. Replaced code and documents are removed rather than kept as competing current truth.
26. No subsystem is added without an observed problem that justifies it.
27. Done means implementation + verification + cleanup + documentation alignment.
