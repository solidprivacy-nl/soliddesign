# SolidDesign — Website Growth Engine

**Status:** integrated operating model in production; M8 operational/commercial pilot is active.

SolidDesign identifies established local businesses with measurable website/conversion headroom, creates an evidence-backed redesign proof, and tests acquisition through personalized physical mail and human follow-up.

## Mission

> Find commercially attractive businesses where the gap between business quality and website quality is large enough to justify a redesign, then prove the opportunity before asking the prospect to buy.

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
DISCOVERY
→ HUMAN SELECT
→ QUALIFICATION / AUDIT
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

Authorization is derived only from the authenticated Auth UUID and an active `team_members` row. The historical `operator_allowlist` compatibility model is retired and must not be recreated as a second membership authority.

## Discovery

Discovery has exactly three current intake paths:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
                 Discovery Inbox
```

Sector remains a discovery input where it is materially required:

- research uses human sector + location as market scope;
- Overture broad search resolves the human term to a valid Overture category;
- `canonical_sector_key` may remain as discovery/provenance metadata when naturally available.

A direct-URL prospect may remain unclassified.

Canonical discovery documentation: `docs/DISCOVERY.md` and `docs/DISCOVERY_SECTOR_RESOLUTION.md`.

## Prospect-first Design

Once a candidate becomes a prospect, design is based on the actual business rather than a generalized sector model.

```text
operator instruction
+ SolidDesign design method
+ Prospect Design Brief / verified facts
+ source website / assets / screenshots
+ current LIVE / concept
→ prospect-specific redesign
```

Sector/category metadata does not trigger design research, templates or presets.

The Design tab has one primary ChatGPT action (`Kopieer designopdracht`), one website-version lifecycle and the printmailing artifact lifecycle. See `docs/PROSPECT_FIRST_DESIGN.md`.

## Public delivery contract

Every prospect has one stable human-readable slug. The canonical public route resolves:

```text
slug
→ prospect
→ current LIVE demo
→ canonical stored artifact
```

New LIVE publication requires an uploaded HTML/ZIP artifact. External HTTPS preview links are review/DRAFT escape hatches only.

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

## Operational truth

- **GitHub:** code, tests, architecture, reusable prompts/methods, decisions and roadmap.
- **Supabase:** prospects, audits, demos, team membership, assignments, mailings, events and engagement.
- **Cloudflare Pages:** one deployment serving internal and public delivery surfaces.
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

## Documentation map

`docs/ARCHITECTURE.md` defines the documentation truth hierarchy.

- `ENGINEERING_CONSTITUTION.md` — top-level mandatory engineering standard
- `docs/ARCHITECTURE.md` — canonical architecture entrypoint + documentation precedence
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md` — current system/operating model
- `docs/PROSPECT_FIRST_DESIGN.md` — current Design boundary and operator UX contract
- `docs/DESIGN_BRIEF.md` — prospect-specific AI handoff contract
- `docs/DISCOVERY.md` — current discovery contract
- `docs/PROMPT_LIBRARY.md` — operator prompt-library contract
- `docs/SECURITY.md` — current trust/auth boundaries
- `docs/OPERATIONS.md` — current operating guide
- `docs/ROADMAP.md` — current evidence-gated status and next gates
- `docs/MISSION_CONTRACT.md` — mission and non-goals
- `docs/BUSINESS_MODEL.md` — offer, acquisition model and economics
- `docs/SCORING_RUBRICS.md` — qualification model
- `docs/DECISIONS.md` and `docs/decisions/` — decision history; later accepted decisions supersede conflicts
- `docs/evidence/` — dated proof snapshots, not runtime contracts

## Donor / dependency strategy

No complete agency framework is imported.

- **Overture Maps** — current open broad-discovery dataset
- **DuckDB** — bounded cloud GeoParquet query engine
- **Pitch Doctor** — existing-site audit donor
- **OpenPage** — JSON-first pre-sale demo compatibility
- other donors remain bounded references/adapters and must earn their place

See `docs/DONOR_REGISTER.md` and `docs/THIRD_PARTY_NOTICES.md`.

## Repository visibility

This repository is currently public. Never commit secrets, real prospect/customer datasets, private e-mail content or operational access tokens. Prompt/library content that must not remain public requires a future repository/private-execution boundary rather than security by obscurity.
