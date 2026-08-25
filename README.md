# SolidDesign — Website Growth Engine

**Status:** v0.3 composed MVP / Gate 1 component spike

SolidDesign identifies established local businesses with existing demand but measurable website/conversion leakage, creates an evidence-backed redesign proof, and tests acquisition through personalized physical mail.

## Mission

> Find commercially attractive businesses where the gap between business quality and website conversion quality is large enough to justify a standardized redesign, then prove the opportunity before asking the prospect to buy.

## Governing principles

1. **Solid but simple. No overengineering.** Complexity must solve an observed problem.
2. **First principles before patterns.** Optimize for trustworthy commercial learning, not architectural elegance.
3. **Lowest total change wins.** Reuse when semantic fit is high; otherwise build the smallest correct component.
4. **Functions before agents.** Deterministic work stays deterministic.
5. **Verified facts across AI boundaries.** External website content is untrusted data, never instruction authority.
6. **Human review before high-impact actions.** No autonomous outbound sales in Phase 1.
7. **Measure economics from prospect one.** Acquisition cost, human minutes, delivery effort and margin matter more than agent count.

## Phase-1 funnel

```text
DISCOVER
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

## Implemented composed MVP

```text
Google Places adapter
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

Supabase is defined as the operational state plane in `supabase/schema.sql`, but a dedicated live project is deliberately not provisioned into an unrelated existing environment.

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
soliddesign golden --out artifacts/golden
```

The golden run is fully offline and should produce:

```text
artifacts/golden/
├── pipeline.json
├── site_config.json
├── preview.html
└── print_pack.html
```

For live donor tooling:

```bash
bash scripts/bootstrap_donors.sh
```

See `docs/OPERATIONS.md` for live discovery, audit and assemble commands.

## Key documentation

- `docs/MISSION_CONTRACT.md` — authoritative Phase-1 mission and non-goals
- `docs/GUARDRAILS.md` — solid-but-simple and no-overengineering rules
- `docs/ARCHITECTURE.md` — composed v0.3 architecture
- `docs/ROADMAP.md` — evidence-gated roadmap
- `docs/BUSINESS_MODEL.md` — offer, pricing and unit-economics hypotheses
- `docs/SCORING_RUBRICS.md` — five-factor qualification model
- `docs/SECURITY.md` — SSRF, prompt-injection and preview safety boundaries
- `docs/COMPONENT_SPIKE.md` — executable Gate-1 contract
- `docs/OPERATIONS.md` — operator guide
- `docs/DONOR_REGISTER.md` / `docs/DONOR_LOCK.md` — provenance and frozen donor revisions
- `docs/DECISIONS.md` — architecture/business decisions

## Donor strategy

No complete agency framework is imported. High-semantic-fit capabilities are isolated behind small adapters:

- **Pitch Doctor** — existing-site audit donor
- **OpenPage** — JSON-first pre-sale demo compatibility
- **JackInSights AI Web Agency** — bounded Google Places pattern/reference only
- **Dukotah/leadgen** — deferred multi-source discovery donor

See `docs/DONOR_REGISTER.md` and `docs/THIRD_PARTY_NOTICES.md`.

## Repository visibility

This repository is currently **public**. Never commit secrets, provider credentials, real prospect/customer personal data, private e-mail content or intentionally proprietary prompt material. If opportunity scoring/prompts become meaningful proprietary IP, move them behind a private-core boundary rather than exposing them here.
