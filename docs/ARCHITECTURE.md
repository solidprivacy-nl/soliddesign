# Architecture — SolidDesign

## Canonical architecture

The current operating architecture is defined in:

- `ENGINEERING_CONSTITUTION.md` — top-level engineering philosophy and decision standard;
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md` — current operating/system model;
- `docs/SECURITY.md` — current trust and authorization boundaries;
- `docs/AUTH_REDIRECTS.md` — current Supabase Auth Site URL / redirect contract for invite and login flows;
- `docs/ROADMAP.md` — current evidence-gated implementation status;
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md` — current hostname/public-delivery decision;
- `sector-intelligence/README.md` and `docs/SECTOR_INTELLIGENCE_LINKAGE.md` — current Sector Intelligence contract.

This document keeps the stable end-to-end business architecture concise.

## Documentation truth hierarchy

Documentation has different purposes and must not silently compete as multiple sources of truth.

Use this precedence when documents appear to conflict:

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

- current contract documents describe how the system is intended to work now;
- a later accepted decision supersedes conflicting earlier decision text;
- evidence documents preserve what was true at the time of a test and are not runtime contracts;
- completed implementation plans are historical execution records, not future architecture instructions;
- Git history preserves removed implementation detail; stale detail does not need to remain in current docs merely for archaeology;
- when runtime and current documentation diverge, reconcile them explicitly before extending that area further.

## Architecture objective

SolidDesign exists to support one commercial learning loop with the smallest reliable operational surface.

```text
DISCOVERY
→ QUALIFICATION / AUDIT
→ VERIFIED FACTS
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

1. **GitHub is software/design truth.** Code, tests, architecture, prompts, decisions and roadmap live here.
2. **Supabase is operational truth.** Prospects, users, assignments, demos, mailings, events and engagement live in one state plane.
3. **Cloudflare Pages is delivery.** Internal and public hostnames are replaceable delivery configuration, not business identity.
4. **Verified facts are the AI trust boundary.** External content is untrusted until extracted/validated.

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

Supabase Auth invitation/login redirects follow the **internal** hostname contract, never the public prospect hostname. The current/future allowed destinations and preview rules are defined in `docs/AUTH_REDIRECTS.md`.

## Team and work model

System permissions and prospect responsibility are deliberately separate.

```text
SYSTEM ROLE
ADMIN | KEY_USER | USER

PROSPECT RESPONSIBILITY
CASE_LEAD | DESIGN | OUTREACH
```

Assignments represent current responsibility. The event log represents history and actor attribution. Personal work queues/portfolios are derived from assignments; there is no task or portfolio subsystem.

Authorization truth is the authenticated Auth UUID plus an active `team_members` row. `operator_is_active_team_member()` is the common membership predicate used by RLS/RPC/server capabilities. The historical `operator_allowlist` model was retired from production on 2026-08-30 and must not be recreated as a second authority.

## Sector Intelligence boundary

Sector Intelligence is reusable advisory design knowledge keyed by a prospect's one primary `canonical_sector_key`.

Discovery provenance and sector identity remain separate facts. A prospect may inherit a known single-sector discovery identity automatically, but an operator can explicitly assign or correct the sector for any relevant company/prospect, including one added through a direct URL.

The CMS exposes only domain concepts such as sector label, availability, review state and research content. Engineering storage/versioning/review transport stays behind one narrow server-side façade and is not exposed to normal CMS users.

Sector research uses the human market term and location. Optional natural-language operator direction may guide research but is challengeable evidence, not truth. No separate reference library, research database or many-to-many sector model exists.

## Public delivery and engagement

`prospects.public_slug` is the stable public identity. The canonical public resolver maps:

```text
slug → prospect → current LIVE demo → stored artifact
```

New LIVE publication requires a canonical stored artifact. An external HTTPS URL may be used as a DRAFT/review escape hatch but is not a new LIVE delivery source.

A bounded compatibility path exists only for the small set of grandfathered LIVE previews created before this rule. It may proxy only explicitly allowlisted historical SolidDesign preview hosts and should disappear when those records are migrated or retired. It is not a general reverse-proxy capability.

Engagement is first-party, minimal and operational:

```text
opening
active visible time
max scroll
device class
QR/direct
internal/external
```

It does not identify a person and stores no raw IP, IP hash, browser fingerprint or persistent visitor identifier.

## Existing pipeline components remain valid

The existing discovery, audit, qualification, Verified Facts, conversion/design, mock-up and print-pack components remain part of the same architecture. Providers can be replaced behind their owned contracts without changing the business model.

Important stable abstractions include:

```text
DiscoverySource → Prospect[]

External evidence
→ validation
→ VerifiedFacts

VerifiedFacts + design context
→ SiteConfig / static mock-up
```

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
- Sector Intelligence reference-management or taxonomy-management subsystem.

## Change rule

A new architectural component must solve an observed customer or operator problem materially better than the existing simple path. Technical possibility is not sufficient justification.
