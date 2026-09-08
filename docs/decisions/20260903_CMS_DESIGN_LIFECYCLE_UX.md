# Decision — CMS design lifecycle UX

**Date:** 2026-09-03  
**Status:** PARTIALLY SUPERSEDED on 2026-09-09 by `20260909_PROSPECT_FIRST_DESIGN_SECTOR_RETIREMENT.md`

## Historical objective

Make the prospect design workflow simpler and unambiguous without coupling the UX release to separate repository/provider-boundary work.

## Still-current decisions

The following parts remain current:

- `Ontwerpversies` is the single visible lifecycle/status surface for website designs.
- `CONCEPT` and `LIVE` remain the version-state truth; publication is an explicit human action.
- `Nieuwste ontwerp ↗` remains a convenience link to the most recently created design version, regardless of LIVE/CONCEPT state. It is not a second lifecycle state.
- provider/private-repository work remains independent from ordinary operator Design UX.

## Superseded decisions

The following 2026-09-03 decisions are no longer current:

- `Sector voor design`;
- limiting design choices to published Sector Intelligence;
- known-sector suggestions in a `Koppel een sector` workflow;
- design-sector overrides through a prospect-sector RPC;
- `Sectoronderzoek` as a separate research/review workspace;
- Sector Intelligence responsibilities inside `operator/design-detail-ui.js` or separate Sector Intelligence browser modules.

Current Design is prospect-first and uses no sector lookup or reusable Sector Intelligence.

See:

- `docs/PROSPECT_FIRST_DESIGN.md`;
- `docs/decisions/20260909_PROSPECT_FIRST_DESIGN_SECTOR_RETIREMENT.md`.

## Current implementation ownership

- `operator/design-detail-ui.js` owns only prospect-detail design conveniences such as `Nieuwste ontwerp ↗`.
- `operator/design-process.js` owns the prospect-specific two-URL ChatGPT handoff and Design Brief generation.
- `operator/index.html` owns the visible Design controls and lifecycle labels.

The retired Sector Intelligence UI/linking modules are no longer part of current runtime.
