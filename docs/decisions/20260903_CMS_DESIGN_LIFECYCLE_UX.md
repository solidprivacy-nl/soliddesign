# Decision — CMS design lifecycle UX

**Date:** 2026-09-03  
**Status:** approved for production independently of repository-privacy cutover

## Objective

Make the prospect design workflow simpler and unambiguous without coupling the UX release to the separate GitHub/private-implementation boundary work.

## Current product truth

- `Ontwerpversies` is the single visible lifecycle/status surface for designs.
- `CONCEPT` and `LIVE` remain the version-state truth; publication is an explicit human action.
- `Nieuwste ontwerp ↗` is a convenience link to the most recently created design version, regardless of LIVE/CONCEPT state. It is not a second lifecycle state.
- `Sector voor design` is optional to change. The existing prospect sector remains selected by default.
- Optional design-sector choices are limited to sectors with published Sector Intelligence.
- In `Koppel een sector`, the sector field offers known Sector Intelligence entries as native dropdown suggestions while remaining free-text capable for a new sector.
- Choosing a known sector suggestion reuses its canonical sector key directly; typing a new sector still goes through the existing sector resolver.
- Sector linkage and design-sector overrides both reuse the existing canonical prospect-sector field/RPC; there is no second persistent sector-selection model.
- `Sectoronderzoek` remains the separate research/review workflow.

## Implementation ownership

- `operator/design-detail-ui.js`: prospect-detail design conveniences (`Nieuwste ontwerp`, optional sector selector).
- `operator/sector-intelligence-ui.js`: sector research/review/linking workspace and persistence.
- `operator/sector-link-suggestions.js`: native known-sector suggestions for the existing sector-link input; it does not persist sector state itself.
- `operator/index.html`: visible lifecycle labels and module wiring.

## Explicit separation from provider-boundary work

This UX release does **not** require the GitHub repository to be private and does not include the provider-blind bootstrap, same-origin AI contract, or production privacy guard from the separate provider-boundary candidate.

That security cutover remains isolated in its own Draft PR and can be completed later without blocking this approved CMS UX.
