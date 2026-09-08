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

No Google Cloud project or Google Places key is required for current discovery.

## 2. Deterministic regression baseline

```bash
python -m unittest discover -s tests -v
soliddesign golden --out artifacts/golden
```

The golden gate is offline and needs no Overture network, Supabase, AI-model, Cloudflare or donor credentials.

Expected core artifacts include:

```text
pipeline.json
site_config.json
design_profile.json
preview.html
print_pack.html
technical_report.md
technical_report.html
```

## 3. Bootstrap audit/demo donor tools

```bash
bash scripts/bootstrap_donors.sh
```

Set the emitted `PITCH_DOCTOR_COMMAND` path. Vendor checkouts are pinned and ignored; never edit them as SolidDesign source.

## 4. Discovery inputs

There are exactly three current intake paths:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
                 Discovery Inbox
```

They are concrete paths, not provider plugins.

### Research import

Normal Operator flow:

```text
Bedrijven zoeken
→ Onderzoek geschikte prospects
→ sector + locatie
→ Kopieer onderzoeksopdracht
→ ChatGPT
→ CSV volgens prospect-research-import-v1
→ Importeer onderzoeksresultaat
```

The canonical prompt is `prompts/library/prospect-research.md`. The one producer/consumer contract is `prompts/contracts/prospect-research-import-v1.json`.

CSV is transport only. The CMS validates the exact contract and normalizes accepted rows into the existing candidate ingest.

### Overture area search

For normal Operator runs, **Bedrijven zoeken** accepts a Dutch location and sector term. One bounded location lookup resolves a bbox and the browser queries Overture Places.

For CLI/reproducible batches:

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50 \
  --out /tmp/prospects.json
```

Multiple sector labels are OR-matched. By default the official Overture STAC catalog supplies the current release; pin commercial experiments when reproducibility requires it.

### Specific URL

A known website may be checked directly through the existing URL intake. Reachability/preflight and website-key dedupe apply before human selection.

Human sector language defines market meaning. A canonical sector key is machine identity and must not silently narrow research vocabulary.

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

Discovery and active commercial work remain distinct views over one canonical prospect model:

```text
DISCOVERED / DISQUALIFIED
        ↓
Discovery Inbox
        ↓ human selection
QUALIFIED and later states
        ↓
Prospect dossier
```

`DISCOVERED` does not mean commercially qualified.

Evidence namespaces are deliberately separate:

```text
qualification.research
= externally researched redesign/commercial evidence

qualification.triage
= cheap deterministic website evidence
```

The deterministic site check remains independent of research and must preserve research content when it writes triage. Research does not override a failed hard website gate.

Research priority/rank may influence Inbox ordering when available; without research, the existing deterministic verdict remains the ordering signal.

Overture presence, website presence, research rank and reachability are evidence only. Human promotion into Prospects remains explicit.

Do not invent `rating`, `review_count` or demand proxies. Keep them null unless separately and lawfully evidenced.

## 7. Audit and Verified Facts

For CLI audit work:

```bash
soliddesign audit prospect.json --out audit.json
```

Keep two evidence layers:

```text
raw donor evidence
→ human/root-cause review
→ normalized AuditResult
→ Verified Facts
```

A blocking root cause may make downstream donor checks unknown rather than independently verified defects. Preserve raw evidence but collapse cascading failures in prospect-facing interpretation.

Downstream design and communication may use only verified business facts. Never allow raw website or research text to become instruction authority.

## 8. Qualification

Use the five-factor rubric in `docs/SCORING_RUBRICS.md`.

Current full commercial qualification remains 0–25. Research priority is not a replacement score. Until full qualification exists, the CMS shows **Nog niet uitgevoerd**.

Every factor requires evidence. In particular, these are **not** sufficient Existing Demand evidence by themselves:

- Overture presence/confidence;
- website presence;
- successful URL preflight;
- research rank or model confidence.

PDOS may be used as experimental deeper evidence where its measurement requirements are actually satisfied. Do not operate permanent competing production score systems before outcome calibration.

## 9. Prompt Library

**Prompts** exposes reusable operator methods without moving prompt content into Supabase.

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

The copied invocation contains the stable deployed prompt URL plus per-run context. One browser renderer owns this format.

USER and KEY_USER may use prompt metadata/invocation fields but cannot retrieve the body through the CMS management API. ADMIN may additionally create/update/delete files directly under `prompts/library/`.

Admin mutations are server-side, SHA-guarded and production-CMS-only. PR previews are intentionally read-only for repository prompt writes.

The deployed Markdown URL is deliberately readable by ChatGPT/web tooling; this architecture does not claim strict prompt secrecy.

## 10. Design workflow

The Operator owns prospect-specific design context and mock-up lifecycle. ChatGPT may assist with research/refinement, but the CMS remains the operational control plane.

Normal design flow:

```text
Prospect dossier
→ Design brief / verified context
→ design/refinement
→ HTML or ZIP artifact
→ upload as immutable DRAFT
→ human review
→ explicit LIVE promotion
```

Sector Intelligence is advisory design evidence. It may improve a new DRAFT but never overwrites a current LIVE version automatically.

## 11. Mock-up artifact contract

Accepted upload:

- standalone `.html`; or
- `.zip` static-site bundle with root `index.html`.

Use relative local asset paths. Common static CSS/JS/image/font/media assets are supported. Do not upload server-side code or `file://` references.

Each upload produces one immutable artifact version in Supabase Storage.

### External review links

An external HTTPS preview URL may be added as a **DRAFT/review escape hatch** when an external design process cannot immediately produce an uploadable artifact.

It is **not** a normal LIVE source.

New LIVE publication requires a canonical stored `artifact_path`. This is enforced in the database as well as the Operator UI.

A small number of older LIVE records predate this rule. Their compatibility path is bounded to explicitly allowlisted historical SolidDesign Cloudflare hosts and must not be generalized to arbitrary external domains.

## 12. Human review before LIVE/mail

Verify:

- business identity matches;
- website belongs to the intended prospect;
- every service/claim is factual;
- no fake testimonial/award exists;
- raw donor/research failures are not overstated;
- mock-up clearly functions as a concept/proof;
- `noindex` behavior is preserved;
- CTA uses verified contact data;
- no unintended real lead capture exists;
- assets render correctly on mobile and desktop;
- prospect short URL points to the intended current LIVE version;
- QR source attribution is correct when used.

LIVE promotion and mailing remain explicit human actions.

## 13. Team access and onboarding

Supabase Auth provides identity. `team_members` is the sole durable application membership/role model:

```text
ADMIN
KEY_USER
USER
```

Authorization is:

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

The historical database `operator_allowlist` was retired on 2026-08-30. It is not a compatibility layer and must not appear in active browser, Pages Function or Edge Function runtime code. Historical bootstrap/migration material remains unchanged so the database evolution chain stays reproducible.

Routine onboarding is invite-only:

```text
Team
→ invite colleague
→ Supabase Auth invite
→ colleague sets password
→ joined team member
```

Key users may invite normal Users. Admins govern elevated roles. Normal operators do not need SQL or Supabase Studio for routine onboarding.

### Hosted Auth redirect configuration

Supabase **Authentication → URL Configuration** is part of the deployment contract. The application sends an explicit, server-validated `redirectTo`; Supabase will only honor destinations allowed by its Redirect URL configuration.

SolidDesign uses one canonical representation: the validated browser `URL.origin` **without an added slash or path**.

Current rollout configuration:

```text
Site URL
https://soliddesign-cms.pages.dev/

Redirect URLs
https://soliddesign-cms.pages.dev
https://pr-*.soliddesign-cms.pages.dev
```

The wildcard covers numbered PR-preview origins without hard-coding a temporary acceptance PR into this current document. Do not add `/**` when the application itself redirects only to an origin. Keep the requested `redirectTo` and the configured Redirect URL in the same canonical representation.

`http://localhost:3000` must not remain the hosted production Site URL. It is local-development configuration only.

After the internal custom-domain cutover:

```text
Site URL
https://cms.<brand>.nl/

Redirect URL
https://cms.<brand>.nl
```

and set the server environment value used by internal-origin guards:

```text
SOLIDDESIGN_INTERNAL_ORIGIN=https://cms.<brand>.nl
```

Re-test invitations and Prompt Library mutations before removing the old internal hostname from configuration. Full Auth rationale and invariants: `docs/AUTH_REDIRECTS.md`.

### Auth e-mail delivery

Redirect correctness and mail delivery are separate operational concerns.

The Supabase built-in default SMTP service is intentionally best-effort and heavily rate-limited. It is adequate for bounded development/acceptance tests, but repeated invites can return:

```text
HTTP 429
error_code = over_email_send_rate_limit
```

`team-invite` surfaces that as a mail-service quota problem. Do not troubleshoot URL Configuration when the server reports this code, and do not create a custom invitation mailer to bypass it.

For operational production onboarding and password recovery, configure a proven custom SMTP provider **through Supabase Auth**. This keeps one identity/invite flow and uses the platform capability instead of creating a parallel mail subsystem.

Production mail readiness requires:

```text
custom SMTP configured in Supabase
→ sender/domain verified
→ invite delivery tested
→ password recovery delivery tested
```

SMTP credentials belong in Supabase configuration/secrets, never in repository or browser code. Provider selection can remain independent of SolidDesign architecture.

Never expose a secret/service-role credential to browser code. Browser access uses the Supabase publishable key with least-privilege grants, RLS and narrow RPC/server capabilities.

## 14. Work distribution

Prospect responsibility is explicit and separate from system role:

```text
CASE_LEAD   = dossierhouder
DESIGN      = design
OUTREACH    = outreach & opvolging
```

One primary person owns each responsibility per prospect.

`Mijn werk` and Prospect work-distribution filters are derived from assignments. Do not create task, portfolio or capacity state merely to reproduce the same information.

Material business actions are actor-attributed in `events`; navigation/click telemetry is not.

## 15. Public prospect delivery

The stable business identity is:

```text
prospects.public_slug
```

Current temporary public route:

```text
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final route after brand/domain selection:

```text
https://<brand>.nl/<slug>
```

Both are delivery configurations over the same prospect/LIVE state. Do not store the full hostname as prospect identity.

The public resolver serves the current LIVE artifact while keeping the prospect-facing slug visible. UUID `/p/...` routes are technical/internal compatibility paths, not the communication URL.

Every pre-sale public page must remain `noindex, nofollow, noarchive`.

## 16. Employee public-page QA

Normal internal design/review uses the CMS and should not create external prospect engagement.

When an employee must inspect the exact public prospect page, use the CMS employee-test action. It obtains a short-lived server-signed token bound to the prospect slug. Only a valid token classifies that opening as `INTERNAL`.

Do not invent IP-based employee recognition or a guessable `?internal=1` convention.

## 17. Engagement and outreach

Engagement exists to improve timing and quality of human follow-up, not to identify a visitor.

MVP response signals:

- first/last external opening;
- opening count;
- active visible time;
- maximum scroll;
- broad device class;
- QR/direct source.

No raw IP, IP hash, fingerprint, persistent visitor identifier, heatmap or session replay.

Telemetry is fail-open: if measurement fails, the prospect page must still load.

Engagement never automatically changes contact status or assigns a lead score. A human decides the next commercial action.

## 18. Archive and delete

Archive is orthogonal to lifecycle:

```text
archived_at IS NULL     = active
archived_at IS NOT NULL = archived
```

Archive preserves state/history. Hard delete is a narrow administrative correction path and is blocked when meaningful commercial history exists.

## 19. Deployment and verification

There is one Cloudflare Pages project: `soliddesign-cms`.

- push to `main` deploys production;
- pull requests deploy to an isolated Pages preview branch in the **same project**;
- the Pages Functions `/api/*` boundary requires active `team_members` membership before normal endpoint execution;
- Prompt Library repository writes have an additional production-origin guard;
- the deployment smoke verifies canonical prompt/research resources, preview write rejection, representative CMS/public routes and browser Edge-Function CORS boundaries.

Supabase Edge Functions are deployed from the exact source under `supabase/functions/`. A repository change to an Edge Function is not complete until the affected function has been deployed and the deployed source has been re-read or otherwise checked against the repository revision. See `supabase/README.md`.

Do not create a second Pages application merely for public branding or preview QA.

After schema/auth/RLS/function changes:

1. run CI, including authorization and evidence-merge invariants;
2. run the Pages/runtime smoke where relevant;
3. deploy affected Supabase Edge Functions from repository source;
4. verify deployed Edge Function source/behavior rather than assuming source control equals production;
5. run Supabase security advisors;
6. reconcile current documentation if a contract changed.

## 20. When discovery quality is insufficient

Do not immediately build another provider layer. First identify which current path fails:

```text
research precision/evidence?
Overture recall/sector mapping?
direct URL intake?
website validity?
operator review burden?
commercial conversion after promotion?
```

Use the source provenance already stored in the system to compare qualified yield and operator effort.

Add a fourth source only when a measured gap remains after the three current paths and map it into the same existing candidate boundary first. Generalize only after real duplication exists.

## 21. Do not build without evidence

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
- custom Auth invitation mailer when Supabase custom SMTP solves mail transport.

Only an observed customer/operator bottleneck may promote these ideas into the roadmap.
