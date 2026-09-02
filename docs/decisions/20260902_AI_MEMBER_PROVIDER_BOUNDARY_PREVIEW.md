# Decision candidate — AI member/provider boundary preview

**Date:** 2026-09-02  
**Cutover execution updated:** 2026-09-03  
**Status:** UX accepted; technical preview verified; full-history secret scan passed; production cutover blocked only on repository visibility authority

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

## Cutover execution evidence — 2026-09-03

### Full-history secret scan

A one-time `gitleaks/gitleaks-action@v2` workflow checked out the repository with `fetch-depth: 0` and scanned the full Git history before repository privacy cutover.

Result: **PASS**.

- workflow: `Secret History Scan`
- run id: `33690707066`
- conclusion: `success`
- no privileged credential leak was detected;
- no credential rotation is required from this gate;
- the temporary scan workflow was removed immediately after the successful run so it does not become permanent infrastructure.

The existing Supabase browser publishable key remains intentionally browser-visible and is not treated as a privileged secret.

### Post-scan repository verification

After removal of the one-time scan workflow, the PR branch was re-verified:

- CI run `33690742981`: **success**;
- isolated Cloudflare Pages deploy/smoke run `33690742983`: **success**.

### Current blocker

The repository is still public. The GitHub capability available to this execution environment has repository `push` access but does not expose repository-administration/visibility mutation authority. The connected GitHub App installation for the repository likewise reports no `admin` or `maintain` capability through the available tool contract.

Therefore changing `solidprivacy-nl/soliddesign` from public to private is the single external action currently required before the remaining production cutover gates can be executed safely.

Do not merge while the repository is public: the production deployment workflow intentionally fails closed on a `main` push from a public repository.

## Remaining production cutover

1. change `solidprivacy-nl/soliddesign` repository visibility to **Private** in GitHub;
2. verify repository metadata reports `visibility=private`;
3. prove the existing GitHub Actions/Cloudflare deployment still works from the private repository;
4. run the final clean ChatGPT acceptance using only the SolidDesign start URL and Prospect Design Brief URL and no GitHub connector;
5. promote `0.4-preview` to the stable production prompt architecture version;
6. merge only after all gates pass and re-verify production.

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
7. the full-history secret scan passes before privacy cutover;
8. the source repository is private and deployment is proven from that private state;
9. a clean ChatGPT environment can execute a representative SolidDesign design run from the two supplied SolidDesign URLs without a GitHub connector;
10. the prompt architecture is promoted from preview to stable only after those gates pass.

## Governing rule

> Normal SolidDesign AI runs consume the SolidDesign product surface; source-control access is a separate maintainer capability. The operator sees one design lifecycle, not parallel technical representations of it.
