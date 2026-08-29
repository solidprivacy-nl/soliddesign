# Architecture — SolidDesign

## Canonical architecture

The current operating architecture is defined in:

- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`

This document keeps the stable end-to-end business architecture concise. Older implementation details remain available in Git history and must not be treated as a second source of truth.

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

## Team and work model

System permissions and prospect responsibility are deliberately separate.

```text
SYSTEM ROLE
ADMIN | KEY_USER | USER

PROSPECT RESPONSIBILITY
CASE_LEAD | DESIGN | OUTREACH
```

Assignments represent current responsibility. The event log represents history and actor attribution. Personal work queues/portfolios are derived from assignments; there is no task or portfolio subsystem.

## Public delivery and engagement

`prospects.public_slug` is the stable public identity. The public resolver maps:

```text
slug → prospect → current LIVE demo → existing artifact
```

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
- generalized plugin/orchestration framework.

## Change rule

A new architectural component must solve an observed customer or operator problem materially better than the existing simple path. Technical possibility is not sufficient justification.
