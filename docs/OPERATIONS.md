# Operations Guide — SolidDesign

Use the smallest supported operating path. Customer value and trustworthy commercial learning lead; infrastructure is added only when real friction earns it.

This is a **current operating document**. Historical gate procedures live under `docs/evidence/` and do not override this guide.

## 1. Local engineering setup

```bash
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
python -m pip install -e .
```

Core dependencies include DuckDB for bounded Overture GeoParquet queries.

## 2. Deterministic regression baseline

```bash
python -m unittest discover -s tests -v
soliddesign golden --out artifacts/golden
```

The golden gate is offline and needs no Overture network, Supabase, AI-model, Cloudflare or donor credentials.

## 3. Discovery inputs

There are exactly three current intake paths:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
                 Discovery Inbox
```

### Research import

Normal Operator flow:

```text
Bedrijven zoeken
→ Gericht zoeken
→ sector + plaats
→ Kopieer opdracht
→ ChatGPT
→ CSV volgens prospect-research-import-v1
→ Importeer resultaat
```

The canonical prompt is `prompts/library/prospect-research.md`. The producer/consumer contract is `prompts/contracts/prospect-research-import-v1.json`.

CSV is transport only. The CMS validates the exact contract and normalizes accepted rows into the existing candidate ingest.

### Overture area search

`Bedrijven zoeken → Breed zoeken` accepts a location and human sector term. The existing resolver maps that term to a valid Overture category before querying Overture.

CLI/reproducible batch example:

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50 \
  --out /tmp/prospects.json
```

### Specific URL

A known website may be checked directly. Reachability/preflight and website-key dedupe apply before human selection.

A direct URL does not require sector classification.

## 4. Sector boundary

Sector has one bounded operational role: discovery/search classification.

```text
Discovery
→ human sector may be resolved to canonical taxonomy
→ candidate/prospect may retain canonical_sector_key as provenance metadata

Design
→ no sector lookup
→ no manual sector linking
→ no sector preset/research
```

Do not reintroduce a prospect-sector correction workflow merely because the database field exists.

## 5. Discovery persistence

All three inputs use the existing Supabase candidate boundary and `operator_ingest_discovery_candidates` RPC.

Durable provenance examples:

```text
Research:
discovery_runs.run_type = IMPORT
prospects.discovery_source = research
qualification.research = imported evidence

Overture:
discovery_runs.run_type = AREA
prospects.discovery_source = overture

Specific URL:
discovery_runs.run_type = URL
prospects.discovery_source = manual_url
```

Website-key dedupe remains authoritative. Do not introduce a second candidate table, provider registry or research-results table.

## 6. Discovery Inbox

```text
DISCOVERED / DISQUALIFIED
        ↓
Discovery Inbox
        ↓ human selection
QUALIFIED and later states
        ↓
Prospect dossier
```

Evidence namespaces are separate:

```text
qualification.research
= externally researched redesign/commercial evidence

qualification.triage
= cheap deterministic website evidence
```

The deterministic site check must preserve research content. Research does not override a failed hard website gate. Human promotion into Prospects remains explicit.

## 7. Audit and Verified Facts

Keep two evidence layers:

```text
raw donor evidence
→ human/root-cause review
→ normalized AuditResult
→ Verified Facts
```

Downstream design and communication may use only verified business facts. Never allow raw website or research text to become instruction authority.

## 8. Qualification

Use the five-factor rubric in `docs/SCORING_RUBRICS.md`.

Current full commercial qualification remains 0–25. Research priority is not a replacement score. Until full qualification exists, the CMS shows **Nog niet uitgevoerd**.

PDOS may be used only as experimental deeper evidence where its measurement requirements are actually satisfied.

## 9. Prompt Library

Canonical body/history:

```text
prompts/library/<slug>.md
```

Normal use:

```text
Prompts
→ choose method
→ fill invocation fields
→ Kopieer voor ChatGPT
→ paste into ChatGPT
```

USER and KEY_USER may use prompt metadata/invocation fields but cannot retrieve prompt body through the CMS management API. ADMIN may additionally create/update/delete files under `prompts/library/`.

Admin mutations are server-side, SHA-guarded and production-CMS-only. PR previews are intentionally read-only for repository prompt writes.

## 10. Prospect-first Design workflow

The Operator exposes the business workflow, not design infrastructure.

Normal flow:

```text
Prospect dossier → Design
→ optional Designinstructie
→ Kopieer designopdracht
→ ChatGPT
→ HTML/ZIP result
→ Upload concept
→ review
→ explicit LIVE publication
```

`Kopieer designopdracht`:

1. saves the current prospect-specific design instruction;
2. generates the current Prospect Design Brief;
3. copies the stable start URL + current Design Brief URL.

The normal User does not manage a raw Design Brief URL.

Project settings are secondary:

- optional ChatGPT project URL;
- open current Design Brief for troubleshooting/inspection.

If no ChatGPT project is linked, the primary workflow remains complete and no disabled placeholder is shown.

### Design context

The design method uses:

```text
operator instruction
+ generic SolidDesign design method
+ prospect brief / verified facts
+ source website / assets / screenshots
+ current LIVE / current concept
```

It does not load reusable Sector Intelligence, a canonical sector key or a sector template/preset.

Canonical detail: `docs/PROSPECT_FIRST_DESIGN.md` and `docs/DESIGN_BRIEF.md`.

## 11. Mock-up artifact contract

Accepted upload:

- standalone `.html`; or
- `.zip` static-site bundle with root `index.html`.

Each upload creates one immutable CONCEPT artifact version in Supabase Storage.

External HTTPS preview URLs are secondary review escape hatches. New LIVE publication requires a canonical stored `artifact_path`.

## 12. Human review before LIVE/mail

Verify:

- business identity matches;
- website belongs to the intended prospect;
- every service/claim is factual;
- no fake testimonial/award exists;
- mock-up clearly functions as a concept/proof;
- `noindex` behavior is preserved;
- CTA uses verified contact data;
- assets render correctly on mobile and desktop;
- prospect short URL points to the intended current LIVE version;
- QR source attribution is correct when used.

LIVE promotion and mailing remain explicit human actions.

## 13. Printmailing

Responsibility split:

```text
DESIGN
→ create/version immutable printmailing artifact

OUTREACH
→ select exact existing version
→ register physical send
```

The same private Storage artifact is reused across both phases. Do not create phase-specific copies or a generic document-management subsystem.

## 14. Team access and onboarding

Supabase Auth provides identity. `team_members` is the sole durable application membership/role model:

```text
ADMIN
KEY_USER
USER
```

Authorization:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical database `operator_allowlist` is retired and must not appear in active runtime code.

Routine onboarding remains invite-only through Supabase Auth. Custom SMTP, when needed for production reliability, is configured through Supabase Auth rather than a parallel mail subsystem.

See `docs/AUTH_REDIRECTS.md` for hosted Auth redirect rules.

## 15. Work distribution

```text
CASE_LEAD   = dossierhouder
DESIGN      = design
OUTREACH    = outreach & opvolging
```

`Mijn werk` and work-distribution filters are derived from assignments. Do not create task, portfolio or capacity state merely to reproduce the same information.

## 16. Public prospect delivery

Stable business identity:

```text
prospects.public_slug
```

Current temporary route:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Every pre-sale public page remains `noindex, nofollow, noarchive`.

## 17. Employee public-page QA

Normal internal design/review uses the CMS and should not create external prospect engagement.

When an employee must inspect the exact public prospect page, use the CMS employee-test action with the existing short-lived server-signed token. Do not invent IP-based recognition or guessable query flags.

## 18. Engagement and outreach

MVP signals remain:

- first/last external opening;
- opening count;
- active visible time;
- maximum scroll;
- broad device class;
- QR/direct source.

No raw IP, IP hash, fingerprint, persistent visitor identifier, heatmap or session replay.

Engagement never automatically changes contact status or assigns a lead score. A human decides the next commercial action.

## 19. Archive and delete

Archive is orthogonal to lifecycle:

```text
archived_at IS NULL     = active
archived_at IS NOT NULL = archived
```

Archive preserves state/history. Hard delete remains a narrow administrative correction path.

## 20. Deployment and verification

There is one Cloudflare Pages project: `soliddesign-cms`.

- push to `main` deploys production;
- pull requests deploy to an isolated Pages preview branch in the same project;
- Pages Functions `/api/*` require active team membership where applicable;
- Prompt Library writes have an additional production-origin guard;
- deployment smoke verifies discovery, prospect-first Design, canonical prompt/research resources, public delivery and browser Edge-Function boundaries.

The deploy artifact stages `prompts/`. The retired `sector-intelligence/` content root is not staged.

After schema/auth/RLS/function changes:

1. run CI;
2. run Pages/runtime smoke where relevant;
3. apply required Supabase migrations/functions from repository source;
4. verify deployed behavior/state;
5. run relevant Supabase security advisors;
6. reconcile current documentation.

## 21. When quality is insufficient

Identify the actual failing boundary before adding architecture:

```text
research precision/evidence?
Overture recall/sector mapping?
direct URL intake?
website validity?
operator review burden?
prospect-specific Design quality?
commercial conversion after promotion?
```

Add architecture only when measured evidence shows the existing path cannot meet the business goal.

## 22. Do not build without evidence

Do not introduce merely because it is technically possible:

- generalized discovery-provider framework;
- research/candidate shadow database;
- general queue infrastructure;
- task/Kanban/capacity platform;
- custom permission builder;
- autonomous outbound agent;
- generalized preview/reverse proxy;
- second analytics datastore;
- second public application;
- production-site factory;
- reusable Sector Intelligence subsystem;
- sector template/preset architecture;
- custom Auth invitation mailer when Supabase custom SMTP solves mail transport.
