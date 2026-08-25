# SolidDesign — Website Growth Engine

**Status:** v0.3 composed MVP / Gate 2 live single-prospect integration proven end-to-end

SolidDesign identifies established local businesses with existing demand but measurable website/conversion leakage, creates an evidence-backed redesign proof, and tests acquisition through personalized physical mail.

## Mission

> Find commercially attractive businesses where the gap between business quality and website conversion quality is large enough to justify a standardized redesign, then prove the opportunity before asking the prospect to buy.

## Governing principles

1. **Solid but simple. No overengineering.** Complexity must solve an observed problem.
2. **First principles before patterns.** Optimize for trustworthy commercial learning, not architectural elegance.
3. **Lowest total change wins.** Reuse when semantic fit is high; otherwise build the smallest correct component.
4. **Functions before agents.** Deterministic work stays deterministic.
5. **Verified facts across AI boundaries.** External website/content/data is untrusted input, never instruction authority.
6. **Human review before high-impact actions.** No autonomous outbound sales in Phase 1.
7. **Measure economics from prospect one.** Human minutes, data quality, delivery effort and margin matter more than feature count.

## Phase-1 funnel

```text
OVERTURE DISCOVERY
→ QUALIFY
→ AUDIT
→ HUMAN SELECT
→ VERIFIED FACTS
→ CONVERSION BRIEF
→ BUILD DEMO
→ REVIEW
→ DEPLOY PREVIEW
→ PRINT PACK
→ PHYSICAL MAIL
→ DEMO VISIT
→ HUMAN SALES
→ PROPOSAL
→ CUSTOMER
```

## Canonical composed MVP

```text
Overture Maps Places
bbox + taxonomy, no API key
        ↓
Prospect model
        ↓
Pitch Doctor audit adapter
        ↓
5-factor qualification
        ↓
VerifiedFacts trust boundary
        ↓
Grounded conversion brief
        ↓
OpenPage-compatible SiteConfig
        ↓
Static noindex concept preview
        ↓
Personalized print pack + QR
```

### Discovery decision

**Overture Maps Places is the canonical Phase-1 discovery source.**

Google Places is no longer required to enumerate prospects. It remains only an optional future enrichment/fallback if experiments prove that Google-specific data such as review count materially improves selection enough to justify cost and account complexity.

See `docs/DISCOVERY_OVERTURE.md` for the full discovery contract, Netherlands validation plan, taxonomy model, release policy and fallback criteria.

## Live Gate-2 evidence

The first bounded Utrecht run on Overture release `2026-08-19.0` returned:

- 996 service-business records with websites;
- 930 unique website domains;
- 740 records with locality Utrecht;
- 83 installation-related keyword candidates.

One real Utrecht electrical-services prospect then completed live audit, human root-cause review, five-factor qualification at **19/25**, concept assembly, print-pack generation and static Cloudflare Pages publication.

The public preview milestone also proved:

- a shared Cloudflare Pages preview area;
- an opaque prospect path;
- browser-accessible HTTP 200;
- HTML `noindex`;
- no form and no testimonial content;
- disable lifecycle by replacing the proof with a neutral unavailable page;
- restore lifecycle back to the verified concept;
- minimal synthetic preview-visit event without fingerprinting;
- operational preview URL/state persisted in the dedicated SolidDesign Supabase project.

The raw audit remains preserved separately from prospect-facing reviewed findings.

See `docs/evidence/GATE2_OVERTURE_UTRECHT.md` for the evidence and limitations.

The actual prospect preview URL is deliberately **not committed to this public repository**. It is operational state, not public source documentation.

## Operational state

A dedicated **SolidDesign** Supabase project exists in `eu-west-1` on the free project tier. `supabase/schema.sql` is the canonical schema. Phase-1 tables are server-side only: RLS is enabled and `anon`/`authenticated` have no table grants.

The first real prospect now has persisted prospect, reviewed audit, qualification, demo URL/status and preview events in Supabase.

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
soliddesign golden --out artifacts/golden
```

The golden run is fully offline and produces:

```text
artifacts/golden/
├── pipeline.json
├── site_config.json
├── preview.html
└── print_pack.html
```

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

The bbox above demonstrates syntax only; choose the actual experiment geography deliberately.

No Google Cloud project, Google API key or Google Places billing is required for this path.

For donor audit tooling:

```bash
bash scripts/bootstrap_donors.sh
```

See `docs/OPERATIONS.md`.

## Key documentation

- `docs/MISSION_CONTRACT.md` — authoritative mission and non-goals
- `docs/GUARDRAILS.md` — solid-but-simple / no-overengineering rules
- `docs/ARCHITECTURE.md` — composed architecture and truth boundaries
- `docs/DISCOVERY_OVERTURE.md` — canonical Overture discovery model
- `docs/evidence/GATE2_OVERTURE_UTRECHT.md` — first real Dutch discovery/audit/proof evidence
- `docs/ROADMAP.md` — evidence-gated roadmap
- `docs/BUSINESS_MODEL.md` — offer, acquisition model and economics
- `docs/SCORING_RUBRICS.md` — five-factor qualification model
- `docs/SECURITY.md` — data/content trust boundaries and preview safety
- `docs/COMPONENT_SPIKE.md` — executable Gate-1 contract
- `docs/OPERATIONS.md` — operator guide
- `docs/DONOR_REGISTER.md` / `docs/DONOR_LOCK.md` — provenance
- `docs/DECISIONS.md` — architecture/business decisions

## Donor / dependency strategy

No complete agency framework is imported.

- **Overture Maps** — canonical open discovery dataset
- **DuckDB** — bounded cloud GeoParquet query engine
- **Dukotah/leadgen** — reviewed Overture/DuckDB discovery pattern donor
- **Pitch Doctor** — existing-site audit donor
- **OpenPage** — JSON-first pre-sale demo compatibility
- **JackInSights AI Web Agency** — comparator/reference; Google adapter retained only as optional code, not canonical discovery

See `docs/DONOR_REGISTER.md` and `docs/THIRD_PARTY_NOTICES.md`.

## Repository visibility

This repository is **public**. Never commit secrets, real prospect/customer datasets, private e-mail content, operational opaque preview URLs or intentionally proprietary prompt material. If opportunity scoring/prompts become meaningful proprietary IP, move them behind a private-core boundary rather than exposing them here.
