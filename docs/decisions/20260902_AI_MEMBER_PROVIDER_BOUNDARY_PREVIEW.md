# Decision candidate — AI member/provider boundary preview

**Date:** 2026-09-02  
**Status:** preview validation; not yet production-promoted

## Business objective

A normal SolidDesign team member must be able to start and complete the design workflow from a clean ChatGPT environment using the SolidDesign start URL and Prospect Design Brief URL, without configuring a personal GitHub connector and without needing to discover SolidDesign implementation infrastructure.

At the same time, implementation details such as repository identity, source paths, branches, pull requests and privileged infrastructure must not be part of the normal member-facing design contract.

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

IMPLEMENTATION CORE
GitHub source control
Supabase internals
Cloudflare deployment mechanics
        ↓
maintainer/developer concern only
```

No second public repository, AI gateway, generic context service, duplicate prompt store or general Supabase proxy is introduced.

## Preview scope

This PR may safely validate, without changing production behavior:

- provider-blind bootstrap instructions;
- the existing two-URL handoff;
- static CMS-owned prompt/Sector Intelligence delivery;
- automated checks that AI-facing resources do not disclose GitHub or Supabase provider endpoints;
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
6. only then promote the preview contract to the production prompt architecture version and merge.

Prompt instructions are defense in depth and workflow guidance, not a substitute for repository privacy.

## Explicit non-goals

- hiding Supabase publishable browser credentials as if they were secrets;
- proxying all browser traffic merely to obscure the technology provider;
- granting every CMS member source-control access;
- creating a second identity, authorization or connector-distribution system;
- preventing maintainers who are legitimately authorized for source control from using GitHub.

## Acceptance criteria

The candidate is acceptable when:

1. CI passes;
2. the PR Pages preview deploys successfully;
3. `/start-design` and the canonical bootstrap on the preview contain no GitHub/Supabase implementation endpoints;
4. the bootstrap explicitly keeps internal SolidDesign context on the SolidDesign delivery surface while preserving external prospect/market research;
5. a clean ChatGPT environment can execute a representative SolidDesign design run from the two supplied SolidDesign URLs without a GitHub connector;
6. no production source-repository visibility or production prompt version is changed before explicit cutover.

## Governing rule

> Normal SolidDesign AI runs consume the SolidDesign product surface; source-control access is a separate maintainer capability.
