# Architecture — SolidDesign

## Canonical architecture

The current operating architecture is defined in:

- `ENGINEERING_CONSTITUTION.md` — top-level engineering philosophy and decision standard;
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md` — current operating/system model;
- `docs/PROSPECT_FIRST_DESIGN.md` — current prospect-first Design boundary and UX contract;
- `docs/WEBSITE_OPPORTUNITY_REVIEW.md` — current business-first website interpretation and Design/Print handoff contract;
- `docs/DISCOVERY.md` — current discovery contract;
- `docs/PROMPT_LIBRARY.md` — current reusable operator-prompt contract;
- `docs/SECURITY.md` — current trust and authorization boundaries;
- `docs/AUTH_REDIRECTS.md` — current Supabase Auth redirect contract;
- `docs/ROADMAP.md` — current evidence-gated implementation status;
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md` — current hostname/public-delivery decision;
- `docs/decisions/20260913_WEBSITE_OPPORTUNITY_REVIEW_V51.md` — Website Opportunity v5.1 persistence/domain decision.

This document keeps the stable end-to-end business architecture concise.

## Documentation truth hierarchy

```text
ENGINEERING CONSTITUTION
        ↓
CURRENT ARCHITECTURE / SECURITY / OPERATIONS / ROADMAP
        ↓
LATEST ACCEPTED ADR / DECISION
        ↓
DOMAIN-SPECIFIC CURRENT CONTRACTS
        ↓
EVIDENCE / GATE REPORTS / COMPLETED IMPLEMENTATION PLANS
```

Rules:

- current contract documents describe how the system works now;
- later accepted decisions supersede conflicting earlier decision text;
- evidence documents preserve what was true at the time of a test and are not runtime contracts;
- completed implementation plans are historical execution records, not future architecture instructions;
- Git history preserves removed implementation detail; stale current docs are deleted or corrected rather than kept for archaeology;
- when runtime and current documentation diverge, reconcile them before extending that area further.

## Architecture objective

SolidDesign supports one commercial learning loop with the smallest reliable operational surface.

```text
DISCOVERY
→ QUALIFICATION / TECHNICAL WEBSITE EVIDENCE
→ VERIFIED FACTS
→ HUMAN-REVIEWED WEBSITE OPPORTUNITY
→ DESIGN
→ LIVE MOCK-UP
→ PHYSICAL OUTREACH
→ PUBLIC PROSPECT PAGE
→ ENGAGEMENT
→ HUMAN FOLLOW-UP
→ OUTCOME
→ LEARNING
```

The architecture is governed by four boundaries:

1. **GitHub is software/method truth.** Code, tests, architecture, prompts, decisions and roadmap live here.
2. **Supabase is operational truth.** Prospects, users, assignments, reviewed website opportunities, demos, mailings, events and engagement live in one state plane.
3. **Cloudflare Pages is delivery.** Hostnames are replaceable delivery configuration, not business identity.
4. **Verified facts are the AI trust boundary.** External content is untrusted until extracted/validated; Website Opportunity AI output remains a proposal until human-reviewed import.

## One system, two audiences

Current rollout:

```text
INTERNAL
https://soliddesign-cms.pages.dev

PUBLIC, TEMPORARY
https://soliddesign-cms.pages.dev/prospect/<slug>
```

Preferred final shape:

```text
INTERNAL
https://cms.<brand>.nl

PUBLIC
https://<brand>.nl/<slug>
```

There is no second public application. Both surfaces use the same prospect/demo state and LIVE artifact lifecycle.

## Team and work model

System permissions and prospect responsibility are deliberately separate.

```text
SYSTEM ROLE
ADMIN | KEY_USER | USER

PROSPECT RESPONSIBILITY
CASE_LEAD | DESIGN | OUTREACH
```

Assignments represent current responsibility. Events represent material history and actor attribution. There is no task or portfolio subsystem.

Authorization truth is the authenticated Auth UUID plus an active `team_members` row. The historical `operator_allowlist` model is retired and must not be recreated.

## Discovery boundary

Sector belongs to Discovery, not Design.

```text
human sector + location
→ research / Overture resolution
→ candidate
```

`canonical_sector_key` may remain as validated discovery/provenance metadata when naturally available. It is not a required prospect field and is not operator-facing design state.

A direct-URL prospect may remain unclassified and still use the complete downstream workflow.

## Evidence and Website Opportunity boundary

Technical website evidence and commercial interpretation are separate concepts:

```text
audits.findings
= technical / diagnostic evidence

prospects.qualification.website_opportunity
= human-reviewed ordered business interpretation
```

The review may select, combine, rephrase and prioritize evidence, but it does not overwrite `audits.findings` and does not create business facts. Array order is the only business priority model; no second score or severity taxonomy is introduced.

The current write boundary is one narrow RPC that validates active membership, prospect/audit ownership and the exact finding contract while preserving every unrelated `qualification.*` namespace.

## Prospect-first Design boundary

Once a candidate becomes a prospect, design decisions are based on the actual prospect:

```text
operator instruction
+ SolidDesign design method
+ Prospect Design Brief / verified facts
+ human-reviewed Website Opportunity priority + evidence
+ source website / assets / screenshots
+ current LIVE / current concept
+ other relevant evidence
```

No design process performs a sector lookup, applies a sector preset or requires manual prospect-sector linking.

The Design Brief projects Website Opportunity as priority + observed evidence only; full customer-facing sales prose is not used as design authority. `design_brief_note` remains a separate explicit operator direction field.

The Design tab exposes one primary ChatGPT action plus the existing artifact lifecycles. See `docs/PROSPECT_FIRST_DESIGN.md` and `docs/WEBSITE_OPPORTUNITY_REVIEW.md`.

## Print and Outreach boundary

The current production Print workflow remains manual and immutable: an operator creates a final PDF/PNG/JPG artifact and uploads a new version; Outreach registers the exact version physically sent.

The Printmailing surface reuses the same persisted Website Opportunity list so the operator does not retype or independently re-rank prospect-facing findings.

Prospect-facing before/after proof must depict the real current site and the exact intended SolidDesign concept. v5.1 adds no screenshot service or PDF-generation platform.

## Public delivery and engagement

`prospects.public_slug` is the stable public identity. The canonical public resolver maps:

```text
slug → prospect → current LIVE demo → stored artifact
```

New LIVE publication requires a canonical stored artifact. External HTTPS URLs remain DRAFT/review escape hatches rather than new LIVE delivery sources.

Engagement is first-party, minimal and operational. It stores no raw IP, IP hash, browser fingerprint or persistent visitor identifier.

## Existing pipeline components remain valid

Discovery, audit, qualification, Verified Facts, prospect-first Design, mock-up and immutable mailing components remain part of the same architecture. Providers can be replaced behind owned contracts without changing the business model.

Important stable abstractions include:

```text
External evidence
→ validation
→ VerifiedFacts

Technical / website evidence
→ human-reviewed Website Opportunity
→ Design + Print projection
```

## Reversibility

Website Opportunity v5.1 is intentionally additive:

- application behaviour is isolated on one feature change and can be reverted in Git;
- one removable RPC owns writes;
- no new table/column is required;
- persisted `qualification.website_opportunity` JSON is inert when readers are reverted and may remain to preserve history.

Do not add a feature-flag subsystem merely to make this small bounded change reversible.

## Explicit non-goals

Do not add without measured need:

- second frontend/application;
- second operational database;
- task/workflow engine;
- Kanban/Gantt/capacity planner;
- permission builder or per-dossier ACL framework;
- second analytics datastore or BI platform;
- visitor fingerprinting/session replay;
- autonomous sales workflow;
- generalized plugin/orchestration framework;
- general-purpose external preview proxy;
- reusable Sector Intelligence subsystem;
- sector design template/preset framework;
- Website Opportunity table/service/scoring engine;
- generic AI execution or generic AI-result import framework;
- screenshot service/browser farm.

## Change rule

A new architectural component must solve an observed customer or operator problem materially better than the existing simple path. Technical possibility is not sufficient justification.
