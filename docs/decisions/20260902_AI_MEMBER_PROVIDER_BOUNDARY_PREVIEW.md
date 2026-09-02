# Decision candidate — AI member/provider boundary preview

**Date:** 2026-09-02  
**Status:** UX accepted; technical preview verified; production cutover not yet performed

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

- no prominent top-level `Live mock-up` shortcut;
- no redundant `Huidige live mock-up` summary above the same version history;
- version rows and their `CONCEPT` / `LIVE` state remain the lifecycle truth;
- publishing remains an explicit human action on a version;
- the automatically generated first concept is a concept, not a product-level current/live designation merely because it exists;
- `Nieuwste ontwerp` is a convenience link to the most recently created design version and is not a second status model;
- `Sector voor design` is optional to change: the prospect's existing canonical sector remains selected unless the operator deliberately chooses another sector with published Sector Intelligence;
- selecting another sector reuses the existing canonical sector field and RPC; no second sector-selection state is introduced.

## Canonical UI ownership

The approved prospect-detail UX is owned by `operator/design-detail-ui.js`.

That module owns:

- the `Nieuwste ontwerp` top action;
- the optional `Sector voor design` selector;
- published-sector choices for that selector;
- synchronization of the detail selector when sector research or prospect-sector linkage changes.

`operator/sector-intelligence-ui.js` owns the sector research/review/linking workspace and emits change events, but does not render a competing prospect-detail sector selector.

The earlier temporary `operator/design-ui-preview.js` has been removed. There is one implementation owner for the approved detail UX.

## Preview validation status

Completed on the isolated PR preview:

- provider-blind bootstrap instructions;
- the existing two-URL handoff;
- static CMS-owned prompt/Sector Intelligence delivery;
- one visible CMS design-lifecycle surface (`Ontwerpversies`);
- `Nieuwste ontwerp` linked to the newest CMS design version;
- optional published-sector selector;
- automated checks that AI-facing resources do not disclose GitHub or Supabase provider endpoints;
- automated checks that the redundant live-mock-up UI and temporary preview implementation do not reappear;
- PR-specific Cloudflare Pages deployment and smoke tests;
- UX review and acceptance by the user on 2026-09-02.

## Out-of-band production cutover

Repository visibility is a GitHub repository setting and cannot be meaningfully simulated by a branch. Therefore this PR deliberately does **not** change repository visibility.

Before production promotion:

1. run a one-time repository-history secret scan;
2. rotate any privileged credential that was ever committed, if found;
3. change the implementation repository to private;
4. verify the existing GitHub Actions/Cloudflare deployment still works from the private repository;
5. run a clean ChatGPT acceptance using only the SolidDesign start URL and Prospect Design Brief URL and no GitHub connector;
6. promote `0.4-preview` to the production prompt architecture version and merge only after those gates pass.

Prompt instructions are defense in depth and workflow guidance, not a substitute for repository privacy.

## Explicit non-goals

- hiding Supabase publishable browser credentials as if they were secrets;
- proxying all browser traffic merely to obscure the technology provider;
- granting every CMS member source-control access;
- creating a second identity, authorization or connector-distribution system;
- creating another design/version status model;
- creating a second persistent sector-selection model;
- preventing maintainers who are legitimately authorized for source control from using GitHub.

## Acceptance criteria

The candidate is acceptable for production promotion when:

1. CI passes;
2. the PR Pages preview deploys successfully;
3. `/start-design` and the canonical bootstrap on the preview contain no GitHub/Supabase implementation endpoints;
4. the bootstrap explicitly keeps internal SolidDesign context on the SolidDesign delivery surface while preserving external prospect/market research;
5. the CMS presents `Ontwerpversies` as the sole visible design lifecycle and no prominent `Live mock-up` shortcut or redundant live summary remains;
6. the approved `Nieuwste ontwerp` and optional published-sector selector are owned by the canonical detail UI module with no preview-only implementation left behind;
7. a clean ChatGPT environment can execute a representative SolidDesign design run from the two supplied SolidDesign URLs without a GitHub connector;
8. no production source-repository visibility or production prompt version is changed before explicit cutover.

## Governing rule

> Normal SolidDesign AI runs consume the SolidDesign product surface; source-control access is a separate maintainer capability. The operator sees one design lifecycle, not parallel technical representations of it.
