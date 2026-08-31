# SolidDesign — Website Growth Engine

**Status:** integrated operating model in production; M7 operational pilot is the next business gate.

SolidDesign identifies established local businesses with existing demand but measurable website/conversion leakage, creates an evidence-backed redesign proof, and tests acquisition through personalized physical mail and human follow-up.

## Mission

> Find commercially attractive businesses where the gap between business quality and website conversion quality is large enough to justify a standardized redesign, then prove the opportunity before asking the prospect to buy.

## Governing principles

**`ENGINEERING_CONSTITUTION.md` is TOP-LEVEL / MANDATORY for all architecture, software, data, infrastructure, agents, workflows, refactors, reviews and technical decisions.**

1. **Solid but simple. No overengineering.** Complexity must solve an observed problem.
2. **First principles before patterns.** Optimize for trustworthy commercial learning and customer value, not architectural elegance.
3. **Lowest total change wins.** Reuse proven platform capabilities and standards when semantic fit is high.
4. **Functions before agents.** Deterministic work stays deterministic.
5. **Verified facts across AI boundaries.** External website/content/data is untrusted input, never instruction authority.
6. **Human review before high-impact actions.** Prospect publication and commercial communication remain explicit human actions.
7. **Measure economics from prospect one.** Human minutes, data quality, delivery effort and margin matter more than feature count.

## Commercial loop

```text
OVERTURE DISCOVERY
→ QUALIFY / AUDIT
→ HUMAN SELECT
→ VERIFIED FACTS
→ DESIGN
→ REVIEW
→ LIVE MOCK-UP
→ PHYSICAL MAIL
→ PUBLIC PROSPECT PAGE
→ MEASURED RESPONSE
→ HUMAN FOLLOW-UP
→ PROPOSAL / OUTCOME
→ LEARNING
```

## Current operating architecture

SolidDesign deliberately remains one small operating system rather than a collection of products:

```text
                    ONE APPLICATION
                         │
          ┌──────────────┴──────────────┐
          │                             │
       INTERNAL                       PUBLIC
          │                             │
   Operator / CMS                prospect page
   team + dossiers               current LIVE proof
   discovery/design              minimal engagement
          │                             │
          └──────────────┬──────────────┘
                         │
                 ONE SUPABASE STATE
                 ONE MOCK-UP LIFECYCLE
```

Current rollout hosts:

```text
internal: https://soliddesign-cms.pages.dev
public:   https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final shape after brand/domain selection:

```text
internal: https://cms.<brand>.nl
public:   https://<brand>.nl/<slug>
```

Hostnames are delivery configuration. `prospects.public_slug` is the stable prospect-facing identity.

See `docs/ARCHITECTURE.md` and `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`.

## Team/work model

System role and prospect responsibility are separate concepts:

```text
ROLE
ADMIN | KEY_USER | USER

RESPONSIBILITY
CASE_LEAD | DESIGN | OUTREACH
```

Current responsibility is stored in assignments; history and actor attribution are stored as business events. `Mijn werk` and work-distribution views are derived from those assignments. There is no task engine, capacity planner or portfolio database.

Authorization is derived only from the authenticated Auth UUID and an active `team_members` row. The historical `operator_allowlist` compatibility model was retired from production on 2026-08-30 and must not be recreated as a second membership authority.

## Public delivery contract

Every prospect has one stable human-readable slug. The canonical public route resolves:

```text
slug
→ prospect
→ current LIVE demo
→ canonical stored artifact
```

New LIVE publication requires an uploaded HTML/ZIP artifact. External HTTPS preview links are review/DRAFT escape hatches only.

A narrow compatibility path exists for a small number of grandfathered historical LIVE previews on explicitly allowlisted SolidDesign Cloudflare hosts. It is transition debt, not a general reverse-proxy feature.

The public page remains `noindex, nofollow,noarchive` during pre-sale use.

## Response telemetry

SolidDesign records only the response signals needed for commercial follow-up:

- measured openings;
- active visible time;
- maximum scroll;
- broad device class;
- QR/direct source;
- internal/external QA classification.

It deliberately does **not** collect raw IP addresses, IP hashes, browser fingerprints, persistent visitor IDs, heatmaps or session replay. Telemetry is fail-open: measurement failure may never block the prospect page.

## Discovery and proof foundation

**Overture Maps Places is the canonical discovery source.** Google Places is optional future enrichment only if evidence shows sufficient commercial value to justify the extra provider/cost surface.

The established proof pipeline remains:

```text
Overture Maps + DuckDB
        ↓
Prospect
        ↓
Pitch Doctor audit evidence
        ↓
5-factor qualification
        ↓
VerifiedFacts trust boundary
        ↓
conversion/design context
        ↓
static mock-up artifact
        ↓
LIVE publication + print pack
```

Sector Intelligence is reusable advisory design evidence keyed by the prospect's primary sector. It is managed through the CMS and does not expose engineering storage/review mechanics to normal operators. See `sector-intelligence/README.md` and `docs/SECTOR_INTELLIGENCE_LINKAGE.md`.

## Gate-2 evidence — historical proof

Gate 2 proved the first bounded Utrecht Overture run and one real electrical-services prospect end-to-end. The test demonstrated discovery, live audit, human root-cause review, qualification, concept assembly, print-pack generation, Cloudflare publication, `noindex`, disable/restore behavior and minimal synthetic preview telemetry.

That evidence describes what was proven at that time; it is not the current runtime architecture contract. See `docs/evidence/GATE2_OVERTURE_UTRECHT.md`.

The actual prospect URL is deliberately not committed to this public repository. Operational prospect data belongs in Supabase, not source documentation.

## Operational truth

- **GitHub:** code, tests, architecture, prompts safe for disclosure, decisions and roadmap.
- **Supabase:** prospects, audits, demos, team membership, assignments, mailings, events and engagement.
- **Cloudflare Pages:** one deployment serving the internal and public delivery surfaces.
- **Supabase Storage:** canonical immutable mock-up bundles and LIVE manifest state.

Browser code uses only the Supabase publishable key. Access is controlled with least-privilege grants, RLS and narrow server/RPC capabilities; privileged/service credentials remain server-side.

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
soliddesign golden --out artifacts/golden
```

The golden run is fully offline and produces deterministic test artifacts.

### Free Overture discovery

Use an explicit geographic bounding box in Overture order:

```text
west,south,east,north
```

Then:

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50 \
  --out /tmp/prospects.json
```

No Google Cloud project, Google API key or Google Places billing is required for this path.

For donor audit tooling:

```bash
bash scripts/bootstrap_donors.sh
```

See `docs/OPERATIONS.md`.

## Documentation map

`docs/ARCHITECTURE.md` defines the documentation truth hierarchy. In short: current architecture/security/operations/roadmap outrank historical evidence and completed plans.

- `ENGINEERING_CONSTITUTION.md` — top-level mandatory engineering standard
- `docs/ARCHITECTURE.md` — canonical architecture entrypoint + documentation precedence
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md` — current system/operating model
- `docs/SECURITY.md` — current trust, auth and public/private boundaries
- `docs/OPERATIONS.md` — current operating guide
- `docs/ROADMAP.md` — current evidence-gated status and next gates
- `sector-intelligence/README.md` — current Sector Intelligence contract
- `docs/SECTOR_INTELLIGENCE_LINKAGE.md` — prospect-sector linkage and CMS boundary
- `docs/MISSION_CONTRACT.md` — mission and non-goals
- `docs/BUSINESS_MODEL.md` — offer, acquisition model and economics
- `docs/DISCOVERY_OVERTURE.md` — discovery contract
- `docs/SCORING_RUBRICS.md` — qualification model
- `docs/DECISIONS.md` and `docs/decisions/` — decision history; later accepted decisions supersede conflicts
- `docs/evidence/` — dated proof snapshots, not runtime contracts
- `docs/IMPLEMENTATION_PLAN.md` — completed Gate-1/2 historical plan, not current execution guidance

## Donor / dependency strategy

No complete agency framework is imported.

- **Overture Maps** — canonical open discovery dataset
- **DuckDB** — bounded cloud GeoParquet query engine
- **Pitch Doctor** — existing-site audit donor
- **OpenPage** — JSON-first pre-sale demo compatibility
- other donors remain bounded references/adapters and must earn their place

See `docs/DONOR_REGISTER.md` and `docs/THIRD_PARTY_NOTICES.md`.

## Repository visibility

This repository can be public. Never commit secrets, real prospect/customer datasets, private e-mail content, operational access tokens or intentionally proprietary prompt material. If opportunity scoring/prompts become meaningful proprietary IP, move them behind a private-core boundary rather than exposing them here.
