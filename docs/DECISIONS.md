# Architecture and Business Decisions

## ADR-001 — Optimize for learning, not platform completeness

**Decision:** Phase 1 prioritizes reliable commercial learning over architectural completeness.

**Consequence:** queues, realtime dashboards, MCP, agent fabrics and autonomous outbound are deferred.

## ADR-002 — Compose before full-chassis adoption

**Decision:** use a small composition of semantically aligned donors rather than importing a complete AI web-agency chassis by default.

**Current hypothesis:** Google Places adapter + Pitch Doctor audit + own qualification + OpenPage-compatible demo + static preview + thin print pack.

## ADR-003 — Supabase as intended operational state

**Decision:** operational prospect/audit/demo/mailing/outcome data will use Supabase once live credentials/project are selected.

**Component-spike exception:** fixtures/local artifacts are permitted to prove the path without credentials.

## ADR-004 — GitHub as software/documentation truth

**Decision:** mission, schemas, code, tests, prompts safe for disclosure, provenance and decisions live in GitHub.

## ADR-005 — Pre-sale proof separated from production delivery

**Decision:** optimize pre-sale demo for persuasion, speed, correctness and editability. Production stack is selected after real customer requirements exist.

## ADR-006 — Physical mail + human sales

**Decision:** Phase 1 uses personalized physical mail for outbound attention and human sales after engagement. Automated cold email/calling is not part of MVP.

## ADR-007 — Five-factor unweighted score

**Decision:** use hard gates plus five 0–5 rubrics; do not introduce arbitrary factor weights before outcome data.

## ADR-008 — Public-repo safety boundary

**Decision:** this public repo contains no secrets, real prospect/customer personal data or intentionally proprietary core material.
