# Architecture and Business Decisions

## ADR-001 — Optimize for learning, not platform completeness

**Decision:** Phase 1 prioritizes reliable commercial learning over architectural completeness.

**Consequence:** queues, realtime dashboards, MCP, agent fabrics and autonomous outbound are deferred.

## ADR-002 — Compose before full-chassis adoption

**Decision:** use a small composition of semantically aligned components rather than importing a complete AI web-agency chassis by default.

**Current composition:** Overture Maps + DuckDB discovery + Pitch Doctor audit + own qualification + OpenPage-compatible demo + static preview + thin print pack.

## ADR-003 — Supabase as operational state

**Decision:** operational prospect/audit/demo/mailing/outcome data uses the dedicated SolidDesign Supabase project.

**Offline exception:** fixtures/local artifacts remain permitted for deterministic tests.

## ADR-004 — GitHub as software/documentation truth

**Decision:** mission, schemas, code, tests, prompts safe for disclosure, provenance and decisions live in GitHub.

## ADR-005 — Pre-sale proof separated from production delivery

**Decision:** optimize pre-sale demo for persuasion, speed, correctness and editability. Production stack is selected after real customer requirements exist.

## ADR-006 — Physical mail + human sales

**Decision:** Phase 1 uses personalized physical mail for outbound attention and human sales after engagement. Automated cold email/calling is not part of MVP.

## ADR-007 — Five-factor unweighted score

**Decision:** use hard gates plus five 0–5 rubrics; do not introduce arbitrary factor weights before outcome data.

## ADR-008 — Public-repo safety boundary

**Decision:** this public repo contains no secrets, real prospect/customer datasets or intentionally proprietary core material.

## ADR-009 — Overture Maps is the canonical Phase-1 discovery source

**Date:** 2026-08-25

**Decision:** replace Google Places as the default discovery provider with Overture Maps Places.

**Reasons:**

- no Google Cloud project or billing requirement;
- no provider API key;
- open global Places dataset;
- website/phone/address/category fields are available;
- bounded cloud-native queries fit the small-market MVP;
- data-provider complexity should not precede proof that it improves sales.

**Implementation:** DuckDB queries Overture cloud GeoParquet using an explicit bbox and current taxonomy fields.

**Consequence:** Google-specific rating/review data is no longer assumed at discovery time. `rating` and `review_count` remain optional/null unless later enriched.

## ADR-010 — Demand evidence is independent from discovery-source existence

**Decision:** Overture presence, confidence, operating status and website presence cannot by themselves establish Existing Demand.

**Reason:** Overture's `confidence` describes confidence that a place exists, not commercial demand.

**Consequence:** demand is separately evidenced during human qualification.

## ADR-011 — Explicit bbox before geocoder

**Decision:** Phase-1 market geography is supplied as `west,south,east,north`.

**Reason:** deterministic, reproducible, free and dependency-light.

**Consequence:** no geocoding service is built until operator friction proves it necessary.

## ADR-012 — New Overture taxonomy fields only

**Decision:** new SolidDesign discovery logic uses `basic_category` and `taxonomy`, not the deprecated legacy `categories` field.

**Reason:** Overture announced removal of `categories` in September 2026.

## ADR-013 — Single-source first, fallback only after measured failure

**Decision:** do not simultaneously activate Overture + OSM + Google.

**Fallback order:**

1. Overture;
2. bounded OSM/Overpass if a specific coverage gap is proven;
3. targeted commercial enrichment if economics justify it.

## ADR-014 — Raw donor audit is evidence; prospect-facing audit is root-cause reviewed

**Date:** 2026-08-25

**Decision:** preserve the raw Pitch Doctor report unchanged, but require a human-reviewed `AuditResult` before audit findings become prospect-facing proof or sales copy.

**Trigger:** the first live Utrecht audit showed a blocking expired TLS certificate. Because the page never loaded normally, the donor also emitted numerous downstream critical checks that were not independent verified defects.

**Rule:** when a blocking root cause prevents normal page evaluation, cascading failed-load findings are suppressed/collapsed in the presentation layer rather than counted as separate opportunities.

```text
RAW DONOR AUDIT
→ preserve
→ identify root cause
→ collapse cascading unknowns
→ human-reviewed AuditResult
→ brief / print pack
```

**Consequence:** SolidDesign favors fewer defensible findings over a larger, more dramatic list. This is both a trust requirement and a commercial-quality requirement.
