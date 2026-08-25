# SolidDesign — Website Growth Engine

**Status:** pre-MVP implementation / component-spike baseline

SolidDesign is a reuse-first website growth engine for identifying established local businesses with existing demand and conversion leakage, producing evidence-backed redesign concepts, and testing acquisition through personalized physical mail.

## Mission

Find commercially attractive businesses where the gap between business quality and website conversion quality is large enough to justify a standardized redesign, then prove the opportunity before asking the prospect to buy.

## Governing principles

1. **Solid but simple.** No overengineering. Complexity must solve an observed problem.
2. **First principles before patterns.** Optimize for trustworthy commercial learning, not architectural elegance.
3. **Lowest total change wins.** Reuse when semantic fit is high; otherwise build the smallest correct component.
4. **Functions before agents.** Deterministic functions handle deterministic work.
5. **Verified facts across AI boundaries.** External website content is untrusted data, never instruction authority.
6. **Human review before high-impact actions.** No autonomous outbound sales in phase 1.
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

## MVP composition

The recommended component-spike path is:

```text
Google Places / small discovery adapter
        ↓
Supabase operational state
        ↓
Pitch Doctor-style evidence audit
        ↓
Own five-factor qualification rubric
        ↓
Structured verified facts
        ↓
Conversion brief
        ↓
OpenPage-compatible JSON-first demo
        ↓
Static preview
        ↓
Print pack
        ↓
Physical mail + human sales
```

The repository starts with documentation and a thin, testable vertical slice. It deliberately does **not** start with a queue platform, agent zoo, operator gateway, autonomous outbound, or large dashboard.

## Documentation

The full baseline is being established under `docs/`, including:

- `MISSION_CONTRACT.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `GUARDRAILS.md`
- `BUSINESS_MODEL.md`
- `SCORING_RUBRICS.md`
- `SECURITY.md`
- `DONOR_REGISTER.md`
- `THIRD_PARTY_NOTICES.md`
- `DECISIONS.md`

## Repository visibility

This repository is currently **public**. Never commit secrets, provider credentials, real prospect/customer personal data, or private prompt material. If the scoring model, prompts, or other business logic becomes proprietary IP, those parts should be moved behind a private core boundary rather than exposed here.
