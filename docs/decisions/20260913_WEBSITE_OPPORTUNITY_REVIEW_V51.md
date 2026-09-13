# ADR — Website Opportunity Review v5.1

**Date:** 2026-09-13  
**Status:** accepted for implementation under M8.3  
**Supersedes:** the transient/manual persistence choice in Architecture Brief v5; preserves the evidence/domain corrections introduced by v5.

## Context

SolidDesign needs one business-first interpretation of current website evidence to guide both prospect-specific Design and the physical before/after mailing.

Two extremes were rejected:

1. rewriting `audits.findings` into customer-facing commercial findings, because technical evidence and business prioritization have different semantics;
2. leaving the reviewed opportunity list only in a ChatGPT conversation/operator copy step, because Design and Print then depend on duplicate manual handoffs and no operational source of truth exists.

The current platform already has one prospect dossier, one Supabase state plane, a Prompt Library, prospect-first Design and immutable mailing artifacts.

## Decision

Persist one current human-reviewed ordered list at:

```text
prospects.qualification.website_opportunity
```

Use one narrow mutation:

```text
operator_set_website_opportunity(prospect_id, source_audit_id, findings)
```

Reuse the Prompt Library for manual ChatGPT invocation. Project the same persisted list into:

- the existing prospect Overview (`Websitekansen`);
- the Design Brief as priority + observed evidence;
- the existing manual Printmailing creation surface as the canonical finding source.

Do not add a table, top-level module, scoring model, AI runtime, queue, generic importer or screenshot service.

## Consequences

### Positive

- one operational source of reviewed opportunity truth;
- technical audit evidence remains intact;
- no manual opportunity copy between Overview, Design and Print;
- human review remains the trust gate;
- minimal new persistence and authorization surface;
- rollback does not require dropping a table or column.

### Costs

- one new RPC must be maintained;
- Design Brief format moves from v0.4 to v0.5;
- operators still invoke ChatGPT manually until real usage proves automation is worthwhile.

## Rejected alternatives

### Store reviewed findings in `audits.findings`

Rejected because it changes technical audit semantics and destroys the distinction between evidence and interpretation.

### Store only in `design_brief_note`

Rejected because that field is explicit operator design direction, not a shared commercial evidence object, and Print would still need a second copy.

### New `website_opportunities` table

Rejected because one bounded current JSON namespace fully satisfies the present requirement.

### Generic AI result/import framework

Rejected because only one proven workflow needs structured import now.

### Feature flag

Rejected because Git/PR rollback plus one removable RPC already provides a simpler reversible boundary.

## Rollback

1. Revert the v5.1 application merge commit.
2. Apply a compensating migration dropping `operator_set_website_opportunity(uuid, uuid, jsonb)`.
3. Leave persisted `qualification.website_opportunity` JSON intact unless explicit destructive cleanup is required; old code ignores it.

This restores prior runtime behaviour without data loss or table/schema surgery.

## Verification

Implementation acceptance is defined in `docs/WEBSITE_OPPORTUNITY_REVIEW.md`. Commercial acceptance remains evidence-gated by real prospect sends and response/outcome data.
