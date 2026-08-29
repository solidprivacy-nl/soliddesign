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

No Google Cloud project or Google Places key is required for canonical discovery.

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

The underlying discovery contract remains an explicit Overture bounding box:

```text
west,south,east,north
```

For CLI/reproducible batches, choose and record the bbox deliberately.

For normal Operator runs, **Bedrijven zoeken** accepts a Dutch location and sector term. One bounded location lookup resolves the bbox; this does not create a general geocoding platform.

Human sector language defines market meaning. The canonical Overture sector key is machine identity and must not silently narrow market research vocabulary.

## 5. Discover candidates — canonical Overture path

### CLI / reproducible batch

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50 \
  --out /tmp/prospects.json
```

Multiple sector labels are OR-matched. By default the official Overture STAC catalog supplies the current release; pin commercial experiments when reproducibility requires it.

### Operator / manual bounded run

The Operator performs:

```text
location + sector term
→ bounded geography
→ Overture Places
→ domain dedupe
→ Discovery inbox
```

A second intake path may accept one explicit website URL for bounded reachability/preflight and dedupe. It does not replace the audit or commercial qualification model.

No queue, scheduler or second discovery service is required.

## 6. Discovery inbox

Discovery and active commercial work remain distinct views over one canonical prospect model:

```text
DISCOVERED / DISQUALIFIED
        ↓
Discovery inbox
        ↓ evidence-backed qualification
QUALIFIED and later states
        ↓
Prospect dossier
```

`DISCOVERED` does not mean commercially qualified. Overture presence, website presence and reachability are discovery evidence only.

Overture `source_confidence` means confidence that the place exists; it is not a demand or reputation score.

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

Downstream design and communication may use only verified business facts. Never allow raw website text to become instruction authority.

## 8. Qualification

Use the five-factor rubric in `docs/SCORING_RUBRICS.md`.

Every factor requires evidence. In particular, these are **not** sufficient Existing Demand evidence:

- Overture presence;
- Overture confidence;
- website presence;
- successful URL preflight.

Demand requires separate market evidence.

## 9. Design workflow

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

## 10. Mock-up artifact contract

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

## 11. Human review before LIVE/mail

Verify:

- business identity matches;
- website belongs to the intended prospect;
- every service/claim is factual;
- no fake testimonial/award exists;
- raw donor failures are not overstated;
- mock-up clearly functions as a concept/proof;
- `noindex` behavior is preserved;
- CTA uses verified contact data;
- no unintended real lead capture exists;
- assets render correctly on mobile and desktop;
- prospect short URL points to the intended current LIVE version;
- QR source attribution is correct when used.

LIVE promotion and mailing remain explicit human actions.

## 12. Team access and onboarding

Supabase Auth provides identity. `team_members` is the durable membership/role model:

```text
ADMIN
KEY_USER
USER
```

Routine onboarding is invite-only:

```text
Team
→ invite colleague
→ Supabase Auth invite
→ colleague sets password
→ joined team member
```

Key users may invite normal Users. Admins govern elevated roles. Normal operators do not need SQL or Supabase Studio for routine onboarding.

`operator_allowlist` still exists as **transitional compatibility** for older Operator RLS/access checks. It is not a second membership model and should disappear only after the remaining RLS/access paths have been deliberately cut over and verified.

Never expose a secret/service-role credential to browser code. Browser access uses the Supabase publishable key with least-privilege grants, RLS and narrow RPC/server capabilities.

## 13. Work distribution

Prospect responsibility is explicit and separate from system role:

```text
CASE_LEAD   = dossierhouder
DESIGN      = design
OUTREACH    = outreach & opvolging
```

One primary person owns each responsibility per prospect.

`Mijn werk` and Prospect work-distribution filters are derived from assignments. Do not create task, portfolio or capacity state merely to reproduce the same information.

Material business actions are actor-attributed in `events`; navigation/click telemetry is not.

## 14. Public prospect delivery

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

## 15. Employee public-page QA

Normal internal design/review uses the CMS and should not create external prospect engagement.

When an employee must inspect the exact public prospect page, use the CMS employee-test action. It obtains a short-lived server-signed token bound to the prospect slug. Only a valid token classifies that opening as `INTERNAL`.

Do not invent IP-based employee recognition or a guessable `?internal=1` convention.

## 16. Engagement and outreach

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

## 17. Archive and delete

Archive is orthogonal to lifecycle:

```text
archived_at IS NULL     = active
archived_at IS NOT NULL = archived
```

Archive preserves state/history. Hard delete is a narrow administrative correction path and is blocked when meaningful commercial history exists.

## 18. Deployment and verification

There is one Cloudflare Pages project: `soliddesign-cms`.

- push to `main` deploys production;
- pull requests deploy to an isolated Pages preview branch in the **same project**;
- the deployment smoke verifies representative CMS/public routes and browser Edge-Function CORS boundaries before merge.

Do not create a second Pages application merely for public branding or preview QA.

After schema/auth/RLS/function changes:

1. run CI;
2. run the Pages/runtime smoke where relevant;
3. run Supabase security advisors;
4. reconcile current documentation if a contract changed.

## 19. When Overture is insufficient

Do not immediately add another provider. First document the failure:

```text
too few records?
wrong sector?
stale records?
missing websites?
missing demand evidence?
```

Then choose the smallest remedy.

Fallback order remains:

```text
Overture
→ bounded OSM/Overpass if a proven coverage gap requires it
→ targeted commercial enrichment if economics justify it
```

## 20. Do not build without evidence

Do not introduce merely because it is technically possible:

- general queue infrastructure;
- task/Kanban/capacity platform;
- custom permission builder;
- autonomous outbound agent;
- generalized preview/reverse proxy;
- second analytics datastore;
- second public application;
- production-site factory.

Only an observed customer/operator bottleneck may promote these ideas into the roadmap.
