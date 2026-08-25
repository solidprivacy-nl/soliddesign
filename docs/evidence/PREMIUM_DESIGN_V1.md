# Premium Design v1 Evidence

**Date:** 2026-08-25  
**Status:** PASS — ready for Gate 3 operational validation

## Objective

Improve the final pre-sale concept materially without turning SolidDesign into a design platform.

Hard constraint:

> **Solid but simple. Overengineering is a mortal sin.**

## Change made

The previous generic renderer was replaced by one restrained `authority_service` composition driven by a small deterministic `DesignProfile`.

No new application service, agent, queue, database, visual editor or template catalog was introduced.

The only new executable donor is `impeccable@3.6.0`, used in CI as deterministic design QA.

## Same-prospect comparison

The existing reviewed Gate-2 prospect was rebuilt with premium-v1 using the exact same verified prospect/audit/qualification evidence.

This isolates the design-layer change from discovery and qualification.

### Deterministic QA

```text
old concept Impeccable findings: 1
premium-v1 findings:           0
```

During implementation Impeccable also exposed additional design issues before the final spike, including:

- low contrast on a dark panel;
- an AI-like small hero eyebrow;
- excessive uppercase styling;
- numbered service rows;
- cramped proof-band spacing;
- a real-data category accent with insufficient small-text contrast.

Each was corrected at the renderer/token source. No exceptions or suppression list was added.

The normal CI now requires exactly zero Impeccable findings on the golden preview.

## Visual review

Desktop and mobile renders were reviewed side by side.

Premium-v1 is materially stronger than the Gate-2 concept in:

- typographic hierarchy;
- whitespace and pacing;
- perceived craft/premium quality;
- removal of generic equal-card layout;
- removal of the decorative gradient placeholder;
- CTA hierarchy;
- mobile composition;
- restrained visual identity appropriate for a local professional service business.

The design remains intentionally conservative. Trust and clarity outrank visual novelty.

## Current composition

```text
restrained navbar
→ authority hero
→ verified proof band when facts exist
→ editorial service list
→ contrast CTA
→ minimal footer
```

This is **one** Phase-1 composition, not a family/template system.

## Browser/deployment proof

The same real prospect was:

- rebuilt with premium-v1;
- rendered at desktop and mobile viewport sizes;
- scanned by Impeccable;
- deployed to a non-production branch of the existing shared Cloudflare Pages project;
- verified with a browser-representative HTTP request;
- confirmed `noindex` and form-free.

The temporary comparison workflow was removed after evidence collection. It is not production architecture.

## Remaining limitations

Premium-v1 does not yet solve every content/design opportunity:

- service descriptions are intentionally conservative because claims are fact-constrained;
- no verified company-image pipeline exists yet;
- one authority/service composition may not fit every future sector;
- visual acceptance still includes one short human check during Gate 3.

These are Gate-3 evidence questions, not reasons to pre-build more architecture.

## Decision

**GO to Gate 3 with premium-v1.**

Do not add another design family, image pipeline or AI design agent unless the five real Gate-3 prospects show a repeated, measured failure that the current composition cannot handle.
