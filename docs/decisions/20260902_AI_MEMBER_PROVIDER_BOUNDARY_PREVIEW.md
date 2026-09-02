# Decision candidate — AI member/provider boundary preview

**Date:** 2026-09-02  
**Status:** preview validation; not yet production-promoted

## Business objective

A normal SolidDesign team member must be able to start and complete the design workflow from a clean ChatGPT environment using the SolidDesign start URL and Prospect Design Brief URL, without configuring a personal GitHub connector and without needing to discover SolidDesign implementation infrastructure.

At the same time, implementation details such as repository identity, source paths, branches, pull requests and privileged infrastructure must not be part of the normal member-facing design contract.

The CMS must present that same simplification in the operator interface: design lifecycle and current-design status are owned by one visible `Ontwerpversies` workspace rather than a separate prominent `Live mock-up` shortcut plus a second version model.

## Smallest complete design

Keep the existing architecture and tighten its boundary:

```text
TEAM MEMBER / CHATGPT
        ↓
SolidDesign CMS origin
/start-design
/brief/<token>
/prompts/*
/sector-intelligence/*
        ↓
design / research / critique / mock-up work

CMS DESIGN LIFECYCLE
Ontwerpversies
→ CONCEPT
→ explicit human publication
→ LIVE/current design

IMPLEMENTATION CORE
GitHub source control
Supabase internals
Cloudflare deployment mechanics
        ↓
maintainer/developer concern only
```

No second public repository, AI gateway, generic context service, duplicate prompt store or general Supabase proxy is introduced. No second visible design-status surface is introduced either.

## CMS interface rule

`Ontwerpversies` is the single visible source of truth for design lifecycle state.

- remove the prominent top-level `Live mock-up` shortcut from the operator-facing interface;
- do not show a second redundant `Huidige live mock-up` summary above the same version history;
- keep version rows and their `CONCEPT` / `LIVE` state as the lifecycle truth;
- publishing remains an explicit human action on a version;
- the automatically generated first concept is a concept, not a product-level current/live designation merely because it exists;
- technical preview mechanics may remain in code for compatibility, but they are not a competing visible workflow.

## Preview scope

This PR may safely validate, without changing production behavior:

- provider-blind bootstrap instructions;
- the existing two-URL handoff;
- static CMS-owned prompt/Sector Intelligence delivery;
- one visible CMS design-lifecycle surface (`Ontwerpversies`);
- automated checks that AI-facing resources do not disclose GitHub or Supabase provider endpoints;
- automated checks that the redundant live-mock-up UI does not reappear;
- PR-specific Cloudflare Pages deployment and smoke tests;
- a manual clean-ChatGPT acceptance run against the PR preview.

## Out-of-band production cutover

Repository visibility is a GitHub repository setting and cannot be meaningfully simulated by a branch. Therefore this PR deliberately does **not** change repository visibility.

Before production promotion:

1. run a one-time repository-history secret scan;
2. rotate any privileged credential that was ever committed, if found;
3. change the implementation repository to private;
4. verify the existing GitHub Actions/Cloudflare deployment still works from the private repository;
5. run a clean ChatGPT acceptance using only the SolidDesign start URL and Prospect Design Brief URL and no GitHub connector;
6. visually accept the `Ontwerpversies` single-source CMS workflow in the PR preview;
7. only then promote the preview contract to the production prompt architecture version and merge.

Prompt instructions are defense in depth and workflow guidance, not a substitute for repository privacy.

## Explicit non-goals

- hiding Supabase publishable browser credentials as if they were secrets;
- proxying all browser traffic merely to obscure the technology provider;
- granting every CMS member source-control access;
- creating a second identity, authorization or connector-distribution system;
- creating another design/version status model;
- preventing maintainers who are legitimately authorized for source control from using GitHub.

## Acceptance criteria

The candidate is acceptable when:

1. CI passes;
2. the PR Pages preview deploys successfully;
3. `/start-design` and the canonical bootstrap on the preview contain no GitHub/Supabase implementation endpoints;
4. the bootstrap explicitly keeps internal SolidDesign context on the SolidDesign delivery surface while preserving external prospect/market research;
5. the CMS presents `Ontwerpversies` as the sole visible design lifecycle and no prominent `Live mock-up` shortcut or redundant live summary remains;
6. a clean ChatGPT environment can execute a representative SolidDesign design run from the two supplied SolidDesign URLs without a GitHub connector;
7. no production source-repository visibility or production prompt version is changed before explicit cutover.

## Governing rule

> Normal SolidDesign AI runs consume the SolidDesign product surface; source-control access is a separate maintainer capability. The operator sees one design lifecycle, not parallel technical representations of it.
